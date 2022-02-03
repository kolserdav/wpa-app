/**
 * Файл запросов на сервер
 */
import axios from 'axios';

interface RequestParams {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  server: string;
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
 * Псевдо метод запроса на сервер
 * @param args
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function send(props: RequestParams): Promise<any> {
  const { method, url, body, params, headers, responseType, server } = props;
  const _headers = { ...headers } || {};
  let newUrl = `${server}/${url}`;
  newUrl = responseType === 'blob' ? `${process.env.NEXT_PUBLIC_SERVER}/${url}` : newUrl;
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
