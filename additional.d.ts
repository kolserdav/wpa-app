import type * as E from 'express';

declare global {
  namespace Backend {
    type Status = 'error' | 'warning' | 'success';

    interface Result<T> {
      status: Status;
      message: string;
      data: T;
      stdErrMessage?: string;
      code?: string;
      token?: string;
      skip?: number | null;
      take?: number | null;
      count?: number | null;
    }
    interface ParamsDictionary {
      [key: string]: string;
    }

    export interface RequestHandler<Query, Body, Response> {
      (
        req: E.Request<ParamsDictionary, Result<Response | null>, Body, Query>,
        res: E.Response<Result<Response | null>>
      ): Promise<E.Response<Result<Response | null>, Record<string, Response>>>;
    }

    export interface NextHandler<Query, Body, Response> {
      (
        req: E.Request<ParamsDictionary, Result<null>, Body, Query>,
        res: E.Response<Result<any>>,
        next: E.NextFunction
      ): Promise<E.Response<Result<any>, Record<string, any>> | void>;
    }
  }
  namespace Frontend {}
}
