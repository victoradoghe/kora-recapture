import { useEffect, useRef } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { Bell, CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    const { data: logs } = useQuery({
        queryKey: ["logs"],
        queryFn: () => apiClient.getLogs(10),
        refetchInterval: 5000,
        enabled: isOpen,
    });

    const { data: emergencyStop } = useQuery({
        queryKey: ["emergencyStop"],
        queryFn: apiClient.getEmergencyStop,
        refetchInterval: 5000,
        enabled: isOpen,
    });

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const recentLogs = logs?.slice(0, 5) || [];
    const hasUnread = recentLogs.length > 0;

    return (
        <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
            {/* Mobile Overlay */}
            <div className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div
                ref={panelRef}
                className="fixed right-0 top-0 h-full w-full sm:w-96 bg-card border-l border-border shadow-2xl lg:absolute lg:right-0 lg:top-12 lg:h-auto lg:max-h-[600px] lg:rounded-lg lg:border overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Notifications</h3>
                        {hasUnread && (
                            <Badge variant="default" className="ml-2">
                                {recentLogs.length}
                            </Badge>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(100vh-80px)] lg:max-h-[500px]">
                    {/* Emergency Stop Alert */}
                    {emergencyStop?.stopped && (
                        <div className="p-4 bg-destructive/10 border-b border-destructive/50">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm text-destructive">Emergency Stop Active</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {emergencyStop.reason}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(emergencyStop.stoppedAt || "").toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Activity */}
                    <div className="p-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                            Recent Activity
                        </h4>
                        {recentLogs.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No recent notifications
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentLogs.map((log, index) => (
                                    <div
                                        key={index}
                                        className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            {log.status === "success" ? (
                                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant={log.status === "success" ? "default" : "destructive"}
                                                        className="text-xs"
                                                    >
                                                        {log.action}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(log.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {log.reason || "No details available"}
                                                </p>
                                                {log.sol && (
                                                    <p className="text-xs font-semibold text-green-500 mt-1">
                                                        +{log.sol.toFixed(6)} SOL
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border bg-secondary/30">
                        <Button variant="outline" className="w-full" onClick={onClose}>
                            <a href="#logs" className="w-full">
                                View All Logs
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
