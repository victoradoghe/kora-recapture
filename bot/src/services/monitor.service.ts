import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SponsoredAccount } from '../types/index.js';
import { getConnection, sleep, lamportsToSol } from '../utils/solana.utils.js';
import { config } from '../config/index.js';
import { logger } from './logger.service.js';

export class MonitorService {
    private connection: Connection;
    private operatorPubkey: PublicKey;
    private koraIdentifiers: Set<string>;

    constructor(operatorPubkey: PublicKey) {
        this.connection = getConnection();
        this.operatorPubkey = operatorPubkey;

        // Kora-specific identifiers
        // These help identify transactions sponsored through Kora
        this.koraIdentifiers = new Set([
            // Add known Kora program IDs, memo patterns, or Authority keys
            // Example: 'KoraProgram1111111111111111111111111111111',
            // This should be configured based on actual Kora implementation
        ]);
    }

    /**
     * Scan wallet history to find all sponsored accounts
     */
    async scanWalletHistory(): Promise<SponsoredAccount[]> {
        console.log('🔍 Scanning wallet history for sponsored accounts...');

        const sponsoredAccounts: SponsoredAccount[] = [];
        let before: string | undefined = undefined;
        let hasMore = true;
        let totalSignatures = 0;

        try {
            while (hasMore) {
                const signatures = await this.connection.getSignaturesForAddress(
                    this.operatorPubkey,
                    { before, limit: config.maxSignaturesPerRequest }
                );

                if (signatures.length === 0) {
                    hasMore = false;
                    break;
                }

                totalSignatures += signatures.length;
                console.log(`  Fetched ${signatures.length} signatures (total: ${totalSignatures})`);

                // Process transactions in batches
                for (const sigInfo of signatures) {
                    try {
                        const tx = await this.connection.getParsedTransaction(
                            sigInfo.signature,
                            { maxSupportedTransactionVersion: 0 }
                        );

                        if (tx) {
                            const accounts = await this.extractSponsoredAccounts(tx);
                            sponsoredAccounts.push(...accounts);
                        }

                        // Rate limiting
                        await sleep(config.requestDelayMs);
                    } catch (error) {
                        console.warn(`  Failed to process signature ${sigInfo.signature}:`, error);
                    }
                }

                before = signatures[signatures.length - 1].signature;

                // For initial implementation, limit to recent history
                // Remove this break to scan entire history
                if (totalSignatures >= 5000) {
                    console.log('  Reached scan limit (5000 signatures)');
                    break;
                }
            }

            console.log(`✅ Found ${sponsoredAccounts.length} sponsored accounts`);

            await logger.log({
                account: 'N/A',
                action: 'scan',
                status: 'success',
                reason: `Scanned ${totalSignatures} transactions, found ${sponsoredAccounts.length} accounts`,
            });

            return sponsoredAccounts;
        } catch (error) {
            console.error('❌ Scan failed:', error);
            throw error;
        }
    }

    /**
     * Extract sponsored accounts from a parsed transaction
     * Includes Kora-specific detection logic
     */
    private async extractSponsoredAccounts(
        tx: ParsedTransactionWithMeta
    ): Promise<SponsoredAccount[]> {
        const accounts: SponsoredAccount[] = [];

        if (!tx.meta || !tx.transaction.message.instructions) {
            return accounts;
        }

        // Check if this is a Kora-sponsored transaction
        const isKoraSponsored = this.isKoraSponsoredTransaction(tx);

        // Look for Token Program instructions (ATAs)
        for (const instruction of tx.transaction.message.instructions) {
            if ('programId' in instruction) {
                // Check if it's a Token Program instruction
                if (instruction.programId.equals(TOKEN_PROGRAM_ID)) {
                    const parsed = 'parsed' in instruction ? instruction.parsed : null;

                    if (parsed && parsed.type === 'initializeAccount') {
                        const accountPubkey = parsed.info.account;
                        const mint = parsed.info.mint;
                        const owner = parsed.info.owner;

                        // Check if operator was the fee payer
                        if (tx.transaction.message.accountKeys[0].pubkey.equals(this.operatorPubkey)) {
                            accounts.push({
                                pubkey: accountPubkey,
                                type: 'ATA',
                                createdAt: (tx.blockTime ?? 0) * 1000,
                                rentLamports: 0, // Will be fetched later
                                owner,
                                mint,
                                koraSponsored: isKoraSponsored, // Mark if Kora-sponsored
                            });
                        }
                    }
                }
            }
        }

        return accounts;
    }

