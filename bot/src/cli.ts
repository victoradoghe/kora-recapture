#!/usr/bin/env node
import { Command } from 'commander';
import { getOperatorKeypair } from './utils/solana.utils.js';
import { MonitorService } from './services/monitor.service.js';
import { AuditService } from './services/audit.service.js';
import { ReclaimService } from './services/reclaim.service.js';
import { logger } from './services/logger.service.js';
import {
    loadWhitelist,
    saveWhitelist,
    enableEmergencyStop,
    disableEmergencyStop,
    loadEmergencyStop,
} from './utils/validation.utils.js';
import { config } from './config/index.js';

const program = new Command();

program
    .name('kora-recapture')
    .description('Automated rent-reclaim system for Kora node operators')
    .version('1.0.0');

// Scan command
program
    .command('scan')
    .description('Scan wallet history for sponsored accounts')
    .action(async () => {
        try {
            console.log('🚀 Starting wallet scan...');
            console.log(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

            const keypair = getOperatorKeypair();
            const monitor = new MonitorService(keypair.publicKey);

            const accounts = await monitor.scanWalletHistory();

            console.log(`\n📊 Results:`);
            console.log(`  Total sponsored accounts: ${accounts.length}`);

            // Update metrics
            logger.updateMetrics({
                accountsMonitored: accounts.length,
                lastScanTime: Date.now(),
            });

            process.exit(0);
        } catch (error) {
            console.error('❌ Scan failed:', error);
            process.exit(1);
        }
    });

// Reclaim command
program
    .command('reclaim')
    .description('Scan, audit, and reclaim eligible accounts')
    .action(async () => {
        try {
            console.log('🚀 Starting reclaim process...');
            console.log(`Mode: ${config.dryRun ? 'DRY RUN ⚠️' : 'LIVE 🔴'}\n`);

            const keypair = getOperatorKeypair();
            const monitor = new MonitorService(keypair.publicKey);
            const audit = new AuditService();
            const reclaim = new ReclaimService(keypair);

            // Step 1: Monitor
            console.log('Step 1/3: Monitoring...');
            const accounts = await monitor.scanWalletHistory();

            // Step 2: Audit
            console.log('\nStep 2/3: Auditing...');
            const auditResults = await audit.auditBatch(
                accounts.map(a => ({ pubkey: a.pubkey, owner: a.owner }))
            );

            const eligible = auditResults.filter(r => r.eligible);
            console.log(`\n  Eligible for reclaim: ${eligible.length}`);

            if (eligible.length === 0) {
                console.log('\n✅ No accounts to reclaim');
                process.exit(0);
            }

            // Step 3: Reclaim
            console.log('\nStep 3/3: Reclaiming...');
            const reclaimResults = await reclaim.reclaimBatch(
                eligible.map(a => a.account)
            );

            const successful = reclaimResults.filter(r => r.success);
            const totalSol = successful.reduce((sum, r) => sum + r.reclaimedSol, 0);

            console.log(`\n📊 Final Results:`);
            console.log(`  Accounts scanned: ${accounts.length}`);
            console.log(`  Eligible for reclaim: ${eligible.length}`);
            console.log(`  Successfully reclaimed: ${successful.length}`);
            console.log(`  Total SOL ${config.dryRun ? 'would be' : ''} reclaimed: ${totalSol.toFixed(6)}`);

            // Log summary
            await logger.logReclaimCycle({
                scanned: accounts.length,
                eligible: eligible.length,
                reclaimed: successful.length,
                totalSol,
            });

            process.exit(0);
        } catch (error) {
            console.error('❌ Reclaim failed:', error);
            process.exit(1);
        }
    });

// Reclaim single account command
program
    .command('reclaim-account <pubkey>')
    .description('Reclaim a specific account')
    .action(async (pubkey: string) => {
        try {
            console.log(`🚀 Reclaiming account: ${pubkey}`);
            console.log(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

            const keypair = getOperatorKeypair();
            const reclaim = new ReclaimService(keypair);

            const result = await reclaim.reclaimAccount(pubkey);

            if (result.success) {
                console.log(`\n✅ Success! Reclaimed ${result.reclaimedSol} SOL`);
                if (result.signature) {
                    console.log(`   Signature: ${result.signature}`);
                }
            } else {
                console.log(`\n❌ Failed: ${result.error}`);
            }

            process.exit(result.success ? 0 : 1);
        } catch (error) {
            console.error('❌ Reclaim failed:', error);
            process.exit(1);
        }
    });

// Stats command
program
    .command('stats')
    .description('Show system statistics')
    .action(async () => {
        try {
            await logger.loadLogsFromFile();
            const metrics = logger.getMetrics();

            console.log('\n📊 Kora-Recapture Statistics\n');
            console.log(`  Total Rent Locked:      ${metrics.totalRentLocked.toFixed(6)} SOL`);
            console.log(`  Reclaimable SOL:        ${metrics.reclaimableSol.toFixed(6)} SOL`);
            console.log(`  Accounts Monitored:     ${metrics.accountsMonitored}`);
            console.log(`  Total Reclaimed:        ${metrics.totalReclaimed.toFixed(6)} SOL`);
            console.log(`  Accounts Reclaimed:     ${metrics.accountsReclaimed}`);
            console.log(`  Last Scan:              ${metrics.lastScanTime ? new Date(metrics.lastScanTime).toLocaleString() : 'Never'}\n`);

            process.exit(0);
        } catch (error) {
            console.error('❌ Failed to load stats:', error);
            process.exit(1);
        }
    });

// Emergency stop commands
program
    .command('emergency-stop')
    .description('Emergency stop control')
    .option('--enable', 'Enable emergency stop')
    .option('--disable', 'Disable emergency stop')
    .option('--status', 'Check emergency stop status')
    .option('--reason <reason>', 'Reason for emergency stop')
    .action(async (options) => {
        try {
            if (options.enable) {
                const reason = options.reason || 'Manual emergency stop';
                await enableEmergencyStop(reason);
                console.log(`🛑 Emergency stop ENABLED: ${reason}`);
            } else if (options.disable) {
                await disableEmergencyStop();
                console.log('✅ Emergency stop DISABLED');
            } else {
                const state = await loadEmergencyStop();
                console.log('\n🚨 Emergency Stop Status\n');
                console.log(`  Status:     ${state.stopped ? '🛑 STOPPED' : '✅ Active'}`);
                console.log(`  Stopped At: ${state.stoppedAt ? new Date(state.stoppedAt).toLocaleString() : 'N/A'}`);
                console.log(`  Reason:     ${state.reason || 'N/A'}\n`);
            }

            process.exit(0);
        } catch (error) {
            console.error('❌ Emergency stop command failed:', error);
            process.exit(1);
        }
    });

// Whitelist commands
program
    .command('whitelist')
    .description('Whitelist management')
    .option('--add <pubkey>', 'Add account to whitelist')
    .option('--remove <pubkey>', 'Remove account from whitelist')
    .option('--list', 'List whitelisted accounts')
    .action(async (options) => {
        try {
            const whitelist = await loadWhitelist();

            if (options.add) {
                if (!whitelist.accounts.includes(options.add)) {
                    whitelist.accounts.push(options.add);
                    await saveWhitelist(whitelist);
                    console.log(`✅ Added ${options.add} to whitelist`);
                } else {
                    console.log(`⚠️  ${options.add} already in whitelist`);
                }
            } else if (options.remove) {
                const index = whitelist.accounts.indexOf(options.remove);
                if (index > -1) {
                    whitelist.accounts.splice(index, 1);
                    await saveWhitelist(whitelist);
                    console.log(`✅ Removed ${options.remove} from whitelist`);
                } else {
                    console.log(`⚠️  ${options.remove} not found in whitelist`);
                }
            } else {
                console.log('\n📝 Whitelisted Accounts\n');
                console.log(`  Total: ${whitelist.accounts.length}\n`);
                whitelist.accounts.forEach((account, i) => {
                    console.log(`  ${i + 1}. ${account}`);
                });
                console.log();
            }

            process.exit(0);
        } catch (error) {
            console.error('❌ Whitelist command failed:', error);
            process.exit(1);
        }
    });

program.parse();
