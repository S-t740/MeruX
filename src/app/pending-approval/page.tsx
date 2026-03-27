"use client"

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, ArrowRight, ShieldAlert, LogOut, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PendingApprovalPage() {
    const router = useRouter();
    const supabase = createClient();
    const [userRole, setUserRole] = useState<string>('');

    useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                if (profile) setUserRole(profile.role);
            }
        };
        fetchRole();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-screen bg-background">
            {/* Background Orbs */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-hub-indigo/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-hub-purple/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-[480px] w-full bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl relative z-10 animate-slide-up text-center">
                <div className="w-20 h-20 rounded-2xl bg-hub-amber/10 flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-hub-amber animate-pulse" />
                </div>
                
                <h1 className="text-3xl font-outfit font-bold mb-3 tracking-tight">Account Under Review</h1>
                <p className="text-muted-foreground mb-8 text-lg">
                    Your request to join as an <span className="text-foreground font-semibold capitalize bg-accent px-2 py-0.5 rounded-md">{userRole || 'Instructor/Mentor'}</span> is currently pending approval by the administration team.
                </p>

                <div className="space-y-4 text-left bg-background/50 rounded-2xl p-6 border border-border/50 mb-8">
                    <h3 className="font-semibold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-hub-indigo" /> What happens next?
                    </h3>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-start gap-3">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-hub-indigo/10 text-hub-indigo flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                            Our admins will verify your credentials and role request.
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-hub-indigo/10 text-hub-indigo flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                            You will receive an email notification once your account is activated.
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-hub-indigo/10 text-hub-indigo flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                            Upon approval, you will gain full access to the MeruX dashboard.
                        </li>
                    </ul>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full py-3.5 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all flex items-center justify-center gap-2"
                    >
                        Check Status <ArrowRight className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="w-full py-3.5 bg-transparent border border-border/50 text-foreground rounded-xl font-bold hover:bg-accent transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