    /**
     * Determine if a transaction was sponsored through Kora
     * This uses heuristics to identify Kora-specific patterns
     */
    private isKoraSponsoredTransaction(tx: ParsedTransactionWithMeta): boolean {
        // Method 1: Check for Kora program in transaction
        const hasKoraProgram = tx.transaction.message.instructions.some(ix => {
            if ('programId' in ix) {
                return this.koraIdentifiers.has(ix.programId.toBase58());
            }
            return false;
        });

        if (hasKoraProgram) return true;

        // Method 2: Check transaction memo for Kora identifier
        const hasMemo = tx.transaction.message.instructions.some(ix => {
            if ('parsed' in ix && ix.parsed) {
                const data = ix.parsed.info?.data;
                // Kora might add specific memo patterns like "KORA:v1" or similar
                return data && typeof data === 'string' && data.includes('KORA');
            }
            return false;
        });

        if (hasMemo) return true;

        // Method 3: Check if fee payer matches known Kora relay nodes
        // This would require maintaining a list of Kora node addresses
        const feePayer = tx.transaction.message.accountKeys[0]?.pubkey;
        if (feePayer && this.koraIdentifiers.has(feePayer.toBase58())) {
            return true;
        }

        // Default: Assume all operator-paid transactions are Kora-sponsored
        // This is a conservative approach - you can make it stricter
        return tx.transaction.message.accountKeys[0]?.pubkey.equals(this.operatorPubkey) || false;
    }

    /**
     * Configure Kora identifiers for detection
     * Add known Kora program IDs, relay node addresses, etc.
     */
    public addKoraIdentifier(identifier: string): void {
        this.koraIdentifiers.add(identifier);
        console.log(`➕ Added Kora identifier: ${identifier}`);
    }

    /**
     * Get statistics on Kora-sponsored vs other sponsored accounts
     */
    public async getKoraStatistics(accounts: SponsoredAccount[]): Promise<{
        totalAccounts: number;
        koraSponsored: number;
        otherSponsored: number;
        koraSponsoredSOL: number;
        otherSponsoredSOL: number;
    }> {
        const koraAccounts = accounts.filter(acc => acc.koraSponsored);
        const otherAccounts = accounts.filter(acc => !acc.koraSponsored);

        const koraSponsoredSOL = koraAccounts.reduce((sum, acc) => sum + lamportsToSol(acc.rentLamports), 0);
        const otherSponsoredSOL = otherAccounts.reduce((sum, acc) => sum + lamportsToSol(acc.rentLamports), 0);

        return {
            totalAccounts: accounts.length,
            koraSponsored: koraAccounts.length,
            otherSponsored: otherAccounts.length,
            koraSponsoredSOL,
            otherSponsoredSOL,
        };
    }

    /**
     * Find all Associated Token Accounts for known mints
     * This is a more efficient approach if you know the mints
     */
    async findATAsForMints(mints: PublicKey[]): Promise<SponsoredAccount[]> {
        console.log(`🔍 Finding ATAs for ${mints.length} mints...`);

        const accounts: SponsoredAccount[] = [];

        for (const mint of mints) {
            try {
                const { getAssociatedTokenAddress } = await import('@solana/spl-token');
                const ataAddress = await getAssociatedTokenAddress(
                    mint,
                    this.operatorPubkey
                );

                // Check if account exists
                const accountInfo = await this.connection.getAccountInfo(ataAddress);

                if (accountInfo) {
                    accounts.push({
                        pubkey: ataAddress.toBase58(),
                        type: 'ATA',
                        createdAt: 0, // Unknown
                        rentLamports: accountInfo.lamports,
                        owner: this.operatorPubkey.toBase58(),
                        mint: mint.toBase58(),
                    });
                }

                await sleep(config.requestDelayMs);
            } catch (error) {
                console.warn(`  Failed to process mint ${mint.toBase58()}:`, error);
            }
        }

        console.log(`✅ Found ${accounts.length} ATAs`);
        return accounts;
    }

    /**
     * Get account rent amount
     */
    async getAccountRent(accountPubkey: PublicKey): Promise<number> {
        try {
            const accountInfo = await this.connection.getAccountInfo(accountPubkey);
            return accountInfo ? accountInfo.lamports : 0;
        } catch (error) {
            return 0;
        }
    }
}
