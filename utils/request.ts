/**
 * Файл запросов на сервер
 */
import axios from 'axios';
import { Prisma as P, PrismaPromise, wp_users } from '@prisma/client';

interface RequestParams {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  server?: string;
  url: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers?: any;
  responseType?: 'arraybuffer' | 'json' | 'blob';
}

/**
 * Метод запроса на сервер
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function send(props: RequestParams): Promise<any> {
  const { method, url, body, params, headers, responseType, server } = props;
  const _server = server || '';
  const _headers = { ...headers } || {};
  const newUrl = `${_server}${url}`;
  return new Promise((resolve) => {
    axios
      .request({
        method: method || 'POST',
        url: newUrl,
        data: body,
        params,
        headers: _headers,
        responseType: responseType || 'json',
      })
      .then((result) => {
        resolve(result.data);
      })
      .catch((error) => {
        if (!error.response) {
          // eslint-disable-next-line no-console
          console.error(error);
          resolve({
            status: 'error',
            message: 'No internet',
            data: null,
          });
        } else {
          resolve(error.response.data);
        }
      });
  });
}

/**
 * Получить одного пользователя
 */
export async function userFindFirst<T extends P.wp_usersFindFirstArgs>(
  args: P.SelectSubset<T, P.wp_usersFindFirstArgs>
): Promise<
  P.CheckSelect<
    T,
    Backend.Result<wp_users | null>,
    PrismaPromise<Backend.Result<P.wp_usersGetPayload<T>>>
  >
> {
  return send({
    url: '/api/user/findFirst',
    body: { args },
  });
}
