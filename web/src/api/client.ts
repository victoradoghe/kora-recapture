import axios from 'axios';
import type { SystemMetrics, LogEntry, WhitelistConfig, EmergencyStopState, BotConfig } from '../types';

export interface SponsoredAccountWithStatus {
    pubkey: string;
    balance: number;
    lastActivity: number;
    status: 'active' | 'inactive';
    sponsored: boolean;
    owner?: string;
    mint?: string;
    eligible: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

export const apiClient = {
    // Health check
    health: async () => {
        const response = await api.get('/health');
        return response.data;
    },

    // Get metrics
    getMetrics: async (): Promise<SystemMetrics> => {
        const response = await api.get<SystemMetrics>('/metrics');
        return response.data;
    },

    // Get logs
    getLogs: async (limit: number = 100): Promise<LogEntry[]> => {
        const response = await api.get<LogEntry[]>('/logs', { params: { limit } });
        return response.data;
    },

    // Get accounts
    getAccounts: async (): Promise<SponsoredAccountWithStatus[]> => {
        const response = await api.get<SponsoredAccountWithStatus[]>('/accounts');
        return response.data;
    },

    // Trigger scan
    triggerScan: async () => {
        const response = await api.post('/scan');
        return response.data;
    },

    // Trigger reclaim
    triggerReclaim: async () => {
        const response = await api.post('/reclaim');
        return response.data;
    },

    // Get whitelist
    getWhitelist: async (): Promise<WhitelistConfig> => {
        const response = await api.get<WhitelistConfig>('/whitelist');
        return response.data;
    },

    // Update whitelist
    updateWhitelist: async (whitelist: WhitelistConfig) => {
        const response = await api.post('/whitelist', whitelist);
        return response.data;
    },

    // Get emergency stop status
    getEmergencyStop: async (): Promise<EmergencyStopState> => {
        const response = await api.get<EmergencyStopState>('/emergency-stop');
        return response.data;
    },

    // Toggle emergency stop
    toggleEmergencyStop: async (enable: boolean, reason?: string) => {
        const response = await api.post('/emergency-stop', { enable, reason });
        return response.data;
    },

    // Get config
    getConfig: async (): Promise<BotConfig> => {
        const response = await api.get<BotConfig>('/config');
        return response.data;
    },
};
