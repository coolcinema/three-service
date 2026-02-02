import { DynamicModule, Module, Global } from "@nestjs/common"; // Требует @nestjs/common в devDependencies или peerDependencies
import { createClients } from "../nice/factory";

@Global()
@Module({})
export class GrpcModule {
  static forRoot(
    registry: any,
    definitions: Record<string, any>,
  ): DynamicModule {
    // Создаем клиенты через Nice factory
    const clients = createClients(registry, definitions);

    const providers = Object.entries(clients).map(([name, client]) => ({
      provide: `${name}Service`, // Token: "identityService"
      useValue: client,
    }));

    return {
      module: GrpcModule,
      providers: providers,
      exports: providers.map((p) => p.provide),
    };
  }
}
