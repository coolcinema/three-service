import { AsyncLocalStorage } from "async_hooks";

export interface AppContext {
  traceId?: string;
  headers: Record<string, string | string[]>;
}

export const contextStorage = new AsyncLocalStorage<AppContext>();

export const runInContext = <T>(ctx: AppContext, fn: () => T): T => {
  return contextStorage.run(ctx, fn);
};

export const getCurrentContext = () => contextStorage.getStore();
