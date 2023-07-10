import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { kafka } from './lib/kafka';

const temperatureValues: number[] = [];
const summary = {
  min: 0,
  average: '0',
  max: 0,
};
const app = express();

app.use(cors());

function processSummary() {
  const sum = temperatureValues.reduce((total, num) => total + num, 0);
  const average = (sum / temperatureValues.length).toFixed(2);

  summary.min = Math.min(...temperatureValues);
  summary.max = Math.max(...temperatureValues);
  summary.average = average;
}

async function startProducer() {
  const producer = kafka.producer();
  await producer.connect();

  setInterval(async () => {
    const randomSensorValue = Math.floor(Math.random() * 201);

    await producer.send({
      topic: 'temperature',
      messages: [{ value: randomSensorValue.toString() }],
    });
  }, 1000);
}

async function startConsumer() {
  const consumer = kafka.consumer({ groupId: 'test-group' });

  await consumer.subscribe({ topic: 'temperature', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`;
      console.log(`- ${prefix} ${message.key}#${message.value}`);

      const value = message.value?.toString();

      if (value) {
        temperatureValues.push(parseInt(value, 10));
      }

      processSummary();
    },
  });
}

function eventsHandler(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };
  response.writeHead(200, headers);

  setInterval(() => {
    const data = JSON.stringify({
      summary,
      lastValue: [...temperatureValues].pop(),
    });

    response.write(`id: ${new Date().toLocaleTimeString()}\ndata: ${data}\n\n`);
  }, 2000);

  const clientId = Date.now();

  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
  });
}

app.get('/', eventsHandler);

app.listen(3333, () => {
  startProducer().then(() => console.log('Producer is ready!'));
  startConsumer().then(() => console.log('Consumer is ready!'));

  console.log('Server started!');
});
