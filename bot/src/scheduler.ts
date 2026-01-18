import cron from 'node-cron';
import { getOperatorKeypair } from './utils/solana.utils.js';
import { MonitorService } from './services/monitor.service.js';
import { AuditService } from './services/audit.service.js';
import { ReclaimService } from './services/reclaim.service.js';
import { logger } from './services/logger.service.js';
import { loadEmergencyStop } from './utils/validation.utils.js';
import { config, cronConfig } from './config/index.js';

async function runReclaimCycle() {
    console.log('\n🔄 ====== Starting Scheduled Reclaim Cycle ======');
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log(`Mode: ${config.dryRun ? 'DRY RUN ⚠️' : 'LIVE 🔴'}\n`);

    try {
        // Check emergency stop
        const emergencyStop = await loadEmergencyStop();
        if (emergencyStop.stopped) {
            console.log(`🛑 Emergency stop is active: ${emergencyStop.reason}`);
            console.log('   Skipping reclaim cycle\n');
            return;
        }

        const keypair = getOperatorKeypair();
        const monitor = new MonitorService(keypair.publicKey);
        const audit = new AuditService();
        const reclaim = new ReclaimService(keypair);

        // Step 1: Monitor
        console.log('Step 1/3: Monitoring wallet for sponsored accounts...');
        const accounts = await monitor.scanWalletHistory();
        console.log(`  Found ${accounts.length} sponsored accounts\n`);

        // Step 2: Audit
        console.log('Step 2/3: Auditing accounts for eligibility...');
        const auditResults = await audit.auditBatch(
            accounts.map(a => ({ pubkey: a.pubkey, owner: a.owner }))
        );

        const eligible = auditResults.filter(r => r.eligible);
        console.log(`  ${eligible.length} accounts eligible for reclaim\n`);

        if (eligible.length === 0) {
            console.log('✅ No accounts to reclaim at this time\n');
            await logger.logReclaimCycle({
                scanned: accounts.length,
                eligible: 0,
                reclaimed: 0,
                totalSol: 0,
            });
            return;
        }

        // Step 3: Reclaim
        console.log('Step 3/3: Reclaiming SOL from eligible accounts...');
        const reclaimResults = await reclaim.reclaimBatch(
            eligible.map(a => a.account)
        );

        const successful = reclaimResults.filter(r => r.success);
        const totalSol = successful.reduce((sum, r) => sum + r.reclaimedSol, 0);

        console.log('\n📊 Cycle Summary:');
        console.log(`  Accounts scanned:       ${accounts.length}`);
        console.log(`  Eligible for reclaim:   ${eligible.length}`);
        console.log(`  Successfully reclaimed: ${successful.length}`);
        console.log(`  Total SOL ${config.dryRun ? 'simulated' : 'reclaimed'}:    ${totalSol.toFixed(6)}\n`);

        // Log summary
        await logger.logReclaimCycle({
            scanned: accounts.length,
            eligible: eligible.length,
            reclaimed: successful.length,
            totalSol,
        });

        // Update metrics
        logger.updateMetrics({
            accountsMonitored: accounts.length,
            reclaimableSol: eligible.reduce((sum, a) => sum + a.balance, 0),
            lastScanTime: Date.now(),
        });

        console.log('====== Reclaim Cycle Complete ======\n');
    } catch (error) {
        console.error('❌ Reclaim cycle failed:', error);

        await logger.log({
            account: 'N/A',
            action: 'reclaim',
            status: 'failure',
            reason: `Cycle failed: ${error}`,
        });
    }
}

// Main scheduler
console.log('🤖 Kora-Recapture Scheduler Starting...');
console.log(`Configuration:`);
console.log(`  Schedule: ${cronConfig.schedule}`);
console.log(`  Network:  ${config.network}`);
console.log(`  Dry Run:  ${config.dryRun ? 'YES ⚠️' : 'NO 🔴'}`);
console.log(`  Operator: ${getOperatorKeypair().publicKey.toBase58()}\n`);

if (!config.dryRun) {
    console.log('⚠️  WARNING: DRY RUN IS DISABLED - REAL TRANSACTIONS WILL BE EXECUTED ⚠️\n');
}

// Schedule the cron job
cron.schedule(cronConfig.schedule, () => {
    runReclaimCycle().catch(error => {
        console.error('Unhandled error in reclaim cycle:', error);
    });
});

console.log('✅ Scheduler is running. Press Ctrl+C to stop.\n');

// Run immediately on start (optional)
runReclaimCycle().catch(error => {
    console.error('Initial reclaim cycle failed:', error);
});
