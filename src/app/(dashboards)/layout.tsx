import { Sidebar } from "@/components/dashboard/sidebar";
import { User } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <header className="h-16 border-b border-border bg-background/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="font-outfit font-semibold text-sm text-muted-foreground">Main Dashboard</h2>
                        <span className="text-border">/</span>
                        <h3 className="font-outfit font-semibold text-sm">Overview</h3>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="w-8 h-8 rounded-full bg-accent flex items-center justify-center border border-border">
                            <User className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
