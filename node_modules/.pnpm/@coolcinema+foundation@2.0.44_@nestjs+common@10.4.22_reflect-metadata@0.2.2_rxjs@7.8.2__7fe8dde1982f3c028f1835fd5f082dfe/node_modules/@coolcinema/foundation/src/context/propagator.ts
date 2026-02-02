import { CONTEXT_KEYS } from "./keys";
import { AppContext } from "./store";

export type HeaderSetter = (key: string, values: string[]) => void;

export const Propagator = {
  inject(ctx: AppContext | undefined, setHeader: HeaderSetter) {
    if (!ctx) return;

    if (ctx.traceId) {
      setHeader(CONTEXT_KEYS.TRACE_ID, [ctx.traceId]);
    }

    for (const [key, value] of Object.entries(ctx.headers)) {
      if (key === CONTEXT_KEYS.TRACE_ID) continue;

      const values = Array.isArray(value) ? value : [value];
      setHeader(key, values);
    }
  },
};
