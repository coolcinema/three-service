import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";

// Включаем логирование самого OTel для отладки (опционально)
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

export function initTelemetry(serviceName: string) {
  const sdk = new NodeSDK({
    // Указываем имя сервиса напрямую (SDK сам создаст Resource)
    serviceName: serviceName,
    traceExporter: new OTLPTraceExporter({
      // Используем полный DNS путь к коллектору в K8s
      url:
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
        "http://cool-infra-jaeger-collector.coolcinema.svc.cluster.local:4317",
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Отключаем лишнее, если нужно (например, fs очень шумный)
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();

  console.log(`📡 Telemetry initialized for ${serviceName}`);

  // Graceful shutdown
  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .then(() => console.log("Telemetry terminated"))
      .catch((error) => console.log("Error terminating telemetry", error))
      .finally(() => process.exit(0));
  });
}
