import createFetchClient, { Client } from "openapi-fetch";
import { getCurrentContext } from "../context/store";
import { Propagator } from "../context/propagator";

export function createClient<Paths extends {}>(
  registry: any,
  serviceSlug: string,
  interfaceName: string = "main", // Имя интерфейса (секции http) по умолчанию
): Client<Paths> {
  const serviceConfig = registry.services[serviceSlug];

  if (!serviceConfig) {
    throw new Error(`Service '${serviceSlug}' not found in Registry`);
  }

  // Строгий выбор порта из контракта
  const interfaceConfig = serviceConfig.http?.[interfaceName];

  if (!interfaceConfig || !interfaceConfig.port) {
    throw new Error(
      `HTTP Interface '${interfaceName}' not found (or has no port) for service '${serviceSlug}'. ` +
        `Check coolcinema.yaml: http.${interfaceName}`,
    );
  }

  const baseURL = `http://${serviceConfig.host}:${interfaceConfig.port}`;

  // Создаем клиент
  const client = createFetchClient<Paths>({
    baseUrl: baseURL,
    // Типизированный custom fetch
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      // Нормализация заголовков (могут быть undefined или Headers)
      const headers = new Headers(init?.headers);

      // Inject Context
      const ctx = getCurrentContext();
      Propagator.inject(ctx, (key, values) => {
        values.forEach((v) => headers.append(key, v));
      });

      return fetch(input, {
        ...init,
        headers,
      });
    },
  });

  return client;
}

/**
 * Создает коллекцию типизированных клиентов.
 * @example
 * const clients = Http.createClients<MyClientsType>(Registry, {
 *   sales: 'sales-service',
 *   tickets: 'tickets-service'
 * });
 */
export function createClients<T>(
  registry: any,
  serviceMap: Record<keyof T, string>,
): T {
  const clients = {} as any;

  for (const [key, slug] of Object.entries(serviceMap)) {
    // Создаем клиент для каждого сервиса
    // Типизация (Client<Paths>) ляжет сверху благодаря дженерику T
    clients[key] = createClient(registry, slug as string);
  }

  return clients as T;
}
