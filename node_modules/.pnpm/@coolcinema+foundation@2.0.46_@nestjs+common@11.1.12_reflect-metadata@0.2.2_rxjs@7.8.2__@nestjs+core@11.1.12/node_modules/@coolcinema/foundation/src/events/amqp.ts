import amqp, {
  AmqpConnectionManager,
  ChannelWrapper,
} from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";

export interface AmqpConfig {
  url?: string;
}

export class AmqpTransport {
  private connection: AmqpConnectionManager;
  private channel: ChannelWrapper;

  constructor(registry: any, config?: AmqpConfig) {
    const url = config?.url || registry.brokers?.rabbitmq;

    if (!url) {
      throw new Error(
        "RabbitMQ URI is not defined. Check registry.json or provide config.",
      );
    }

    this.connection = amqp.connect([url]);

    this.channel = this.connection.createChannel({
      json: true,
      setup: (channel: ConfirmChannel) => {
        return Promise.resolve();
      },
    });
  }

  getChannel() {
    return this.channel;
  }

  async close() {
    await this.connection.close();
  }
}
