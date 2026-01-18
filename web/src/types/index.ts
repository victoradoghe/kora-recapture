export interface SystemMetrics {
    totalRentLocked: number;
    reclaimableSol: number;
    accountsMonitored: number;
    totalReclaimed: number;
    lastScanTime: number | null;
    accountsReclaimed: number;
}

export interface LogEntry {
    timestamp: number;
    account: string;
    action: 'scan' | 'audit' | 'reclaim' | 'skip';
    status: 'success' | 'failure' | 'skipped';
    sol?: number;
    reason?: string;
    signature?: string;
}

export interface WhitelistConfig {
    accounts: string[];
    owners: string[];
    description: string;
}

export interface EmergencyStopState {
    stopped: boolean;
    stoppedAt: number | null;
    reason: string;
}

export interface BotConfig {
    network: string;
    dryRun: boolean;
    inactivityDays: number;
    operator: string;
}
