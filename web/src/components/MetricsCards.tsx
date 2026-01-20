import { Card, CardContent } from "./ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { Loader2, TrendingUp, TrendingDown, ExternalLink, Vault, Zap, Users } from "lucide-react";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer } from "recharts";

export function MetricsCards() {
    const { data: metrics, isLoading, error } = useQuery({
        queryKey: ["metrics"],
        queryFn: apiClient.getMetrics,
        refetchInterval: 10000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-destructive/10 border border-destructive/50 rounded-2xl p-4 text-destructive">
                Failed to load metrics. Make sure the API server is running.
            </div>
        );
    }

    // Generate chart data based on current value
    const generateChartData = (value: number, trend: "up" | "down" | "flat") => {
        const points = 20;
        const data = [];

        for (let i = 0; i < points; i++) {
            let baseValue = value * 0.8; // Start at 80% of current value

            if (trend === "up") {
                baseValue = baseValue + (value * 0.2 / points) * i + (Math.random() * value * 0.05);
            } else if (trend === "down") {
                baseValue = value - (value * 0.2 / points) * (points - i) + (Math.random() * value * 0.05);
            } else {
                baseValue = value + (Math.random() - 0.5) * value * 0.1;
            }

            data.push({ value: Math.max(0, baseValue) });
        }

        return data;
    };

    const totalRentLocked = metrics?.totalRentLocked || 0;
    const reclaimableSol = metrics?.reclaimableSol || 0;
    const accountsMonitored = metrics?.accountsMonitored || 0;

    // Calculate percentage changes (simulated for now, you can track historical data)
    const rentChange = totalRentLocked > 0 ? "+2.3%" : "0.00%";
    const reclaimableChange = reclaimableSol > 0 ? "+5.4%" : "0.00%";

    const metricsData = [
        {
            title: "Total Rent Locked",
            value: totalRentLocked.toFixed(2),
            change: rentChange,
            trend: "up" as const,
            IconComponent: Vault,
            chartData: generateChartData(totalRentLocked, "up"),
            color: "#10b981",
            chartType: "line" as const,
        },
        {
            title: "Reclaimable SOL",
            value: reclaimableSol.toFixed(2),
            change: reclaimableChange,
            trend: reclaimableSol > 0 ? "up" as const : "flat" as const,
            IconComponent: Zap,
            chartData: generateChartData(reclaimableSol, reclaimableSol > 0 ? "up" : "flat"),
            color: "#8b5cf6",
            chartType: "line" as const,
        },
        {
            title: "Accounts Monitored",
            value: String(accountsMonitored),
            change: "",
            trend: "flat" as const,
            IconComponent: Users,
            chartData: generateChartData(accountsMonitored, "flat"),
            color: "#3b82f6",
            chartType: "bar" as const,
        },
    ];

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {metricsData.map((metric) => (
                <Card key={metric.title} className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur">
                    <CardContent className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                    <metric.IconComponent className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>

                        {/* Value */}
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-3xl font-bold">{metric.value}</span>
                            {metric.title !== "Accounts Monitored" && (
                                <span className="text-sm text-muted-foreground">SOL</span>
                            )}
                        </div>

                        {/* Change */}
                        {metric.title !== "Accounts Monitored" && (
                            <div className="flex items-center gap-1.5 mb-6">
                                {metric.trend === "up" ? (
                                    <TrendingUp className="w-3 h-3 text-green-400" />
                                ) : metric.trend === "down" ? (
                                    <TrendingDown className="w-3 h-3 text-red-400" />
                                ) : null}
                                <span className={`text-xs font-medium ${metric.trend === "up" ? "text-green-400" :
                                    metric.trend === "down" ? "text-red-400" :
                                        "text-muted-foreground"
                                    }`}>
                                    {metric.change}
                                </span>
                            </div>
                        )}
                        {metric.title === "Accounts Monitored" && (
                            <div className="mb-6">
                                <span className="text-xs text-muted-foreground">Total sponsored accounts</span>
                            </div>
                        )}

                        {/* Chart */}
                        <div className="h-16 -mx-2">
                            <ResponsiveContainer width="100%" height="100%">
                                {metric.chartType === "bar" ? (
                                    <BarChart data={metric.chartData}>
                                        <Bar
                                            dataKey="value"
                                            fill={metric.color}
                                            radius={[4, 4, 0, 0]}
                                            animationDuration={2000}
                                        />
                                    </BarChart>
                                ) : (
                                    <LineChart data={metric.chartData}>
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke={metric.color}
                                            strokeWidth={2}
                                            dot={false}
                                            animationDuration={2000}
                                        />
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        </div>

                        {/* Value indicator */}
                        <div className="text-xs text-muted-foreground text-right mt-2">
                            {metric.change.replace('-', '').replace('+', '+')}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
