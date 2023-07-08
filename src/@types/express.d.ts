import { Producer } from 'kafkajs';

declare namespace Express {
  export interface Request {
    kafkaProd: Producer;
  }
}
