import { Router } from 'express';
import { kafka } from '../lib/kafka';

const routes = Router();

routes.get('/produce-data', async (req, res) => {
  const producer = kafka.producer();
  await producer.connect();

  await producer.send({
    topic: 'test-topic',
    messages: [{ value: 'Hello KafkaJS user!' }],
  });

  return res.send();
});

export default routes;
