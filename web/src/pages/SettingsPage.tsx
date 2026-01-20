import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { Settings as SettingsIcon, Save, AlertTriangle, Network, Clock, Shield } from "lucide-react";

export function SettingsPage() {
    const [hasChanges, setHasChanges] = useState(false);

    const { data: config } = useQuery({
        queryKey: ["config"],
        queryFn: apiClient.getConfig,
    });

    const { data: emergencyStop } = useQuery({
        queryKey: ["emergencyStop"],
        queryFn: apiClient.getEmergencyStop,
        refetchInterval: 5000,
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <SettingsIcon className="w-7 h-7 text-primary" />
                    Settings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Configure system settings and preferences
                </p>
            </div>

            {/* Bot Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5" />
                        Bot Configuration
                    </CardTitle>
                    <CardDescription>
                        Core settings for the reclaim bot
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Dry Run Mode */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">Dry Run Mode</h4>
                                <Badge variant={config?.dryRun ? "secondary" : "destructive"}>
                                    {config?.dryRun ? "Enabled" : "Disabled"}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                When enabled, simulates transactions without executing them
                            </p>
                        </div>
                        <div className="text-sm font-mono text-muted-foreground">
                            {config?.dryRun ? "Safe Mode" : "Live Mode"}
                        </div>
                    </div>

                    {/* Network */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Network className="w-4 h-4" />
                                <h4 className="font-semibold text-sm">Network</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Solana network connection
                            </p>
                        </div>
                        <Badge variant="outline">{config?.network || "Unknown"}</Badge>
                    </div>

                    {/* Inactivity Threshold */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <h4 className="font-semibold text-sm">Inactivity Threshold</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Days of inactivity before account is eligible for reclaim
                            </p>
                        </div>
                        <div className="text-sm font-semibold">{config?.inactivityDays || 30} days</div>
                    </div>

                    {/* Operator Address */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm">Operator Address</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Wallet address managing reclaim operations
                            </p>
                        </div>
                        <code className="text-xs bg-background px-3 py-1 rounded">
                            {config?.operator?.slice(0, 8)}...{config?.operator?.slice(-6)}
                        </code>
                    </div>
                </CardContent>
            </Card>

            {/* Emergency Stop */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <Shield className="w-5 h-5" />
                        Emergency Controls
                    </CardTitle>
                    <CardDescription>
                        Critical safety controls for the system
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/50">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Emergency Stop Status
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {emergencyStop?.stopped
                                        ? `Active since ${new Date(emergencyStop.stoppedAt || "").toLocaleString()}`
                                        : "System is operational"
                                    }
                                </p>
                            </div>
                            <Badge variant={emergencyStop?.stopped ? "destructive" : "default"}>
                                {emergencyStop?.stopped ? "STOPPED" : "ACTIVE"}
                            </Badge>
                        </div>
                        {emergencyStop?.stopped && emergencyStop.reason && (
                            <div className="mt-3 p-3 bg-background rounded border border-destructive/30">
                                <p className="text-xs font-medium">Reason:</p>
                                <p className="text-xs text-muted-foreground mt-1">{emergencyStop.reason}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                        Configure how you receive system notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50">
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm">Reclaim Success Notifications</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Get notified when reclaim operations succeed
                            </p>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50">
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm">Error Alerts</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Receive alerts when errors occur
                            </p>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50">
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm">Daily Summary</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Receive daily summary of reclaim operations
                            </p>
                        </div>
                        <Switch />
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            {hasChanges && (
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setHasChanges(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => setHasChanges(false)}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            )}
        </div>
    );
}
