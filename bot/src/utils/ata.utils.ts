import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

/**
 * Derive Associated Token Account address
 */
export const deriveATAAddress = async (
    mint: PublicKey,
    owner: PublicKey
): Promise<PublicKey> => {
    return await getAssociatedTokenAddress(mint, owner);
};

/**
 * Check if an account is an ATA
 */
export const isATA = (accountData: any): boolean => {
    // ATAs are owned by the Token Program
    return accountData?.owner?.equals(TOKEN_PROGRAM_ID);
};

/**
 * Parse ATA account data
 */
export interface ParsedATAData {
    mint: string;
    owner: string;
    amount: string;
    delegateOption: number;
    delegate: string | null;
    state: number;
    isNativeOption: number;
    isNative: string | null;
    delegatedAmount: string;
    closeAuthorityOption: number;
    closeAuthority: string | null;
}

/**
 * Extract close authority from ATA data
 */
export const getATACloseAuthority = (accountData: ParsedATAData): string | null => {
    if (accountData.closeAuthorityOption === 1 && accountData.closeAuthority) {
        return accountData.closeAuthority;
    }
    return accountData.owner; // Default to owner if no close authority set
};
