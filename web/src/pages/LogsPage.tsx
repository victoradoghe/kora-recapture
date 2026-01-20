import { LogsViewer } from "../components/LogsViewer";
import { FileText } from "lucide-react";

export function LogsPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <FileText className="w-7 h-7 text-primary" />
                    System Logs
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    View detailed logs of all system operations and events
                </p>
            </div>

            {/* Logs Viewer */}
            <LogsViewer />
        </div>
    );
}
