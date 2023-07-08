import { Kafka, logLevel } from 'kafkajs';

/**
 * Faz conexão com o Kafka
 */
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
});

export { kafka };
