import { alertConfig } from '../config/index.js';
import { SystemMetrics } from '../types/index.js';

export class AlertService {
    private lastAlertTime: number = 0;
    private alertCooldownMs: number;

    constructor() {
        // Prevent alert spam - minimum 1 hour between alerts
        this.alertCooldownMs = alertConfig.checkIntervalMinutes * 60 * 1000;
    }

    /**
     * Check if an alert should be triggered based on metrics
     */
    async checkAndAlert(metrics: SystemMetrics): Promise<void> {
        if (!alertConfig.enabled) {
            return;
        }

        const now = Date.now();
        const cooldownRemaining = this.alertCooldownMs - (now - this.lastAlertTime);

        // Respect cooldown period
        if (cooldownRemaining > 0) {
            console.log(`⏳ Alert cooldown active (${Math.ceil(cooldownRemaining / 60000)} minutes remaining)`);
            return;
        }

        // Check if reclaimable SOL exceeds threshold
        if (metrics.reclaimableSol >= alertConfig.thresholdSOL) {
            console.log(`🚨 Alert triggered: ${metrics.reclaimableSol.toFixed(6)} SOL reclaimable (threshold: ${alertConfig.thresholdSOL})`);

            await this.sendAlert({
                title: '🚨 Kora-Recapture Alert',
                message: `**${metrics.reclaimableSol.toFixed(6)} SOL** is available to reclaim!`,
                fields: [
                    { name: 'Reclaimable SOL', value: `${metrics.reclaimableSol.toFixed(6)} SOL`, inline: true },
                    { name: 'Accounts', value: `${metrics.accountsMonitored}`, inline: true },
                    { name: 'Total Locked', value: `${metrics.totalRentLocked.toFixed(6)} SOL`, inline: true },
                ],
                color: 0xFF6B00, // Orange
            });

            this.lastAlertTime = now;
        }
    }

    /**
     * Send alert to configured webhook
     */
    private async sendAlert(payload: AlertPayload): Promise<void> {
        if (!alertConfig.webhookUrl) {
            console.warn('⚠️  Alert webhook URL not configured');
            return;
        }

        try {
            // Discord webhook format
            const discordPayload = {
                embeds: [{
                    title: payload.title,
                    description: payload.message,
                    color: payload.color,
                    fields: payload.fields,
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: 'Kora-Recapture Bot'
                    }
                }]
            };

            const response = await fetch(alertConfig.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(discordPayload),
            });

            if (response.ok) {
                console.log('✅ Alert sent successfully');
            } else {
                console.error('❌ Failed to send alert:', await response.text());
            }
        } catch (error) {
            console.error('❌ Alert sending error:', error);
        }
    }

    /**
     * Test alert functionality
     */
    async testAlert(): Promise<void> {
        console.log('🧪 Sending test alert...');

        await this.sendAlert({
            title: '🧪 Test Alert',
            message: 'Kora-Recapture alert system is working correctly!',
            fields: [
                { name: 'Status', value: '✅ Operational', inline: true },
                { name: 'Threshold', value: `${alertConfig.thresholdSOL} SOL`, inline: true },
            ],
            color: 0x00FF00, // Green
        });
    }
}

interface AlertPayload {
    title: string;
    message: string;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    color?: number;
}

export const alertService = new AlertService();
