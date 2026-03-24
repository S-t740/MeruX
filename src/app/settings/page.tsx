"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, User, Lock, Bell, LogOut, AlertCircle, CheckCircle2, Loader2, Save, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [activeSection, setActiveSection] = useState("profile");

    const [formData, setFormData] = useState({
        first_name: "", last_name: "",
        email: "",
        bio: "",
        job_title: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        pushNotifications: true,
        twoFactorAuth: false,
    });

    // Load user profile on mount
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { router.push("/login"); return; }

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        first_name: profile.first_name || "", last_name: profile.last_name || "",
                        email: profile.email || user.email || "",
                        bio: profile.bio || "",
                        job_title: profile.job_title || "",
                    }));
                }
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [supabase, router]);

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePreferenceChange = (key: keyof typeof preferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from("profiles")
                .update({
                    first_name: formData.first_name, last_name: formData.last_name,
                    bio: formData.bio,
                    job_title: formData.job_title,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id);

            if (error) throw error;
            showMessage("success", "Profile updated successfully!");
        } catch (error: any) {
            showMessage("error", error.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            showMessage("error", "New passwords don't match");
            return;
        }
        if (formData.newPassword.length < 6) {
            showMessage("error", "Password must be at least 6 characters");
            return;
        }
        setSavingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: formData.newPassword });
            if (error) throw error;
            showMessage("success", "Password changed successfully!");
            setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
        } catch (error: any) {
            showMessage("error", error.message || "Failed to change password");
        } finally {
            setSavingPassword(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    if (loading) {
        return <div className="p-12 text-center animate-pulse text-muted-foreground text-xs uppercase tracking-widest">Loading account settings...</div>;
    }

    const navItems = [
        { icon: User, label: "Profile", id: "profile" },
        { icon: Lock, label: "Security", id: "security" },
        { icon: Bell, label: "Notifications", id: "notifications" },
    ];

    return (
        <div className="space-y-8 pb-12">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/50">
                    <div className="page-header mb-0">
                        <h1 className="page-title">Settings</h1>
                        <p className="page-description">Manage your account, security, and notification preferences.</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === "success"
                        ? "bg-hub-teal/15 border border-hub-teal/40 text-hub-teal"
                        : "bg-red-500/15 border border-red-500/40 text-red-200"
                        }`}>
                        {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1">
                        <div className="premium-card p-4 sticky top-8 space-y-2">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeSection === item.id
                                        ? "bg-hub-indigo/10 text-hub-indigo border border-hub-indigo/10"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            ))}
                            <div className="pt-4 border-t border-border/50">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all text-sm font-medium"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {activeSection === "profile" && (
                            <div className="premium-card p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-hub-indigo" />
                                    <h2 className="text-xl font-bold font-outfit">Profile Information</h2>
                                </div>

                                {/* Avatar */}
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-2xl bg-hub-indigo/10 border border-hub-indigo/20 flex items-center justify-center text-3xl font-bold text-hub-indigo uppercase">
                                        {formData.first_name?.[0] || formData.email?.[0] || "?"}
                                    </div>
                                    <div>
                                        <p className="font-bold font-outfit">{(formData.first_name ? formData.first_name + " " + (formData.last_name || "") : "") || "Your Name"}</p>
                                        <p className="text-xs text-muted-foreground">{formData.email}</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSaveProfile} className="space-y-5">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">First Name</label>
                                            <input
                                                name="first_name"
                                                type="text"
                                                value={formData.first_name || ""}
                                                onChange={handleInputChange}
                                                placeholder="First Name"
                                                className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 focus:border-hub-indigo/50 text-sm font-medium transition-all"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Last Name</label>
                                            <input
                                                name="last_name"
                                                type="text"
                                                value={formData.last_name || ""}
                                                onChange={handleInputChange}
                                                placeholder="Last Name"
                                                className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 focus:border-hub-indigo/50 text-sm font-medium transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Email</label>
                                        <input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            readOnly
                                            className="w-full bg-accent/10 border border-border/30 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground cursor-not-allowed"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed from here</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Job Title / Headline</label>
                                        <input
                                            name="job_title"
                                            type="text"
                                            value={formData.job_title || ""}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Full stack software dev"
                                            className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 focus:border-hub-indigo/50 text-sm font-medium transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Bio</label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                            placeholder="Tell us about yourself..."
                                            rows={3}
                                            className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 focus:border-hub-indigo/50 text-sm font-medium resize-none transition-all"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full py-3 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/20 disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        {saving ? "Saving..." : "Save Profile"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeSection === "security" && (
                            <div className="premium-card p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Lock className="w-5 h-5 text-hub-indigo" />
                                    <h2 className="text-xl font-bold font-outfit">Change Password</h2>
                                </div>

                                <form onSubmit={handleChangePassword} className="space-y-5">
                                    {[
                                        { name: "newPassword", label: "New Password", placeholder: "Min. 6 characters" },
                                        { name: "confirmPassword", label: "Confirm New Password", placeholder: "Repeat new password" },
                                    ].map(field => (
                                        <div key={field.name}>
                                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{field.label}</label>
                                            <input
                                                name={field.name}
                                                type="password"
                                                value={formData[field.name as keyof typeof formData]}
                                                onChange={handleInputChange}
                                                placeholder={field.placeholder}
                                                required
                                                className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 focus:border-hub-indigo/50 text-sm font-medium transition-all"
                                            />
                                        </div>
                                    ))}

                                    <button
                                        type="submit"
                                        disabled={savingPassword}
                                        className="w-full py-3 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/20 disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {savingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                                        {savingPassword ? "Updating..." : "Change Password"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeSection === "notifications" && (
                            <div className="premium-card p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-hub-indigo" />
                                    <h2 className="text-xl font-bold font-outfit">Notification Preferences</h2>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { key: "emailNotifications", label: "Email Notifications", desc: "Receive course updates and announcements via email" },
                                        { key: "pushNotifications", label: "Push Notifications", desc: "Get real-time in-app alerts" },
                                        { key: "twoFactorAuth", label: "Two-Factor Authentication", desc: "Add extra security to your account" },
                                    ].map(item => (
                                        <label key={item.key} className="flex items-center justify-between p-5 bg-accent/20 border border-border/50 rounded-2xl hover:bg-accent/30 cursor-pointer transition-all">
                                            <div>
                                                <p className="font-bold text-sm">{item.label}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                            </div>
                                            <div
                                                onClick={() => handlePreferenceChange(item.key as keyof typeof preferences)}
                                                className={`relative w-12 h-6 rounded-full transition-all cursor-pointer ${preferences[item.key as keyof typeof preferences] ? "bg-hub-indigo" : "bg-accent"}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${preferences[item.key as keyof typeof preferences] ? "left-7" : "left-1"}`} />
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <button
                                    onClick={() => showMessage("success", "Notification preferences saved!")}
                                    className="w-full py-3 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/20 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" /> Save Preferences
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
