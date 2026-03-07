"use client"

import Link from "next/link";
import { ArrowLeft, Github, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-hub-indigo/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-hub-purple/10 blur-[100px] rounded-full" />

            <Link
                href="/"
                className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
            </Link>

            <div className="w-full max-w-[400px] space-y-8 animate-slide-up">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-outfit font-bold tracking-tight">Welcome Back</h1>
                    <p className="text-muted-foreground">Log in to MeruX Hub to continue your journey.</p>
                </div>

                <div className="glass p-8 rounded-2xl space-y-6">
                    <div className="space-y-4">
                        <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-medium text-sm">
                            <Github className="w-5 h-5" />
                            Continue with GitHub
                        </button>
                        <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-medium text-sm">
                            <Mail className="w-5 h-5" />
                            Continue with Email
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#020617] px-2 text-muted-foreground">Or password</span>
                        </div>
                    </div>

                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Email Address</label>
                            <input
                                type="email"
                                placeholder="you@mtih.ac.ke"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 transition-all text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 transition-all text-sm"
                            />
                        </div>
                        <button className="w-full py-3 bg-hub-indigo text-white rounded-xl font-semibold hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/20 mt-2">
                            Sign In
                        </button>
                    </form>

                    <p className="text-center text-xs text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-hub-indigo hover:underline hover:text-hub-indigo/80">
                            Request access
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
