import * as E from 'express';
import JWT from 'jsonwebtoken';

const dev = process.env.NODE_ENV === 'development';

export function getStdErrMessage(err: Error | any) {
  return dev ? err.message : 'Standart error disabled in production';
}

/**
 * Единая функция для вывода в лог
 */
export function saveLog({
  err,
  req,
  message,
  body,
}: {
  err: Error | null | any;
  req: E.Request<any, any, any, any>;
  message: string;
  body?: any;
}): void {
  if (err) {
    console.error(new Date(), message, err, {
      url: req.url,
      headers: req.headers,
      body,
    });
  } else {
    console.warn(new Date(), message, req.body.args, body);
  }
}

/**
 * Серриализует bigint для next
 */
export const serializeBigInt = (object: any): any => {
  if (!object) {
    return object;
  }
  const keys = Object.keys(object);
  const newObj = { ...object };
  for (let i = 0; keys[i]; i++) {
    const key = keys[i];
    const val = object[key];
    if (typeof val === 'bigint') {
      newObj[key] = parseInt(val.toString(), 10);
    }
  }
  return newObj;
};

/**
 * парсинг токена авторизации
 */
export function parseToken(token: string, req: E.Request): Backend.JWT | null {
  if (!token || token === 'null' || token === 'undefined') {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = null;
  try {
    data = jwt.verify(token.replace(/Bearer\s*/, ''), JSONWEBTOKEN_KEY);
  } catch (e) {
    if (token !== 'null') {
      saveLog(e, req, 'Error parse token', { token });
    }
    return null;
  }
  return data;
}
