import {
  createChannel,
  createClientFactory,
  ChannelCredentials,
  Client,
} from "nice-grpc";
import { CompatServiceDefinition } from "nice-grpc/lib/service-definitions";
import { clientMiddleware } from "./middleware";

const factory = createClientFactory().use(clientMiddleware);

export function createClients<
  Defs extends Record<string, CompatServiceDefinition>,
>(
  registry: any, // Типизировать по желанию
  definitions: Defs,
  serviceMap?: Record<keyof Defs, string>,
): { [K in keyof Defs]: Client<Defs[K]> } {
  const clients = {} as any;

  for (const [key, def] of Object.entries(definitions)) {
    const slug = serviceMap?.[key] || key;
    const serviceConfig = registry.services[slug];

    if (!serviceConfig?.grpc?.main) {
      console.warn(`⚠️ No gRPC config for ${slug}`);
      continue;
    }

    const address = `${serviceConfig.host}:${serviceConfig.grpc.main.port}`;
    const channel = createChannel(address, ChannelCredentials.createInsecure());
    clients[key] = factory.create(def, channel);
  }

  return clients;
}
