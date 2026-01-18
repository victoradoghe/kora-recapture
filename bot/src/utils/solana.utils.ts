import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { config } from '../config/index.js';
import bs58 from 'bs58';

/**
 * Initialize Solana connection
 */
export const getConnection = (): Connection => {
    return new Connection(config.rpcUrl, 'confirmed');
};

/**
 * Load operator keypair from environment
 */
export const getOperatorKeypair = (): Keypair => {
    try {
        const privateKeyBytes = bs58.decode(config.operatorPrivateKey);
        return Keypair.fromSecretKey(privateKeyBytes);
    } catch (error) {
        throw new Error('Invalid OPERATOR_PRIVATE_KEY. Must be base58 encoded.');
    }
};

/**
 * Sleep utility for rate limiting
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Convert lamports to SOL
 */
export const lamportsToSol = (lamports: number): number => {
    return lamports / 1_000_000_000;
};

/**
 * Convert SOL to lamports
 */
export const solToLamports = (sol: number): number => {
    return Math.floor(sol * 1_000_000_000);
};

/**
 * Validate public key string
 */
export const isValidPublicKey = (pubkey: string): boolean => {
    try {
        new PublicKey(pubkey);
        return true;
    } catch {
        return false;
    }
};

/**
 * Format timestamp to readable string
 */
export const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toISOString();
};

/**
 * Calculate days since timestamp
 */
export const daysSince = (timestamp: number): number => {
    const now = Date.now();
    const diff = now - timestamp;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
};
