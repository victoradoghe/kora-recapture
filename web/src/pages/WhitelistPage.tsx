import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { Shield, Plus, Trash2, AlertCircle } from "lucide-react";

export function WhitelistPage() {
    const queryClient = useQueryClient();
    const [newAddress, setNewAddress] = useState("");
    const [error, setError] = useState("");

    const { data: whitelist, isLoading } = useQuery({
        queryKey: ["whitelist"],
        queryFn: apiClient.getWhitelist,
    });

    const updateMutation = useMutation({
        mutationFn: apiClient.updateWhitelist,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["whitelist"] });
            setNewAddress("");
            setError("");
        },
    });

    const handleAddAddress = () => {
        if (!newAddress.trim()) {
            setError("Please enter a valid address");
            return;
        }

        if (whitelist?.accounts.includes(newAddress)) {
            setError("Address already in whitelist");
            return;
        }

        const updatedWhitelist = {
            accounts: [...(whitelist?.accounts || []), newAddress],
            owners: whitelist?.owners || [],
            description: whitelist?.description || "",
        };

        updateMutation.mutate(updatedWhitelist);
    };

    const handleRemoveAddress = (address: string) => {
        const updatedWhitelist = {
            accounts: whitelist?.accounts.filter(a => a !== address) || [],
            owners: whitelist?.owners || [],
            description: whitelist?.description || "",
        };

        updateMutation.mutate(updatedWhitelist);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <Shield className="w-7 h-7 text-primary" />
                    Whitelist Management
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Protect specific accounts from being reclaimed
                </p>
            </div>

            {/* Info Alert */}
            <div className="bg-primary/10 border border-primary/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                        <h4 className="font-semibold text-primary">About Whitelisting</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Whitelisted accounts will never be reclaimed, regardless of their inactivity period.
                            Use this feature to protect important accounts or those with special purposes.
                        </p>
                    </div>
                </div>
            </div>

            {/* Add Address Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add to Whitelist
                    </CardTitle>
                    <CardDescription>
                        Enter a Solana account address to add to the whitelist
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Enter Solana address (e.g., 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU)"
                                value={newAddress}
                                onChange={(e) => {
                                    setNewAddress(e.target.value);
                                    setError("");
                                }}
                                className="w-full px-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            {error && (
                                <p className="text-xs text-red-500 mt-2">{error}</p>
                            )}
                        </div>
                        <Button
                            onClick={handleAddAddress}
                            disabled={updateMutation.isPending}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Whitelist Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Whitelisted Accounts</CardTitle>
                    <CardDescription>
                        {whitelist?.accounts.length || 0} account(s) protected from reclaim
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading whitelist...</div>
                    ) : !whitelist?.accounts || whitelist.accounts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No accounts in whitelist
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {whitelist.accounts.map((address, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                                        <code className="text-xs sm:text-sm bg-background px-2 sm:px-3 py-1 rounded truncate block max-w-full">
                                            {address}
                                        </code>
                                        <Badge variant="secondary" className="flex-shrink-0">Protected</Badge>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleRemoveAddress(address)}
                                        disabled={updateMutation.isPending}
                                        className="w-full sm:w-auto"
                                    >
                                        <Trash2 className="w-4 h-4 sm:mr-0" />
                                        <span className="sm:hidden ml-2">Remove</span>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
