import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ControlPanel } from "../components/ControlPanel";
import { Badge } from "../components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { Activity, TrendingUp, CheckCircle, XCircle } from "lucide-react";

export function ActiveReclaimPage() {
    const { data: metrics } = useQuery({
        queryKey: ["metrics"],
        queryFn: apiClient.getMetrics,
        refetchInterval: 5000,
    });

    const { data: logs } = useQuery({
        queryKey: ["logs"],
        queryFn: () => apiClient.getLogs(20),
        refetchInterval: 5000,
    });

    // Filter for recent reclaim operations
    const recentReclaims = logs?.filter(log => log.action === "reclaim") || [];
    const failedReclaims = recentReclaims.filter(log => log.status === "failure");

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <Activity className="w-7 h-7 text-primary" />
                    Active Reclaim Operations
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Monitor and manage ongoing rent reclaim operations
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Total Reclaimed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.totalReclaimed.toFixed(6) || "0.000000"} SOL</div>
                        <p className="text-xs text-muted-foreground mt-1">All-time total</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Successful
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.accountsReclaimed || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Accounts reclaimed</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            Failed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{failedReclaims.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Recent failures</p>
                    </CardContent>
                </Card>
            </div>

            {/* Control Panel */}
            <ControlPanel />

            {/* Recent Reclaim Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Reclaim Activity</CardTitle>
                    <CardDescription>Latest reclaim operations and their status</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentReclaims.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No recent reclaim operations
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentReclaims.slice(0, 10).map((log, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {log.status === "success" ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs bg-background px-2 py-1 rounded">
                                                    {log.account.slice(0, 8)}...{log.account.slice(-6)}
                                                </code>
                                                <Badge variant={log.status === "success" ? "default" : "destructive"}>
                                                    {log.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {log.reason || "No details available"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {log.sol && (
                                            <div className="text-sm font-semibold text-green-500">
                                                +{log.sol.toFixed(6)} SOL
                                            </div>
                                        )}
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
