import { DynamicModule, Module, Global } from "@nestjs/common";
import { createClients } from "../nice/factory";
import { IRegistry } from "src/types";

@Global()
@Module({})
export class GrpcModule {
  static forRoot(
    registry: IRegistry,
    definitions: Record<string, any>,
  ): DynamicModule {
    const clients = createClients(registry, definitions);

    const providers = Object.entries(clients).map(([name, client]) => {
      const token = `${name}Service`;

      console.log(`[Foundation] Registering gRPC client: @Inject('${token}')`);

      return {
        provide: token,
        useValue: client,
      };
    });

    return {
      module: GrpcModule,
      providers: providers,
      exports: providers.map((p) => p.provide),
    };
  }
}
