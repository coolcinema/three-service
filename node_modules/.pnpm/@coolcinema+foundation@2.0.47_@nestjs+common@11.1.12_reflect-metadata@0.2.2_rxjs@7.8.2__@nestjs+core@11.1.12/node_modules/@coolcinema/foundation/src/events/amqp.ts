import amqp, {
  AmqpConnectionManager,
  ChannelWrapper,
} from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import { IRegistry } from "../types";

export interface AmqpConfig {
  url?: string;
}

export class AmqpTransport {
  private connection: AmqpConnectionManager;
  private channel: ChannelWrapper;

  constructor(registry: IRegistry, config?: AmqpConfig) {
    const url = config?.url || registry.infrastructure?.rabbitmq?.uri;

    if (!url) {
      throw new Error(
        "RabbitMQ URI is not defined in registry.infrastructure.rabbitmq.uri",
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
