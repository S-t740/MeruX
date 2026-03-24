"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Github, Mail, Loader2, AlertCircle, Eye, EyeOff, Lock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData, getErrorMessage } from "@/lib/validation";
import { z } from "zod";

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setValidationErrors({});

        const formData = new FormData(e.currentTarget);
        const data = {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
        };

        try {
            const validatedData = loginSchema.parse(data);

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: validatedData.email,
                password: validatedData.password,
            });

            if (signInError) {
                setError(signInError.message || "Failed to sign in. Please check your credentials.");
                setLoading(false);
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            if (err instanceof z.ZodError) {
                const errors: Record<string, string> = {};
                err.issues.forEach((error) => {
                    const path = error.path[0] as string;
                    errors[path] = error.message;
                });
                setValidationErrors(errors);
            }
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#23234b] to-[#0f3460]">
            {/* Animated Background Orbs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-hub-indigo/15 blur-[150px] rounded-full animate-pulse animate-float" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-hub-purple/15 blur-[150px] rounded-full animate-pulse animate-float" style={{ animationDelay: "1s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-hub-teal/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: "2s" }} />

            {/* Home Link with fade-in */}
            <Link
                href="/"
                className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-hub-indigo transition-all group animate-fade-in"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
            </Link>

            <div className="w-full max-w-[480px] space-y-6 animate-slide-up relative z-10">
                {/* Header with shine animation */}
                <div className="text-center space-y-3 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-hub-indigo to-hub-purple shadow-xl shadow-hub-indigo/30 mb-2 animate-glass-shine">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-outfit font-bold tracking-tight bg-gradient-to-r from-white via-white to-hub-indigo bg-clip-text text-transparent animate-fade-in">
                        Welcome Back
                    </h1>
                    <p className="text-muted-foreground text-lg animate-fade-in">Access your innovation hub and continue learning</p>
                </div>

                {/* Main Card with entrance animation */}
                <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl space-y-6 animate-pop">
                    {error && (
                        <div className="p-4 bg-red-500/15 border border-red-500/40 text-red-200 text-sm rounded-xl flex items-start gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {/* Social Login with bounce animation */}
                    <div className="space-y-3 animate-bounce-in">
                        <button className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-xl hover:from-white/20 hover:to-white/10 hover:border-white/30 transition-all font-medium text-sm text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 duration-200 animate-wiggle">
                            <Github className="w-5 h-5" />
                            Continue with GitHub
                        </button>
                    </div>

                    <div className="relative my-6 animate-fade-in">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-[#020617] px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Or continue with email</span>
                        </div>
                    </div>

                    {/* Login Form with floating labels */}
                    <form className="space-y-5 animate-fade-in" onSubmit={handleLogin}>
                        {/* Email Input */}
                        <div className="space-y-2.5">
                            <div className="relative group">
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder=" "
                                    className={`w-full bg-black/30 border px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 transition-all text-base text-white placeholder:text-transparent font-medium peer ${validationErrors.email
                                            ? "border-red-500/60 focus:ring-red-500/50 bg-red-500/5"
                                            : "border-white/20 focus:ring-hub-indigo/50 focus:border-hub-indigo/50 group-hover:border-white/30"
                                        }`}
                                />
                                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-muted-foreground peer-focus:top-2 peer-focus:text-sm peer-focus:text-hub-indigo flex items-center gap-2">
                                    <User className="w-4 h-4 text-hub-indigo" />
                                    Email Address
                                </label>
                            </div>
                            {validationErrors.email && (
                                <p className="text-sm text-red-400 mt-2 flex items-center gap-2 animate-shake">
                                    <AlertCircle className="w-4 h-4" />
                                    {validationErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2.5">
                            <div className="relative group">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder=" "
                                    className={`w-full bg-black/30 border px-4 py-3.5 pr-12 rounded-xl focus:outline-none focus:ring-2 transition-all text-base text-white placeholder:text-transparent font-medium peer ${validationErrors.password
                                            ? "border-red-500/60 focus:ring-red-500/50 bg-red-500/5"
                                            : "border-white/20 focus:ring-hub-indigo/50 focus:border-hub-indigo/50 group-hover:border-white/30"
                                        }`}
                                />
                                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-muted-foreground peer-focus:top-2 peer-focus:text-sm peer-focus:text-hub-indigo flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-hub-indigo" />
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors animate-fade-in"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {validationErrors.password && (
                                <p className="text-sm text-red-400 mt-2 flex items-center gap-2 animate-shake">
                                    <AlertCircle className="w-4 h-4" />
                                    {validationErrors.password}
                                </p>
                            )}
                        </div>

                        {/* Sign In Button with pulse */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-hub-indigo to-hub-indigo/80 text-white rounded-xl font-bold hover:from-hub-indigo/90 hover:to-hub-indigo/70 transition-all shadow-lg shadow-hub-indigo/40 hover:shadow-xl hover:shadow-hub-indigo/50 mt-6 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:from-hub-indigo disabled:hover:to-hub-indigo/80 active:scale-95 duration-200 animate-pulse"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Signup Link with fade-in */}
                    <div className="pt-4 text-center border-t border-white/10 animate-fade-in">
                        <p className="text-muted-foreground text-sm">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="font-semibold text-hub-indigo hover:text-hub-indigo/80 transition-colors hover:underline">
                                Create one for free
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer Text with fade-in */}
                <p className="text-center text-xs text-muted-foreground animate-fade-in">
                    By signing in, you agree to our<br />
                    <Link href="#" className="text-hub-indigo hover:underline">Terms of Service</Link> and <Link href="#" className="text-hub-indigo hover:underline">Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
}
