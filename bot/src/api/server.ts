import express, { Request, Response } from 'express';
import cors from 'cors';
import { logger } from '../services/logger.service.js';
import { getOperatorKeypair } from '../utils/solana.utils.js';
import { MonitorService } from '../services/monitor.service.js';
import { AuditService } from '../services/audit.service.js';
import { ReclaimService } from '../services/reclaim.service.js';
import {
    loadWhitelist,
    saveWhitelist,
    loadEmergencyStop,
    enableEmergencyStop,
    disableEmergencyStop,
} from '../utils/validation.utils.js';
import { apiConfig, config } from '../config/index.js';

const app = express();

// Middleware
app.use(cors({ origin: apiConfig.corsOrigin }));
app.use(express.json());

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Get metrics
app.get('/api/metrics', async (req: Request, res: Response) => {
    try {
        const metrics = logger.getMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

// Get logs
app.get('/api/logs', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;
        const logs = await logger.getLogs(limit);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// Trigger manual scan
app.post('/api/scan', async (req: Request, res: Response) => {
    try {
        const keypair = getOperatorKeypair();
        const monitor = new MonitorService(keypair.publicKey);

        const accounts = await monitor.scanWalletHistory();

        logger.updateMetrics({
            accountsMonitored: accounts.length,
            lastScanTime: Date.now(),
        });

        res.json({
            success: true,
            accountsFound: accounts.length,
            timestamp: Date.now(),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Scan failed',
        });
    }
});

// Trigger reclaim
app.post('/api/reclaim', async (req: Request, res: Response) => {
    try {
        const keypair = getOperatorKeypair();
        const monitor = new MonitorService(keypair.publicKey);
        const audit = new AuditService();
        const reclaim = new ReclaimService(keypair);

        // Monitor
        const accounts = await monitor.scanWalletHistory();

        // Audit
        const auditResults = await audit.auditBatch(
            accounts.map(a => ({ pubkey: a.pubkey, owner: a.owner }))
        );

        const eligible = auditResults.filter(r => r.eligible);

        // Reclaim
        const reclaimResults = await reclaim.reclaimBatch(
            eligible.map(a => a.account)
        );

        const successful = reclaimResults.filter(r => r.success);
        const totalSol = successful.reduce((sum, r) => sum + r.reclaimedSol, 0);

        res.json({
            success: true,
            scanned: accounts.length,
            eligible: eligible.length,
            reclaimed: successful.length,
            totalSol,
            dryRun: config.dryRun,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Reclaim failed',
        });
    }
});

// Get accounts
app.get('/api/accounts', async (req: Request, res: Response) => {
    try {
        const keypair = getOperatorKeypair();
        const monitor = new MonitorService(keypair.publicKey);
        const audit = new AuditService();

        // Scan for accounts
        const accounts = await monitor.scanWalletHistory();

        // Audit accounts to get eligibility status
        const auditResults = await audit.auditBatch(
            accounts.map(a => ({ pubkey: a.pubkey, owner: a.owner }))
        );

        // Combine account data with audit results
        const accountsWithStatus = accounts.map((account, index) => {
            const auditResult = auditResults[index];
            return {
                pubkey: account.pubkey,
                balance: account.rentLamports / 1_000_000_000, // Convert lamports to SOL
                lastActivity: account.createdAt,
                status: auditResult?.eligible ? 'inactive' : 'active',
                sponsored: true,
                owner: account.owner,
                mint: account.mint,
                eligible: auditResult?.eligible || false,
            };
        });

        res.json(accountsWithStatus);
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch accounts',
        });
    }
});

// Get whitelist
app.get('/api/whitelist', async (req: Request, res: Response) => {
    try {
        const whitelist = await loadWhitelist();
        res.json(whitelist);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch whitelist' });
    }
});

// Update whitelist
app.post('/api/whitelist', async (req: Request, res: Response) => {
    try {
        const whitelist = req.body;
        await saveWhitelist(whitelist);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update whitelist' });
    }
});

// Get emergency stop status
app.get('/api/emergency-stop', async (req: Request, res: Response) => {
    try {
        const state = await loadEmergencyStop();
        res.json(state);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch emergency stop status' });
    }
});

// Toggle emergency stop
app.post('/api/emergency-stop', async (req: Request, res: Response) => {
    try {
        const { enable, reason } = req.body;

        if (enable) {
            await enableEmergencyStop(reason || 'Manual stop from dashboard');
        } else {
            await disableEmergencyStop();
        }

        res.json({ success: true, stopped: enable });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle emergency stop' });
    }
});

// Get config
app.get('/api/config', (req: Request, res: Response) => {
    res.json({
        network: config.network,
        dryRun: config.dryRun,
        inactivityDays: config.inactivityDays,
        operator: getOperatorKeypair().publicKey.toBase58(),
    });
});

// Start server
if (apiConfig.enabled) {
    app.listen(apiConfig.port, () => {
        console.log(`🚀 API server running on http://localhost:${apiConfig.port}`);
        console.log(`   CORS enabled for: ${apiConfig.corsOrigin}`);
    });
} else {
    console.log('⚠️  API server is disabled in configuration');
}
