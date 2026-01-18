import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import { createCloseAccountInstruction } from '@solana/spl-token';
import { ReclaimResult } from '../types/index.js';
import { getConnection, lamportsToSol } from '../utils/solana.utils.js';
import { loadEmergencyStop } from '../utils/validation.utils.js';
import { config } from '../config/index.js';
import { logger } from './logger.service.js';

export class ReclaimService {
    private connection: Connection;
    private operatorKeypair: Keypair;

    constructor(operatorKeypair: Keypair) {
        this.connection = getConnection();
        this.operatorKeypair = operatorKeypair;
    }

    /**
     * Reclaim SOL from a single account
     */
    async reclaimAccount(accountPubkey: string): Promise<ReclaimResult> {
        console.log(`💰 Reclaiming account: ${accountPubkey}`);

        // Safety check: Emergency stop
        const emergencyStop = await loadEmergencyStop();
        if (emergencyStop.stopped) {
            const error = `Emergency stop is active: ${emergencyStop.reason}`;
            console.error(`❌ ${error}`);

            await logger.log({
                account: accountPubkey,
                action: 'reclaim',
                status: 'failure',
                reason: error,
            });

            return {
                account: accountPubkey,
                success: false,
                reclaimedSol: 0,
                dryRun: false,
                timestamp: Date.now(),
                error,
            };
        }

        try {
            const pubkey = new PublicKey(accountPubkey);

            // Get account info to calculate rent reclaimed
            const accountInfo = await this.connection.getAccountInfo(pubkey);

            if (!accountInfo) {
                const error = 'Account does not exist';
                await logger.log({
                    account: accountPubkey,
                    action: 'reclaim',
                    status: 'failure',
                    reason: error,
                });

                return {
                    account: accountPubkey,
                    success: false,
                    reclaimedSol: 0,
                    dryRun: false,
                    timestamp: Date.now(),
                    error,
                };
            }

            const reclaimedLamports = accountInfo.lamports;
            const reclaimedSol = lamportsToSol(reclaimedLamports);

            // Build close instruction
            const closeIx = createCloseAccountInstruction(
                pubkey,
                this.operatorKeypair.publicKey,
                this.operatorKeypair.publicKey
            );

            const transaction = new Transaction().add(closeIx);

            if (config.dryRun) {
                // Dry run: Simulate transaction
                console.log(`  [DRY RUN] Would reclaim ${reclaimedSol} SOL`);

                const simulation = await this.connection.simulateTransaction(transaction);

                if (simulation.value.err) {
                    const error = `Simulation failed: ${JSON.stringify(simulation.value.err)}`;
                    console.error(`  ❌ ${error}`);

                    await logger.log({
                        account: accountPubkey,
                        action: 'reclaim',
                        status: 'failure',
                        sol: reclaimedSol,
                        reason: error,
                    });

                    return {
                        account: accountPubkey,
                        success: false,
                        reclaimedSol,
                        dryRun: true,
                        timestamp: Date.now(),
                        error,
                    };
                }

                console.log(`  ✅ Simulation successful`);

                await logger.log({
                    account: accountPubkey,
                    action: 'reclaim',
                    status: 'success',
                    sol: reclaimedSol,
                    reason: '[DRY RUN] Simulation successful',
                });

                return {
                    account: accountPubkey,
                    success: true,
                    reclaimedSol,
                    dryRun: true,
                    timestamp: Date.now(),
                };
            }

            // Execute transaction
            console.log(`  Executing close transaction...`);
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.operatorKeypair],
                { commitment: 'confirmed' }
            );

            console.log(`  ✅ Reclaimed ${reclaimedSol} SOL (${signature})`);

            await logger.log({
                account: accountPubkey,
                action: 'reclaim',
                status: 'success',
                sol: reclaimedSol,
                signature,
            });

            return {
                account: accountPubkey,
                success: true,
                signature,
                reclaimedSol,
                dryRun: false,
                timestamp: Date.now(),
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`  ❌ Failed to reclaim: ${errorMsg}`);

            await logger.log({
                account: accountPubkey,
                action: 'reclaim',
                status: 'failure',
                reason: errorMsg,
            });

            return {
                account: accountPubkey,
                success: false,
                reclaimedSol: 0,
                dryRun: config.dryRun,
                timestamp: Date.now(),
                error: errorMsg,
            };
        }
    }

    /**
     * Reclaim multiple accounts
     */
    async reclaimBatch(accountPubkeys: string[]): Promise<ReclaimResult[]> {
        console.log(`💰 Reclaiming ${accountPubkeys.length} accounts...`);

        const results: ReclaimResult[] = [];
        let totalReclaimed = 0;

        for (const pubkey of accountPubkeys) {
            const result = await this.reclaimAccount(pubkey);
            results.push(result);

            if (result.success) {
                totalReclaimed += result.reclaimedSol;
            }

            // Safety: Check emergency stop between each reclaim
            const emergencyStop = await loadEmergencyStop();
            if (emergencyStop.stopped) {
                console.warn('⚠️  Emergency stop activated, halting batch reclaim');
                break;
            }
        }

        const successful = results.filter(r => r.success).length;
        console.log(
            `✅ Batch reclaim complete: ${successful}/${accountPubkeys.length} successful, ${totalReclaimed} SOL ${config.dryRun ? '[DRY RUN]' : 'reclaimed'}`
        );

        return results;
    }
}
