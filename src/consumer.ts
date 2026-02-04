import { Events } from "@coolcinema/foundation";
import { Registry } from "@coolcinema/contracts";
import { GatewayEventsDefinition } from "./_gen/grpc/gateway-service_events_main";

export async function startConsumer() {
  const transport = new Events.AmqpTransport(Registry);
  const consumer = Events.createConsumer(transport, "sales-three");

  console.log("[Three] Starting Consumer...");

  await consumer.subscribe(
    GatewayEventsDefinition,
    "ticketSold",
    "gateway",
    async (payload) => {
      console.log(`[Three] 🎫 EVENT RECEIVED: TicketSold`);
      console.log(`   ID: ${payload.ticketId}, Price: ${payload.price}`);
    },
  );
}
