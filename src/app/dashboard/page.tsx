"use client"

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUserRole } from "@/lib/hooks/useUserRole";

export default function DashboardPage() {
    const router = useRouter();
    const { role, loading } = useUserRole();

    useEffect(() => {
        if (!loading && role) {
            router.push(`/dashboard/${role}`);
        }
    }, [role, loading, router]);

    return (
        <div className="p-8 flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-2 border-hub-indigo border-t-transparent animate-spin mx-auto" />
                <p className="text-muted-foreground">Redirecting to your workspace...</p>
            </div>
        </div>
    );
}
