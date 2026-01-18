import { Home, Wallet, Settings, Activity, Shield, FileText, User, X } from "lucide-react";

interface SidebarProps {
    activePage?: string;
    isMobileOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ activePage = "dashboard", isMobileOpen = false, onClose }: SidebarProps) {
    const navItems = [
        { icon: Home, label: "Dashboard", href: "#dashboard", id: "dashboard" },
        { icon: Wallet, label: "Accounts", href: "#accounts", id: "accounts" },
        { icon: Activity, label: "Active Reclaim", href: "#active", id: "active", badge: "Live" },
        { icon: Shield, label: "Whitelist", href: "#whitelist", id: "whitelist" },
        { icon: FileText, label: "Logs", href: "#logs", id: "logs" },
        { icon: Settings, label: "Settings", href: "#settings", id: "settings" },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:sticky top-0 left-0 h-screen z-50
        w-64 bg-card/50 border-r border-border/50 backdrop-blur-xl
        flex flex-col
        transition-transform duration-150 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Logo */}
                <div className="p-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                            <Activity className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">Kora<span className="text-xs align-super">®</span></h1>
                            <p className="text-xs text-muted-foreground">Rent Reclaim System</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.id}
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            active={activePage === item.id}
                            badge={item.badge}
                            onClick={onClose}
                        />
                    ))}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-border/50">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Operator</p>
                            <p className="text-xs text-muted-foreground">View Profile</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

interface NavLinkProps {
    icon: any;
    label: string;
    href: string;
    active?: boolean;
    badge?: string;
    onClick?: () => void;
}

function NavLink({ icon: Icon, label, href, active, badge, onClick }: NavLinkProps) {
    return (
        <a
            href={href}
            onClick={onClick}
            className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group
        ${active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }
      `}
        >
            <Icon className="w-4 h-4" />
            <span className="flex-1 text-sm font-medium">{label}</span>
            {badge && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-primary/20 text-primary rounded-md">
                    {badge}
                </span>
            )}
        </a>
    );
}
