// src/config/load.ts
import * as dotenv from 'dotenv';
import * as fs from 'fs';

export interface AppConfig {
  port: number;
  env: string;
  winstonLogLevel: string;
}

export function loadConfig(env?: string): AppConfig {
  dotenv.config({ path: `.env.${env || 'development'}` });

  return {
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
    winstonLogLevel: process.env.WINSTON_LOG_LEVEL || 'info'
  };
}