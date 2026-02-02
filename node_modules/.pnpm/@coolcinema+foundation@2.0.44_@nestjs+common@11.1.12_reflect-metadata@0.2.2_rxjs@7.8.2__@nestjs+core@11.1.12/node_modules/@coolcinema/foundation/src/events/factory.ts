import { AmqpTransport } from "./amqp";
import { getCurrentContext, runInContext } from "../context/store";
import { CONTEXT_KEYS } from "../context/keys";
import { Propagator } from "../context/propagator";

// Имя хедера, который использует Telepresence (или наш кастомный)
const INTERCEPT_HEADER =
  CONTEXT_KEYS.TELEPRESENCE || "x-telepresence-intercept-id";

interface ProtoDefinition {
  name: string;
  methods: Record<string, { name: string }>;
}

export function createPublisher<Def extends ProtoDefinition>(
  transport: AmqpTransport,
  definition: Def,
  prefix: string = "",
) {
  const channelWrapper = transport.getChannel();
  const publisher: any = {};

  for (const [methodKey, methodDef] of Object.entries(definition.methods)) {
    const logicalName = prefix ? `${prefix}.${methodDef.name}` : methodDef.name;

    // Имена Exchange
    const mainRouter = logicalName; // Headers Exchange
    const fallbackRouter = `${logicalName}.fallback`; // Topic Exchange

    // Инициализация топологии при старте (ленивая)
    channelWrapper.addSetup(async (channel: any) => {
      // 1. Fallback (Prod) Exchange
      await channel.assertExchange(fallbackRouter, "topic", { durable: true });

      // 2. Main (Intercept) Exchange с ссылкой на Fallback
      await channel.assertExchange(mainRouter, "headers", {
        durable: true,
        alternateExchange: fallbackRouter,
      });
    });

    publisher[methodKey] = async (payload: any) => {
      const headers: Record<string, any> = {};
      const ctx = getCurrentContext();

      // Inject Trace ID & Intercept Headers
      Propagator.inject(ctx, (k, v) => {
        const val = Array.isArray(v) ? v[0] : v;
        headers[k] = val;
      });

      // Публикуем всегда в Main Router.
      // Если есть хедер перехвата -> уйдет перехватчику.
      // Если нет -> уйдет в Fallback (Prod).
      await channelWrapper.publish(mainRouter, "", payload, {
        headers: headers,
        contentType: "application/json",
        timestamp: Date.now(),
      });
    };
  }

  return publisher as Record<
    keyof Def["methods"],
    (payload: any) => Promise<void>
  >;
}

export function createConsumer(
  transport: AmqpTransport,
  myServiceSlug: string,
) {
  const connection = transport.getChannel();

  // Определяем, находимся ли мы в режиме перехвата
  // Telepresence выставляет эту переменную или мы сами в .env
  const interceptId =
    process.env.TELEPRESENCE_INTERCEPT_ID || process.env.COOL_INTERCEPT_ID;

  return {
    subscribe: async <Def extends ProtoDefinition>(
      definition: Def,
      methodName: keyof Def["methods"],
      sourcePrefix: string,
      handler: (msg: any, ctx: any) => Promise<void>,
    ) => {
      const methodDef = definition.methods[methodName as string];
      if (!methodDef) throw new Error(`Method ${String(methodName)} not found`);

      const logicalName = sourcePrefix
        ? `${sourcePrefix}.${methodDef.name}`
        : methodDef.name;
      const mainRouter = logicalName;
      const fallbackRouter = `${logicalName}.fallback`;

      await connection.addSetup(async (channel: any) => {
        // Убеждаемся, что топология существует (идемпотентно)
        await channel.assertExchange(fallbackRouter, "topic", {
          durable: true,
        });
        await channel.assertExchange(mainRouter, "headers", {
          durable: true,
          alternateExchange: fallbackRouter,
        });

        let queueName: string;
        let sourceExchange: string;
        let bindArgs: any = {};

        if (interceptId) {
          // --- DEV MODE (INTERCEPT) ---
          // Слушаем Main Router, но ТОЛЬКО если есть наш хедер
          queueName = `${myServiceSlug}.${interceptId}.listen.${logicalName}`;
          sourceExchange = mainRouter;

          await channel.assertQueue(queueName, {
            exclusive: true, // Удалить при разрыве соединения
            autoDelete: true,
          });

          bindArgs = {
            "x-match": "all",
            [INTERCEPT_HEADER]: interceptId,
          };

          // Биндинг к Headers Exchange
          await channel.bindQueue(queueName, sourceExchange, "", bindArgs);
        } else {
          // --- PROD MODE (STANDARD) ---
          // Слушаем Fallback Router (куда сваливается все без перехвата)
          queueName = `${myServiceSlug}.listen.${logicalName}`;
          sourceExchange = fallbackRouter;

          await channel.assertQueue(queueName, { durable: true });
          // Биндинг к Topic Exchange (слушаем всё #)
          await channel.bindQueue(queueName, sourceExchange, "#");
        }

        // Consume Logic
        await channel.consume(queueName, async (msg: any) => {
          if (!msg) return;
          try {
            const content = JSON.parse(msg.content.toString());
            const headers = msg.properties.headers || {};

            // --- Trace Propagation ---
            const traceId = headers[CONTEXT_KEYS.TRACE_ID]?.toString();
            const normalizedHeaders: Record<string, string | string[]> = {};
            for (const [key, value] of Object.entries(headers)) {
              if (Array.isArray(value))
                normalizedHeaders[key] = value.map(String);
              else if (value != null) normalizedHeaders[key] = String(value);
            }

            const appCtx = { traceId, headers: normalizedHeaders };

            await runInContext(appCtx, async () => {
              await handler(content, appCtx);
            });

            channel.ack(msg);
          } catch (e) {
            console.error(e);
            // channel.nack(msg);
          }
        });
      });
    },
  };
}
