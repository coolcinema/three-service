import { Events } from "@coolcinema/foundation";
import { Registry } from "@coolcinema/contracts";
import { GatewayEventsDefinition } from "./_gen/grpc/gateway-service_events_main";

export async function startConsumer() {
  const transport = new Events.AmqpTransport(Registry);
  const consumer = Events.createConsumer(transport, "sales-service");

  console.log("[Sales] Starting Consumer...");

  await consumer.subscribe(
    GatewayEventsDefinition,
    "ticketSold",
    "gateway",
    async (payload) => {
      console.log(`[Sales] 🎫 EVENT RECEIVED: TicketSold`);
      console.log(`   ID: ${payload.ticketId}, Price: ${payload.price}`);
    },
  );
}
