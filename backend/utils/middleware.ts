/**
 * Глобальные посредники
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { parseToken, getStdErrMessage, saveLog } from '../utils';

const prisma = new PrismaClient();

/**
 * Глобальные поля которые запрещено менять напрямую // TODO
 */
const GLOBAL_CLOSED_FIELDS_FOR_ALL = [
  'password',
  'email',
  'confirmKey',
  'confirmed',
  'createConfirm',
  'forgotKey',
  'createForgot',
  'created_at',
  'updated_at',
];

interface Auth<T> {
  onlyForAdmin: boolean;
}

/**
 * Параметры аутентификации
 */
interface CheckRoleParams<
  Model extends keyof typeof Prisma.ModelName,
  Field extends keyof typeof Prisma['Wp_usersScalarFieldEnum']
> {
  /**
   * Открыть только для админа
   */
  onlyAdmin?: boolean;
  /**
   * Закрыть узел для доступа того кому не пренадлежить модель
   */
  selfUsage?: {
    /**
     * Название модели см. `src/orm/prisma.schema`
     */
    model: Model;
    /**
     * Поле которое должно соответствовать id пользователя делающего запрос
     */
    field: Field;
    /**
     * Если `true`, то запрос открыт и для админа
     */
    andAdmin?: boolean;
    /**
     * Список полей которые пользователь не может менять.
     * Если andAdmin=true то не действует на админа
     */
    closedSelf?: (Field | keyof typeof Prisma.ModelName)[];
    /**
     * Список полей которые администратор не может менять если даже andAdmin=tue.
     */
    closedAdmin?: (Field | keyof typeof Prisma.ModelName)[];
  };
}

/**
 * служебная функция делает строчным первый символ строки
 * @param string
 * @returns
 */
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

/**
 * Функция авторизации,
 * возвращает посредника, которого при необходимости закрыть
 * роут добавляем в индексный файл с передачей CheckRoleParams
 * и параметров для генерика см. src/index.ts
 * @param params
 * @returns
 */
export const auth = <Model extends keyof typeof Prisma.ModelName>(
  params: CheckRoleParams<
    keyof typeof Prisma.ModelName,
    // @ts-ignore
    keyof typeof Prisma[`${Model}ScalarFieldEnum`]
  >
): Backend.NextHandler<any, any, any> => {
  const { onlyAdmin, selfUsage } = params;
  return async (req, res, next) => {
    const { body } = req;
    const { lang, args: _args } = body;
    const args = _args || {};
    const { authorization }: any = req.headers;
    const parsedToken = parseToken(authorization, req);
    if (parsedToken === null) {
      return res.status(403).json({
        status: 'error',
        message: lang.FORBIDDEN,
        stdErrMessage: getStdErrMessage(new Error('Parse token error')),
        data: null,
      });
    }
    const { id, password } = parsedToken;
    let user;
    try {
      user = await prisma.wp_users.findUnique({ where: { ID: id } });
    } catch (err) {
      saveLog({
        err,
        req,
        message: 'Error get user by id in auth middleware',
        body: { parsedToken },
      });
      return res.status(500).json({
        status: 'error',
        message: '',
        stdErrMessage: getStdErrMessage(err),
        data: null,
      });
    }
    if (user === null) {
      return res.status(403).json({
        status: 'warning',
        message: lang.FORBIDDEN,
        stdErrMessage: getStdErrMessage(new Error(`User not found ${JSON.stringify(parsedToken)}`)),
        data: null,
      });
    }
    req.body.user = user;
    if (user.user_pass !== password) {
      return res.status(403).json({
        status: 'warning',
        message: lang.FORBIDDEN,
        stdErrMessage: getStdErrMessage(
          new Error(`Password was changed ${JSON.stringify(parsedToken)}`)
        ),
        data: null,
      });
    }
    const _admin = user.role === 'admin';
    if (onlyAdmin && !_admin) {
      return res.status(401).json({
        status: 'warning',
        message: lang.UNAUTHORIZED,
        stdErrMessage: getStdErrMessage(new Error('Only for admin')),
        data: null,
      });
    }
    let selfResult;
    if (selfUsage) {
      if (!args) {
        return res.status(400).json({
          status: 'warning',
          message: lang.SERVER_ERROR,
          stdErrMessage: getStdErrMessage(new Error('Argument args is missing')),
          data: null,
        });
      }
      if (!args.where) {
        return res.status(400).json({
          status: 'warning',
          message: lang.SERVER_ERROR,
          stdErrMessage: getStdErrMessage(new Error('Argument args.where is missing')),
          data: null,
        });
      }
      const { where } = args;
      try {
        // @ts-ignore
        selfResult = await prisma[capitalizeFirstLetter(selfUsage.model)].findUnique({
          where,
          select: {
            [selfUsage.field]: true,
          },
        });
      } catch (err) {
        saveLog({ err, req, message: 'Error auth multi find first', body: { selfUsage } });
        return res.status(500).json({
          status: 'error',
          message: lang.SERVER_ERROR,
          stdErrMessage: getStdErrMessage(err),
          data: null,
        });
      }
      // Если не найден результат по ид переданной в `model` модели
      if (selfResult === null) {
        return res.status(403).json({
          status: 'warning',
          message: lang.FORBIDDEN,
          stdErrMessage: getStdErrMessage(new Error('Self model is not defined')),
          data: null,
        });
      }
      // Если ид токена не равен ид поля в котором должен быть ид владельца
      if (
        parsedToken.id !== selfResult[selfUsage.field] &&
        // если не запрашивает Default объект
        selfResult[selfUsage.field] !== 'application/octet-stream'
      ) {
        // Если не админ или админу тоже не разрешено
        if (!(_admin && selfUsage.andAdmin)) {
          return res.status(401).json({
            status: 'warning',
            message: lang.UNAUTHORIZED,
            stdErrMessage: getStdErrMessage(new Error('Only for admins. Or only for yourself.')),
            data: null,
          });
        }
      }
    }

    // Проверка закрытых полей для самосоятельной замены
    const closedSelf = params.selfUsage?.closedSelf;
    if (closedSelf && closedSelf?.length !== 0 && !(_admin && selfUsage?.andAdmin)) {
      for (const prop in args.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyProp: any = prop;
        if (
          closedSelf.indexOf(anyProp) !== -1 ||
          GLOBAL_CLOSED_FIELDS_FOR_ALL.indexOf(anyProp) !== -1
        ) {
          return res.status(401).json({
            status: 'warning',
            message: lang.UNAUTHORIZED,
            stdErrMessage: getStdErrMessage(new Error(`Field "${prop}" can't update yourself`)),
            data: null,
          });
        }
      }
    }
    // Проверка закрытых полей для подмены админом
    const closedAdmin = params.selfUsage?.closedAdmin;
    if (
      closedAdmin &&
      closedAdmin?.length !== 0 &&
      _admin &&
      selfUsage?.andAdmin &&
      parsedToken.id !== selfResult.id
    ) {
      for (const prop in args.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyProp: any = prop;
        if (
          closedAdmin.indexOf(anyProp) !== -1 ||
          GLOBAL_CLOSED_FIELDS_FOR_ALL.indexOf(anyProp) !== -1
        ) {
          return res.status(401).json({
            status: 'warning',
            message: lang.UNAUTHORIZED,
            stdErrMessage: getStdErrMessage(new Error(`Field "${prop}" can't update by admin`)),
            data: null,
          });
        }
      }
    }
    req.body.parsedToken = parsedToken;
    next();
  };
};
