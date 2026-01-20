import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { User, Wallet, TrendingUp, Activity, Calendar } from "lucide-react";

export function ProfilePage() {
    const { data: config } = useQuery({
        queryKey: ["config"],
        queryFn: apiClient.getConfig,
    });

    const { data: metrics } = useQuery({
        queryKey: ["metrics"],
        queryFn: apiClient.getMetrics,
        refetchInterval: 10000,
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <User className="w-7 h-7 text-primary" />
                    Operator Profile
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    View your operator account details and statistics
                </p>
            </div>

            {/* Profile Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                            O
                        </div>
                        <div>
                            <CardTitle>Operator Account</CardTitle>
                            <CardDescription className="mt-1">
                                Kora Rent Reclaim System
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Wallet Address */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                            <Wallet className="w-5 h-5 text-primary" />
                            <div>
                                <h4 className="font-semibold text-sm">Wallet Address</h4>
                                <code className="text-xs text-muted-foreground mt-1 block">
                                    {config?.operator || "Loading..."}
                                </code>
                            </div>
                        </div>
                        <Badge variant="outline">Mainnet</Badge>
                    </div>

                    {/* Network */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-primary" />
                            <div>
                                <h4 className="font-semibold text-sm">Network</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {config?.network || "Unknown"}
                                </p>
                            </div>
                        </div>
                        <Badge variant={config?.dryRun ? "secondary" : "destructive"}>
                            {config?.dryRun ? "Dry Run" : "Live"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            Total SOL Reclaimed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.totalReclaimed.toFixed(6) || "0.000000"} SOL</div>
                        <p className="text-xs text-muted-foreground mt-1">Lifetime earnings</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-primary" />
                            Accounts Reclaimed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.accountsReclaimed || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total accounts processed</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Activity className="w-4 h-4 text-yellow-500" />
                            Accounts Monitored
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.accountsMonitored || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Currently tracking</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            Last Scan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {metrics?.lastScanTime
                                ? new Date(metrics.lastScanTime).toLocaleDateString()
                                : "Never"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {metrics?.lastScanTime
                                ? new Date(metrics.lastScanTime).toLocaleTimeString()
                                : "No scans yet"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Summary</CardTitle>
                    <CardDescription>Overview of your reclaim operations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                            <span className="text-sm font-medium">Total Rent Locked</span>
                            <span className="text-sm font-semibold">{metrics?.totalRentLocked.toFixed(6) || "0.000000"} SOL</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                            <span className="text-sm font-medium">Reclaimable SOL</span>
                            <span className="text-sm font-semibold text-green-500">{metrics?.reclaimableSol.toFixed(6) || "0.000000"} SOL</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                            <span className="text-sm font-medium">Inactivity Threshold</span>
                            <span className="text-sm font-semibold">{config?.inactivityDays || 30} days</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
