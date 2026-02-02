import { z } from "zod";

export interface RouteOptions<
  P extends z.ZodTypeAny = z.ZodTypeAny,
  B extends z.ZodTypeAny = z.ZodTypeAny,
  Q extends z.ZodTypeAny = z.ZodTypeAny,
  R extends z.ZodTypeAny = z.ZodTypeAny,
> {
  method: "get" | "post" | "put" | "delete" | "patch";
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  params?: P;
  query?: Q;
  body?: B;
  response: R;
  status?: number; // Default 200
}

export function createRoute<
  P extends z.ZodTypeAny,
  B extends z.ZodTypeAny,
  Q extends z.ZodTypeAny,
  R extends z.ZodTypeAny,
>(options: RouteOptions<P, B, Q, R>) {
  const status = options.status || 200;

  // Формируем Operation Object для zod-openapi
  const operation: any = {
    summary: options.summary,
    description: options.description,
    tags: options.tags,
    responses: {
      [status]: {
        description: "Success",
        content: {
          "application/json": { schema: options.response },
        },
      },
    },
  };

  // Параметры (Path, Query)
  if (options.params || options.query) {
    operation.requestParams = {};
    if (options.params) operation.requestParams.path = options.params;
    if (options.query) operation.requestParams.query = options.query;
  }

  // Тело запроса
  if (options.body) {
    operation.requestBody = {
      content: {
        "application/json": { schema: options.body },
      },
    };
  }

  return {
    path: options.path,
    method: options.method,
    config: operation,
    // Тип функции-обработчика для реализации
    Handler: {} as (req: {
      params: z.infer<P>;
      query: z.infer<Q>;
      body: z.infer<B>;
    }) => Promise<z.infer<R>>,
  };
}

/**
 * Утилита для вывода типов хендлеров из объекта роутов.
 */
export type InferHandlers<T extends Record<string, { Handler: any }>> = {
  [K in keyof T]: T[K]["Handler"];
};
