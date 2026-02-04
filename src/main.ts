import { ThreeServiceImpl } from "./three.service";
import { startConsumer } from "./consumer";
import { Registry } from "@coolcinema/contracts";
import { ThreeServiceDefinition } from "./_gen/grpc/grpc/three";

import { createServer } from "nice-grpc";
async function main() {
  // 1. gRPC
  const server = createServer();
  server.add(ThreeServiceDefinition, new ThreeServiceImpl());

  const serviceDef = Registry.services["three"];
  const port = 5000;

  await server.listen(`0.0.0.0:${port}`);
  console.log(`🚀 Three Service listening on port ${port}`);

  // 2. Events
  await startConsumer();
}

main();
