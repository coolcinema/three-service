export const CONTEXT_KEYS = {
  TRACE_ID: "x-trace-id",
  REQUEST_ID: "x-request-id",
  TELEPRESENCE: "x-telepresence-intercept-id",
} as const;

// Список заголовков для автоматического проброса
export const PROPAGATION_HEADERS = Object.values(CONTEXT_KEYS);
