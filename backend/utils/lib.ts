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
