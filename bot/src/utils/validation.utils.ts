import fs from 'fs/promises';
import { WhitelistConfig, EmergencyStopState } from '../types/index.js';
import { config } from '../config/index.js';

/**
 * Load whitelist from file
 */
export const loadWhitelist = async (): Promise<WhitelistConfig> => {
    try {
        const data = await fs.readFile(config.whitelistFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.warn('Failed to load whitelist, using empty whitelist');
        return { accounts: [], owners: [], description: '' };
    }
};

/**
 * Save whitelist to file
 */
export const saveWhitelist = async (whitelist: WhitelistConfig): Promise<void> => {
    await fs.writeFile(
        config.whitelistFile,
        JSON.stringify(whitelist, null, 2),
        'utf-8'
    );
};

/**
 * Check if account is whitelisted
 */
export const isWhitelisted = async (
    accountPubkey: string,
    ownerPubkey?: string
): Promise<boolean> => {
    const whitelist = await loadWhitelist();

    // Check if account is directly whitelisted
    if (whitelist.accounts.includes(accountPubkey)) {
        return true;
    }

    // Check if owner is whitelisted
    if (ownerPubkey && whitelist.owners.includes(ownerPubkey)) {
        return true;
    }

    return false;
};

/**
 * Load emergency stop state
 */
export const loadEmergencyStop = async (): Promise<EmergencyStopState> => {
    try {
        const data = await fs.readFile(config.emergencyStopFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.warn('Failed to load emergency stop state, assuming not stopped');
        return { stopped: false, stoppedAt: null, reason: '' };
    }
};

/**
 * Save emergency stop state
 */
export const saveEmergencyStop = async (state: EmergencyStopState): Promise<void> => {
    await fs.writeFile(
        config.emergencyStopFile,
        JSON.stringify(state, null, 2),
        'utf-8'
    );
};

/**
 * Enable emergency stop
 */
export const enableEmergencyStop = async (reason: string): Promise<void> => {
    await saveEmergencyStop({
        stopped: true,
        stoppedAt: Date.now(),
        reason,
    });
};

/**
 * Disable emergency stop
 */
export const disableEmergencyStop = async (): Promise<void> => {
    await saveEmergencyStop({
        stopped: false,
        stoppedAt: null,
        reason: '',
    });
};
