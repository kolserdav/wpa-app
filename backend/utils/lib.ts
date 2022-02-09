import * as E from 'express';

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
