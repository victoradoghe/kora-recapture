import dotenv from 'dotenv';
import { BotConfig } from '../types/index.js';

// Load environment variables
dotenv.config();

const getEnvVar = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

export const config: BotConfig = {
    rpcUrl: getEnvVar('SOLANA_RPC_URL', 'https://api.mainnet-beta.solana.com'),
    network: getEnvVar('SOLANA_NETWORK', 'mainnet-beta'),
    operatorPrivateKey: getEnvVar('OPERATOR_PRIVATE_KEY'),
    dryRun: getEnvVar('DRY_RUN', 'true') === 'true',
    inactivityDays: parseInt(getEnvVar('INACTIVITY_DAYS', '30'), 10),
    emergencyStopFile: getEnvVar('EMERGENCY_STOP_FILE', './data/state/emergency.json'),
    whitelistFile: getEnvVar('WHITELIST_FILE', './data/whitelist.json'),
    logFile: getEnvVar('LOG_FILE', './data/logs/reclaim.log'),
    maxSignaturesPerRequest: parseInt(getEnvVar('MAX_SIGNATURES_PER_REQUEST', '1000'), 10),
    requestDelayMs: parseInt(getEnvVar('REQUEST_DELAY_MS', '100'), 10),
};

export const apiConfig = {
    port: parseInt(getEnvVar('API_PORT', '3001'), 10),
    enabled: getEnvVar('API_ENABLED', 'true') === 'true',
    corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:5173'),
};

export const cronConfig = {
    schedule: getEnvVar('CRON_SCHEDULE', '0 */6 * * *'),
};

export const alertConfig = {
    enabled: getEnvVar('ALERTS_ENABLED', 'false') === 'true',
    thresholdSOL: parseFloat(getEnvVar('ALERT_THRESHOLD_SOL', '10')),
    webhookUrl: process.env.ALERT_WEBHOOK_URL, // Optional
    checkIntervalMinutes: parseInt(getEnvVar('ALERT_CHECK_INTERVAL', '60'), 10),
};

