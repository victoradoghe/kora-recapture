import fs from 'fs/promises';
import { LogEntry, SystemMetrics } from '../types/index.js';
import { config } from '../config/index.js';

export class LoggerService {
    private logs: LogEntry[] = [];
    private metrics: SystemMetrics = {
        totalRentLocked: 0,
        reclaimableSol: 0,
        accountsMonitored: 0,
        totalReclaimed: 0,
        lastScanTime: null,
        accountsReclaimed: 0,
    };

    /**
     * Log an operation
     */
    async log(entry: Omit<LogEntry, 'timestamp'>): Promise<void> {
        const logEntry: LogEntry = {
            ...entry,
            timestamp: Date.now(),
        };

        this.logs.push(logEntry);

        // Write to file
        await this.writeLog(logEntry);

        // Update metrics
        if (entry.action === 'reclaim' && entry.status === 'success' && entry.sol) {
            this.metrics.totalReclaimed += entry.sol;
            this.metrics.accountsReclaimed += 1;
        }
    }

    /**
     * Write log entry to file
     */
    private async writeLog(entry: LogEntry): Promise<void> {
        try {
            const logLine = JSON.stringify(entry) + '\n';
            await fs.appendFile(config.logFile, logLine, 'utf-8');
        } catch (error) {
            console.error('Failed to write log:', error);
        }
    }

    /**
     * Get recent logs
     */
    async getLogs(limit: number = 100): Promise<LogEntry[]> {
        return this.logs.slice(-limit);
    }

    /**
     * Update metrics
     */
    updateMetrics(updates: Partial<SystemMetrics>): void {
        this.metrics = { ...this.metrics, ...updates };
    }

    /**
     * Get current metrics
     */
    getMetrics(): SystemMetrics {
        return { ...this.metrics };
    }

    /**
     * Log reclaim cycle summary
     */
    async logReclaimCycle(results: {
        scanned: number;
        eligible: number;
        reclaimed: number;
        totalSol: number;
    }): Promise<void> {
        const summary = {
            timestamp: Date.now(),
            type: 'cycle_summary',
            ...results,
        };
        console.log('📊 Reclaim Cycle Summary:', summary);
        await fs.appendFile(
            config.logFile,
            JSON.stringify(summary) + '\n',
            'utf-8'
        );
    }

    /**
     * Load logs from file
     */
    async loadLogsFromFile(): Promise<void> {
        try {
            const data = await fs.readFile(config.logFile, 'utf-8');
            const lines = data.trim().split('\n');
            this.logs = lines
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return null;
                    }
                })
                .filter((log): log is LogEntry => log !== null);
        } catch (error) {
            // File doesn't exist yet, that's okay
            this.logs = [];
        }
    }
}

// Singleton instance
export const logger = new LoggerService();
