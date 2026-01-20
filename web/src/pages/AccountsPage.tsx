import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { Wallet, TrendingUp, Clock, AlertCircle } from "lucide-react";

export function AccountsPage() {
    const { data: metrics, isLoading: metricsLoading } = useQuery({
        queryKey: ["metrics"],
        queryFn: apiClient.getMetrics,
        refetchInterval: 10000,
    });

    const { data: config } = useQuery({
        queryKey: ["config"],
        queryFn: apiClient.getConfig,
    });

    const { data: accounts, isLoading: accountsLoading } = useQuery({
        queryKey: ["accounts"],
        queryFn: apiClient.getAccounts,
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const inactivityThreshold = config?.inactivityDays || 30;
    const isLoading = metricsLoading || accountsLoading;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Sponsored Accounts</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Monitor all accounts sponsored by your operator wallet
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-primary" />
                            Total Accounts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.accountsMonitored || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Sponsored accounts</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            Total Rent Locked
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.totalRentLocked.toFixed(6) || "0.000000"} SOL</div>
                        <p className="text-xs text-muted-foreground mt-1">Across all accounts</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            Reclaimable
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.reclaimableSol.toFixed(6) || "0.000000"} SOL</div>
                        <p className="text-xs text-muted-foreground mt-1">From inactive accounts</p>
                    </CardContent>
                </Card>
            </div>

            {/* Accounts Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Account List
                    </CardTitle>
                    <CardDescription>
                        Accounts inactive for {inactivityThreshold}+ days are eligible for reclaim
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading accounts...</div>
                    ) : !accounts || accounts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No sponsored accounts found. Run a scan to discover accounts.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Account</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Balance</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Last Activity</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map((account) => {
                                        const daysSinceActivity = Math.floor((Date.now() - account.lastActivity) / (24 * 60 * 60 * 1000));
                                        const isEligible = account.eligible;

                                        return (
                                            <tr key={account.pubkey} className="border-b border-border/50 hover:bg-secondary/50">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-xs bg-secondary px-2 py-1 rounded">
                                                            {account.pubkey.slice(0, 8)}...{account.pubkey.slice(-6)}
                                                        </code>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm font-mono">
                                                    {account.balance.toFixed(8)} SOL
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                                        {daysSinceActivity > 0 ? `${daysSinceActivity} days ago` : 'Today'}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={isEligible ? "destructive" : "secondary"}>
                                                        {isEligible ? "Eligible" : "Active"}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={!isEligible}
                                                    >
                                                        Reclaim
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
