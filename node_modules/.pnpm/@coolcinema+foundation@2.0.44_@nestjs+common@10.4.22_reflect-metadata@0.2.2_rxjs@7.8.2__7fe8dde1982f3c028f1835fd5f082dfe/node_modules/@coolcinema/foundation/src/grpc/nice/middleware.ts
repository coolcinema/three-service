import {
  ClientMiddleware,
  ClientMiddlewareCall,
  ServerMiddleware,
  ServerMiddlewareCall,
  CallContext,
  Metadata,
  CallOptions,
} from "nice-grpc";
import { getCurrentContext, runInContext } from "../../context/store";
import { CONTEXT_KEYS, PROPAGATION_HEADERS } from "../../context/keys";
import { Propagator } from "../../context/propagator";

export const clientMiddleware: ClientMiddleware = async function* <
  Request,
  Response,
>(call: ClientMiddlewareCall<Request, Response>, options: CallOptions) {
  const ctx = getCurrentContext();

  if (ctx) {
    const metadata =
      options.metadata instanceof Metadata
        ? options.metadata
        : new Metadata(options.metadata);

    Propagator.inject(ctx, (key, values) => {
      values.forEach((v) => metadata.append(key, v));
    });

    options.metadata = metadata;
  }

  return yield* call.next(call.request, options);
};

export const serverMiddleware: ServerMiddleware = async function* <
  Request,
  Response,
>(call: ServerMiddlewareCall<Request, Response>, context: CallContext) {
  const metadata = context.metadata;
  const headers: Record<string, string | string[]> = {};

  for (const key of PROPAGATION_HEADERS) {
    const val = metadata.get(key);
    if (val) {
      headers[key] = Array.isArray(val) ? val.map(String) : String(val);
    }
  }

  const appCtx = {
    traceId:
      typeof headers[CONTEXT_KEYS.TRACE_ID] === "string"
        ? (headers[CONTEXT_KEYS.TRACE_ID] as string)
        : undefined,
    headers,
  };

  const generator = runInContext(appCtx, () =>
    call.next(call.request, context),
  );
  return yield* generator;
};
