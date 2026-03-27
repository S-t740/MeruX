"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Github, Mail, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Lock, User, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterFormData } from "@/lib/validation";
import { z } from "zod";

export default function RegisterPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [password, setPassword] = useState("");

    const getPasswordStrength = (pwd: string) => {
        if (!pwd) return { strength: 0, label: "", color: "bg-gray-500" };
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/[0-9]/.test(pwd)) strength++;
        if (/[^A-Za-z0-9]/.test(pwd)) strength++;

        return strength === 1 ? { strength: 1, label: "Weak", color: "bg-red-500" }
            : strength === 2 ? { strength: 2, label: "Fair", color: "bg-yellow-500" }
                : strength === 3 ? { strength: 3, label: "Good", color: "bg-blue-500" }
                    : strength >= 4 ? { strength: 4, label: "Strong", color: "bg-hub-teal" }
                        : { strength: 0, label: "", color: "bg-gray-500" };
    };

    const passwordStrength = getPasswordStrength(password);

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setValidationErrors({});
        setSuccess(false);

        const formData = new FormData(e.currentTarget);
        const data = {
            first_name: formData.get("first_name") as string,
            last_name: formData.get("last_name") as string,
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            confirmPassword: formData.get("confirmPassword") as string,
            role: formData.get("role") as string,
        };

        // Validate form data
        try {
            const validatedData = registerSchema.parse(data);
            setPassword(validatedData.password);

            const { error: signUpError } = await supabase.auth.signUp({
                email: validatedData.email,
                password: validatedData.password,
                options: {
                    data: {
                        first_name: validatedData.first_name,
                        last_name: validatedData.last_name,
                        role: validatedData.role,
                    }
                }
            });

            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
            } else {
                setSuccess(true);
                setTimeout(() => router.push("/dashboard"), 2000);
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
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#23234b] to-[#0f3460]">
            {/* Animated Background Orbs */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-hub-indigo/15 blur-[150px] rounded-full animate-pulse animate-float" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-hub-purple/15 blur-[150px] rounded-full animate-pulse animate-float" style={{ animationDelay: "1s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-hub-rose/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: "2s" }} />

            {/* Back to Login Link with fade-in */}
            <Link
                href="/login"
                className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-hub-indigo transition-all group animate-fade-in"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Login
            </Link>

            <div className="w-full max-w-[520px] space-y-6 animate-slide-up relative z-10">
                {/* Header with shine animation */}
                <div className="text-center space-y-3 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-hub-indigo via-hub-purple to-hub-rose shadow-xl shadow-hub-indigo/30 mb-2 animate-glass-shine">
                        <Send className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-outfit font-bold tracking-tight bg-gradient-to-r from-white via-white to-hub-rose bg-clip-text text-transparent animate-fade-in">
                        Join the Hub
                    </h1>
                    <p className="text-muted-foreground text-lg animate-fade-in">Start your innovation and learning journey today</p>
                </div>

                {/* Main Card with entrance animation */}
                <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl space-y-6 animate-pop">
                    {error && (
                        <div className="p-4 bg-red-500/15 border border-red-500/40 text-red-200 text-sm rounded-xl flex items-start gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-hub-teal/15 border border-hub-teal/40 text-hub-teal text-sm rounded-xl flex items-start gap-3 animate-pulse">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="font-medium">Account created successfully! Redirecting...</span>
                        </div>
                    )}

                    {/* Registration Form with floating labels */}
                    <form className="space-y-5 animate-fade-in" onSubmit={handleRegister}>
                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 relative">
                                <input
                                    name="first_name"
                                    type="text"
                                    required
                                    placeholder=" "
                                    className={`w-full bg-black/30 border px-4 pt-6 pb-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-base text-white placeholder:text-transparent font-medium peer ${validationErrors.first_name
                                            ? "border-red-500/60 focus:ring-red-500/50 bg-red-500/5"
                                            : "border-white/20 focus:ring-hub-indigo/50 focus:border-hub-indigo/50 hover:border-white/30"
                                        }`}
                                />
                                <label className="absolute left-4 top-2 -translate-y-0 text-xs font-semibold text-hub-indigo/70 pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-muted-foreground peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-hub-indigo">
                                    First Name
                                </label>
                                {validationErrors.first_name && (
                                    <p className="text-sm text-red-400 mt-1 flex items-center gap-1 animate-shake">
                                        <AlertCircle className="w-4 h-4" />
                                        {validationErrors.first_name}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2 relative">
                                <input
                                    name="last_name"
                                    type="text"
                                    required
                                    placeholder=" "
                                    className={`w-full bg-black/30 border px-4 pt-6 pb-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-base text-white placeholder:text-transparent font-medium peer ${validationErrors.last_name
                                            ? "border-red-500/60 focus:ring-red-500/50 bg-red-500/5"
                                            : "border-white/20 focus:ring-hub-indigo/50 focus:border-hub-indigo/50 hover:border-white/30"
                                        }`}
                                />
                                <label className="absolute left-4 top-2 -translate-y-0 text-xs font-semibold text-hub-indigo/70 pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-muted-foreground peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-hub-indigo">
                                    Last Name
                                </label>
                                {validationErrors.last_name && (
                                    <p className="text-sm text-red-400 mt-1 flex items-center gap-1 animate-shake">
                                        <AlertCircle className="w-4 h-4" />
                                        {validationErrors.last_name}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-hub-indigo/70 uppercase tracking-wider">Account Type</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'student', label: 'Student' },
                                    { value: 'mentor', label: 'Mentor' },
                                    { value: 'instructor', label: 'Instructor' }
                                ].map((roleOption) => (
                                    <label key={roleOption.value} className="relative cursor-pointer group">
                                        <input type="radio" name="role" value={roleOption.value} className="peer sr-only" defaultChecked={roleOption.value === 'student'} />
                                        <div className="text-center px-2 py-3 bg-black/30 border border-white/20 rounded-xl peer-checked:bg-hub-indigo/20 peer-checked:border-hub-indigo peer-checked:text-white text-muted-foreground transition-all peer-focus:ring-2 peer-focus:ring-hub-indigo/50">
                                            <span className="text-sm font-medium">{roleOption.label}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {validationErrors.role && (
                                <p className="text-sm text-red-400 mt-1 flex items-center gap-1 animate-shake">
                                    <AlertCircle className="w-4 h-4" />
                                    {validationErrors.role}
                                </p>
                            )}
                        </div>

                        {/* Email Input */}
                        <div className="space-y-2 relative">
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder=" "
                                className={`w-full bg-black/30 border px-4 pt-6 pb-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-base text-white placeholder:text-transparent font-medium peer ${validationErrors.email
                                        ? "border-red-500/60 focus:ring-red-500/50 bg-red-500/5"
                                        : "border-white/20 focus:ring-hub-indigo/50 focus:border-hub-indigo/50 hover:border-white/30"
                                    }`}
                            />
                            <label className="absolute left-4 top-2 -translate-y-0 text-xs font-semibold text-hub-indigo/70 pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-muted-foreground peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-hub-indigo flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email Address
                            </label>
                            {validationErrors.email && (
                                <p className="text-sm text-red-400 mt-1 flex items-center gap-1 animate-shake">
                                    <AlertCircle className="w-4 h-4" />
                                    {validationErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2 relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder=" "
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full bg-black/30 border px-4 pt-6 pb-2 pr-12 rounded-xl focus:outline-none focus:ring-2 transition-all text-base text-white placeholder:text-transparent font-medium peer ${validationErrors.password
                                        ? "border-red-500/60 focus:ring-red-500/50 bg-red-500/5"
                                        : "border-white/20 focus:ring-hub-indigo/50 focus:border-hub-indigo/50 hover:border-white/30"
                                    }`}
                            />
                            <label className="absolute left-4 top-2 -translate-y-0 text-xs font-semibold text-hub-indigo/70 pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-muted-foreground peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-hub-indigo flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Password
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors animate-fade-in"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                            {password && (
                                <div className="space-y-2 mt-3 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-medium">
                                            <span className="text-muted-foreground">Strength: </span>
                                            <span className={passwordStrength.strength > 0 ? "text-white font-semibold" : "text-muted-foreground"}>
                                                {passwordStrength.label}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            {[...Array(4)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 w-3 rounded-full transition-all ${i < passwordStrength.strength ? passwordStrength.color : "bg-white/10"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
                                        <label className="flex items-center gap-1.5">
                                            {password.length >= 8 ? "✓" : "○"} 8+ characters
                                        </label>
                                        <label className="flex items-center gap-1.5">
                                            {/[A-Z]/.test(password) ? "✓" : "○"} Uppercase
                                        </label>
                                        <label className="flex items-center gap-1.5">
                                            {/[0-9]/.test(password) ? "✓" : "○"} Number
                                        </label>
                                        <label className="flex items-center gap-1.5">
                                            {/[^A-Za-z0-9]/.test(password) ? "✓" : "○"} Special char
                                        </label>
                                    </div>
                                </div>
                            )}
                            {validationErrors.password && (
                                <p className="text-sm text-red-400 mt-2 flex items-center gap-1 animate-shake">
                                    <AlertCircle className="w-4 h-4" />
                                    {validationErrors.password}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2 relative">
                            <input
                                name="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                required
                                placeholder=" "
                                className={`w-full bg-black/30 border px-4 pt-6 pb-2 pr-12 rounded-xl focus:outline-none focus:ring-2 transition-all text-base text-white placeholder:text-transparent font-medium peer ${validationErrors.confirmPassword
                                        ? "border-red-500/60 focus:ring-red-500/50 bg-red-500/5"
                                        : "border-white/20 focus:ring-hub-indigo/50 focus:border-hub-indigo/50 hover:border-white/30"
                                    }`}
                            />
                            <label className="absolute left-4 top-2 -translate-y-0 text-xs font-semibold text-hub-indigo/70 pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-muted-foreground peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-hub-indigo">
                                Confirm Password
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors animate-fade-in"
                            >
                                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                            {validationErrors.confirmPassword && (
                                <p className="text-sm text-red-400 mt-1 flex items-center gap-1 animate-shake">
                                    <AlertCircle className="w-4 h-4" />
                                    {validationErrors.confirmPassword}
                                </p>
                            )}
                        </div>

                        {/* Sign Up Button with pulse */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-hub-indigo via-hub-purple to-hub-rose text-white rounded-xl font-bold hover:from-hub-indigo/90 hover:via-hub-purple/90 hover:to-hub-rose/90 transition-all shadow-lg shadow-hub-indigo/40 hover:shadow-xl hover:shadow-hub-indigo/50 mt-6 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:from-hub-indigo disabled:hover:via-hub-purple disabled:hover:to-hub-rose active:scale-95 duration-200 animate-pulse"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Creating account...</span>
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    {/* Login Link with fade-in */}
                    <div className="pt-4 text-center border-t border-white/10 animate-fade-in">
                        <p className="text-muted-foreground text-sm">
                            Already have an account?{" "}
                            <Link href="/login" className="font-semibold text-hub-indigo hover:text-hub-indigo/80 transition-colors hover:underline">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer Text with fade-in */}
                <p className="text-center text-xs text-muted-foreground animate-fade-in">
                    By creating an account, you agree to our<br />
                    <Link href="#" className="text-hub-indigo hover:underline">Terms of Service</Link> and <Link href="#" className="text-hub-indigo hover:underline">Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
}
