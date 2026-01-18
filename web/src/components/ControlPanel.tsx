import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { PlayCircle, StopCircle, AlertTriangle, Loader2, CheckCircle } from "lucide-react";

export function ControlPanel() {
    const queryClient = useQueryClient();
    const [stopReason, setStopReason] = useState("");

    const { data: config } = useQuery({
        queryKey: ["config"],
        queryFn: apiClient.getConfig,
    });

    const { data: emergencyStop } = useQuery({
        queryKey: ["emergencyStop"],
        queryFn: apiClient.getEmergencyStop,
        refetchInterval: 5000,
    });

    const scanMutation = useMutation({
        mutationFn: apiClient.triggerScan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["metrics"] });
            queryClient.invalidateQueries({ queryKey: ["logs"] });
        },
    });

    const reclaimMutation = useMutation({
        mutationFn: apiClient.triggerReclaim,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["metrics"] });
            queryClient.invalidateQueries({ queryKey: ["logs"] });
        },
    });

    const emergencyStopMutation = useMutation({
        mutationFn: ({ enable, reason }: { enable: boolean; reason?: string }) =>
            apiClient.toggleEmergencyStop(enable, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["emergencyStop"] });
            setStopReason("");
        },
    });

    const handleEmergencyStop = () => {
        const enable = !emergencyStop?.stopped;
        const reason = enable ? stopReason || "Manual stop from dashboard" : undefined;
        emergencyStopMutation.mutate({ enable, reason });
    };

    const lastScanTime = config
        ? new Date().toLocaleString()
        : "Never";

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Control Panel
                </CardTitle>
                <CardDescription>
                    Manage bot operations and safety controls
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Status Indicators */}
                <div className="flex flex-wrap gap-3">
                    <Badge variant={config?.dryRun ? "secondary" : "destructive"} className="flex items-center gap-1.5">
                        {config?.dryRun ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                DRY RUN MODE
                            </>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                LIVE MODE
                            </>
                        )}
                    </Badge>
                    <Badge variant={emergencyStop?.stopped ? "destructive" : "success"} className="flex items-center gap-1.5">
                        {emergencyStop?.stopped ? (
                            <>
                                <StopCircle className="w-3.5 h-3.5" />
                                STOPPED
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                ACTIVE
                            </>
                        )}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Network: {config?.network || "Unknown"}
                    </Badge>
                </div>

                {/* Emergency Stop Alert */}
                {emergencyStop?.stopped && (
                    <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-destructive">Emergency Stop Active</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {emergencyStop.reason}
                                </p>
                                {emergencyStop.stoppedAt && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Stopped at: {new Date(emergencyStop.stoppedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            onClick={() => scanMutation.mutate()}
                            disabled={scanMutation.isPending || emergencyStop?.stopped}
                            variant="outline"
                            className="w-full"
                        >
                            {scanMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Scanning...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Scan Now
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={() => reclaimMutation.mutate()}
                            disabled={reclaimMutation.isPending || emergencyStop?.stopped}
                            className="w-full"
                        >
                            {reclaimMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Reclaiming...
                                </>
                            ) : (
                                <>
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    Reclaim Now
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Emergency Stop Toggle */}
                    <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <StopCircle className="h-4 w-4" />
                                    Emergency Stop
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Immediately halt all reclaim operations
                                </p>
                            </div>
                            <Switch
                                checked={emergencyStop?.stopped || false}
                                onCheckedChange={handleEmergencyStop}
                                disabled={emergencyStopMutation.isPending}
                            />
                        </div>
                        {!emergencyStop?.stopped && (
                            <input
                                type="text"
                                placeholder="Reason for stopping (optional)"
                                value={stopReason}
                                onChange={(e) => setStopReason(e.target.value)}
                                className="w-full mt-3 px-3 py-2 bg-background border border-input rounded-md text-sm"
                            />
                        )}
                    </div>
                </div>

                {/* System Info */}
                <div className="text-xs text-muted-foreground space-y-1 pt-3 border-t">
                    <div className="flex justify-between">
                        <span>Operator:</span>
                        <span className="font-mono">{config?.operator?.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Inactivity Threshold:</span>
                        <span>{config?.inactivityDays || 30} days</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Last Scan:</span>
                        <span>{lastScanTime}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
