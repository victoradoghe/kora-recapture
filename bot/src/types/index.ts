import { PublicKey } from '@solana/web3.js';

/**
 * Represents an account sponsored by the operator
 */
export interface SponsoredAccount {
    pubkey: string;
    type: 'ATA' | 'SystemAccount' | 'PDA';
    createdAt: number;
    rentLamports: number;
    owner: string;
    mint?: string; // For ATAs
    koraSponsored?: boolean; // True if sponsored through Kora
}

/**
 * Result of auditing an account for reclaim eligibility
 */
export interface AuditResult {
    account: string;
    eligible: boolean;
    isEmpty: boolean;
    isInactive: boolean;
    isCloseable: boolean;
    isNotWhitelisted: boolean;
    lastActivity: number | null;
    balance: number;
    reasons: string[];
}

/**
 * Result of a reclaim operation
 */
export interface ReclaimResult {
    account: string;
    success: boolean;
    signature?: string;
    reclaimedSol: number;
    dryRun: boolean;
    timestamp: number;
    error?: string;
}

/**
 * Whitelist configuration
 */
export interface WhitelistConfig {
    accounts: string[];
    owners: string[];
    description: string;
}

/**
 * Emergency stop state
 */
export interface EmergencyStopState {
    stopped: boolean;
    stoppedAt: number | null;
    reason: string;
}

/**
 * System metrics
 */
export interface SystemMetrics {
    totalRentLocked: number;
    reclaimableSol: number;
    accountsMonitored: number;
    totalReclaimed: number;
    lastScanTime: number | null;
    accountsReclaimed: number;
}

/**
 * Log entry for operations
 */
export interface LogEntry {
    timestamp: number;
    account: string;
    action: 'scan' | 'audit' | 'reclaim' | 'skip';
    status: 'success' | 'failure' | 'skipped';
    sol?: number;
    reason?: string;
    signature?: string;
}

/**
 * Configuration options
 */
export interface BotConfig {
    rpcUrl: string;
    network: string;
    operatorPrivateKey: string;
    dryRun: boolean;
    inactivityDays: number;
    emergencyStopFile: string;
    whitelistFile: string;
    logFile: string;
    maxSignaturesPerRequest: number;
    requestDelayMs: number;
}
