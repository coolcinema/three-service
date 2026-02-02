import { SalesServiceImpl } from "./sales.service";
import { startConsumer } from "./consumer";
import { Registry } from "@coolcinema/contracts";
import { SalesServiceDefinition } from "./_gen/grpc/grpc/sales";

import { createServer } from "nice-grpc";
async function main() {
  // 1. gRPC
  const server = createServer();
  server.add(SalesServiceDefinition, new SalesServiceImpl());

  const serviceDef = Registry.services["sales"];
  const port = 5002;

  await server.listen(`0.0.0.0:${port}`);
  console.log(`🚀 Sales Service listening on port ${port}`);

  // 2. Events
  await startConsumer();
}

main();
