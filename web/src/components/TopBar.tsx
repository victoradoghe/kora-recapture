import { useState } from "react";
import { Bell, Search, Settings, Menu } from "lucide-react";
import { NotificationPanel } from "./NotificationPanel";

interface TopBarProps {
    onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50">
            <div className="flex items-center justify-between px-4 md:px-8 py-4">
                {/* Left: Mobile Menu + User Info */}
                <div className="flex items-center gap-3 md:gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* User Info - Hidden on small mobile */}
                    <a
                        href="#profile"
                        className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-lg bg-card/50 border border-border/50 hover:bg-card transition-colors cursor-pointer"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            O
                        </div>
                        <div className="hidden md:flex flex-col">
                            <span className="text-sm font-medium">Operator</span>
                            <span className="text-xs text-muted-foreground">View Profile</span>
                        </div>
                    </a>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Notification */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                            <Bell className="w-5 h-5 text-muted-foreground" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                        </button>
                        <NotificationPanel
                            isOpen={showNotifications}
                            onClose={() => setShowNotifications(false)}
                        />
                    </div>

                    {/* Search - Hidden on mobile */}
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 border border-border/50">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search"
                            className="bg-transparent border-none outline-none text-sm w-32 text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Settings */}
                    <a
                        href="#settings"
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                        <Settings className="w-5 h-5 text-muted-foreground" />
                    </a>
                </div>
            </div>
        </header>
    );
}
