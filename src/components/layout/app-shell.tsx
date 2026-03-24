"use client"

import { Sidebar } from "@/components/dashboard/sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-background min-h-screen relative overflow-hidden">
            {/* Background Decorations */}
            <div className="bg-orb top-[-100px] right-[-100px] w-[500px] h-[500px] bg-hub-indigo/20" />
            <div className="bg-orb bottom-[-100px] left-[200px] w-[600px] h-[600px] bg-hub-purple/15" />

            <Sidebar />
            <main className="flex-1 overflow-auto relative z-10">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
