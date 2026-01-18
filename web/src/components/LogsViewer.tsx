import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { ScrollText, ExternalLink, Loader2 } from "lucide-react";
import type { LogEntry } from "../types";

export function LogsViewer() {
    const { data: logs, isLoading } = useQuery({
        queryKey: ["logs"],
        queryFn: () => apiClient.getLogs(50),
        refetchInterval: 5000,
    });

    const getStatusBadge = (status: LogEntry["status"]) => {
        switch (status) {
            case "success":
                return <Badge variant="success">✓ Success</Badge>;
            case "failure":
                return <Badge variant="destructive">✗ Failed</Badge>;
            case "skipped":
                return <Badge variant="secondary">⊘ Skipped</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getActionColor = (action: LogEntry["action"]) => {
        switch (action) {
            case "reclaim":
                return "text-green-400";
            case "audit":
                return "text-blue-400";
            case "scan":
                return "text-purple-400";
            default:
                return "text-gray-400";
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };

    const shortenAddress = (address: string) => {
        if (address === "N/A") return address;
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ScrollText className="h-5 w-5" />
                    Recent Operations
                </CardTitle>
                <CardDescription>
                    Real-time log of all bot activities
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : logs && logs.length > 0 ? (
                    <div className="overflow-x-auto -mx-2 px-2">
                        <div className="inline-block min-w-full align-middle">
                            <table className="w-full text-sm">
                                <thead className="text-xs uppercase bg-muted/50">
                                    <tr>
                                        <th className="px-3 md:px-4 py-3 text-left">Time</th>
                                        <th className="px-3 md:px-4 py-3 text-left">Account</th>
                                        <th className="px-3 md:px-4 py-3 text-left">Action</th>
                                        <th className="px-3 md:px-4 py-3 text-left">Status</th>
                                        <th className="px-3 md:px-4 py-3 text-right">SOL</th>
                                        <th className="px-3 md:px-4 py-3 text-left hidden md:table-cell">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, index) => (
                                        <tr
                                            key={`${log.timestamp}-${index}`}
                                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="px-3 md:px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                {formatTimestamp(log.timestamp)}
                                            </td>
                                            <td className="px-3 md:px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">
                                                        {shortenAddress(log.account)}
                                                    </code>
                                                    {log.signature && (
                                                        <a
                                                            href={`https://solscan.io/tx/${log.signature}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:underline"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 md:px-4 py-3">
                                                <span className={`font-medium capitalize text-xs md:text-sm ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-3 md:px-4 py-3">{getStatusBadge(log.status)}</td>
                                            <td className="px-3 md:px-4 py-3 text-right font-mono text-xs md:text-sm whitespace-nowrap">
                                                {log.sol ? `${log.sol.toFixed(6)}` : "-"}
                                            </td>
                                            <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground max-w-xs truncate hidden md:table-cell">
                                                {log.reason || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No operations logged yet</p>
                        <p className="text-xs mt-1">Logs will appear here after scanning or reclaiming</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
