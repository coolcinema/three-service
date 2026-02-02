//  packages/foundation/src/events/nest/module.ts
import { DynamicModule, Module, Global, Provider } from "@nestjs/common";
import { AmqpTransport } from "../amqp";
import { createPublisher } from "../factory";

export interface EventsModuleOptions {
  name: string; // Token for injection
  definitions: any;
  registry: any;
  prefix?: string;
}

@Global()
@Module({})
export class EventsModule {
  static register(options: EventsModuleOptions): DynamicModule {
    const transportProvider: Provider = {
      provide: "AMQP_TRANSPORT",
      useFactory: () => new AmqpTransport(options.registry),
    };

    const publisherProvider: Provider = {
      provide: options.name,
      useFactory: (transport: AmqpTransport) => {
        return createPublisher(transport, options.definitions, options.prefix);
      },
      inject: ["AMQP_TRANSPORT"],
    };

    return {
      module: EventsModule,
      providers: [transportProvider, publisherProvider],
      exports: [publisherProvider],
    };
  }
}
