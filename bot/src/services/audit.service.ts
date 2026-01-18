import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount } from '@solana/spl-token';
import { AuditResult } from '../types/index.js';
import { getConnection, daysSince } from '../utils/solana.utils.js';
import { isWhitelisted } from '../utils/validation.utils.js';
import { config } from '../config/index.js';
import { logger } from './logger.service.js';

export class AuditService {
    private connection: Connection;

    constructor() {
        this.connection = getConnection();
    }

    /**
     * Audit a single account for reclaim eligibility
     */
    async auditAccount(
        accountPubkey: string,
        ownerPubkey?: string
    ): Promise<AuditResult> {
        const reasons: string[] = [];

        try {
            const pubkey = new PublicKey(accountPubkey);

            // Check whitelist first
            const isAccountWhitelisted = await isWhitelisted(accountPubkey, ownerPubkey);
            const isNotWhitelisted = !isAccountWhitelisted;

            if (isAccountWhitelisted) {
                reasons.push('Account is whitelisted');
            }

            // Check if account exists
            const accountInfo = await this.connection.getAccountInfo(pubkey);

            if (!accountInfo) {
                reasons.push('Account does not exist');
                return {
                    account: accountPubkey,
                    eligible: false,
                    isEmpty: false,
                    isInactive: false,
                    isCloseable: false,
                    isNotWhitelisted,
                    lastActivity: null,
                    balance: 0,
                    reasons,
                };
            }

            // Check if empty (for token accounts)
            let isEmpty = false;
            let balance = 0;

            try {
                const tokenAccount = await getAccount(this.connection, pubkey);
                balance = Number(tokenAccount.amount);
                isEmpty = balance === 0;

                if (!isEmpty) {
                    reasons.push(`Account has balance: ${balance}`);
                }
            } catch (error) {
                // Not a token account, check lamports
                isEmpty = accountInfo.lamports <= 0;
                balance = accountInfo.lamports;
            }

            // Check inactivity
            const { isInactive, lastActivity } = await this.checkInactivity(pubkey);

            if (!isInactive && lastActivity) {
                const days = daysSince(lastActivity);
                reasons.push(`Account active ${days} days ago (threshold: ${config.inactivityDays})`);
            }

            // Check if closeable (for token accounts)
            let isCloseable = false;

            try {
                const tokenAccount = await getAccount(this.connection, pubkey);
                const closeAuthority = tokenAccount.closeAuthority;

                if (closeAuthority) {
                    isCloseable = true;
                } else {
                    isCloseable = true; // Owner can close
                }
            } catch (error) {
                // Not a token account, assume closeable if empty
                isCloseable = isEmpty;
            }

            if (!isCloseable) {
                reasons.push('Account cannot be closed by operator');
            }

            // Determine eligibility
            const eligible = isEmpty && isInactive && isCloseable && isNotWhitelisted;

            if (eligible) {
                reasons.push('✅ Eligible for reclaim');
            }

            return {
                account: accountPubkey,
                eligible,
                isEmpty,
                isInactive,
                isCloseable,
                isNotWhitelisted,
                lastActivity,
                balance,
                reasons,
            };
        } catch (error) {
            console.error(`Failed to audit ${accountPubkey}:`, error);

            return {
                account: accountPubkey,
                eligible: false,
                isEmpty: false,
                isInactive: false,
                isCloseable: false,
                isNotWhitelisted: false,
                lastActivity: null,
                balance: 0,
                reasons: [`Error: ${error}`],
            };
        }
    }

    /**
     * Check if account has been inactive for the configured period
     */
    private async checkInactivity(
        accountPubkey: PublicKey
    ): Promise<{ isInactive: boolean; lastActivity: number | null }> {
        try {
            const signatures = await this.connection.getSignaturesForAddress(
                accountPubkey,
                { limit: 1 }
            );

            if (signatures.length === 0) {
                // No activity found, consider inactive
                return { isInactive: true, lastActivity: null };
            }

            const lastSignature = signatures[0];
            const lastActivityTime = (lastSignature.blockTime ?? 0) * 1000;
            const daysSinceActivity = daysSince(lastActivityTime);

            return {
                isInactive: daysSinceActivity >= config.inactivityDays,
                lastActivity: lastActivityTime,
            };
        } catch (error) {
            console.warn(`Failed to check inactivity for ${accountPubkey.toBase58()}:`, error);
            return { isInactive: false, lastActivity: null };
        }
    }

    /**
     * Audit multiple accounts
     */
    async auditBatch(
        accounts: { pubkey: string; owner?: string }[]
    ): Promise<AuditResult[]> {
        console.log(`🔍 Auditing ${accounts.length} accounts...`);

        const results: AuditResult[] = [];

        for (const account of accounts) {
            const result = await this.auditAccount(account.pubkey, account.owner);
            results.push(result);

            // Log audit result
            await logger.log({
                account: account.pubkey,
                action: 'audit',
                status: result.eligible ? 'success' : 'skipped',
                reason: result.reasons.join(', '),
            });
        }

        const eligible = results.filter(r => r.eligible).length;
        console.log(`✅ Audit complete: ${eligible}/${accounts.length} eligible for reclaim`);

        return results;
    }
}
