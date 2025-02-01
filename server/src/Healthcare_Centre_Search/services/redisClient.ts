import Redis from 'ioredis';
import validateEnv from '../../utils/validateEnv';

validateEnv();

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});
