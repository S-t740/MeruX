"use client"

import { useState } from "react";
import {
    CreditCard, Users, Video, HardDrive, Sparkles, BarChart3,
    CheckCircle, Lock, ArrowUp, Zap, Building2, Shield, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionPlan, PlanTier } from "@/types";

const plans: SubscriptionPlan[] = [
    {
        tier: "free",
        name: "Free",
        price_monthly: 0,
        limits: { max_learners: 25, max_tutors: 2, max_session_participants: 10, recording_storage_gb: 1, ai_queries_monthly: 100, analytics_access: false, custom_branding: false }
    },
    {
        tier: "starter",
        name: "Starter",
        price_monthly: 49,
        limits: { max_learners: 100, max_tutors: 8, max_session_participants: 50, recording_storage_gb: 10, ai_queries_monthly: 1000, analytics_access: true, custom_branding: false }
    },
    {
        tier: "professional",
        name: "Professional",
        price_monthly: 149,
        limits: { max_learners: 500, max_tutors: 25, max_session_participants: 200, recording_storage_gb: 50, ai_queries_monthly: 5000, analytics_access: true, custom_branding: true }
    },
    {
        tier: "enterprise",
        name: "Enterprise",
        limits: { max_learners: 999999, max_tutors: 999999, max_session_participants: 1000, recording_storage_gb: 1000, ai_queries_monthly: 999999, analytics_access: true, custom_branding: true }
    },
];

const currentTier: PlanTier = "professional";
const currentPlan = plans.find(p => p.tier === currentTier)!;
const currentUsage = { learners: 312, tutors: 18, storage_used_gb: 28.4, ai_queries_used: 3240 };

function UsageMeter({ label, used, max, unit, color, icon: Icon }: {
    label: string; used: number; max: number; unit: string; color: string; icon: any
}) {
    const pct = max === 999999 ? 0 : Math.round((used / max) * 100);
    const isWarning = pct > 75;
    const isCritical = pct > 90;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", color)} />
                    <span className="text-sm font-bold">{label}</span>
                </div>
                <div className="text-right">
                    <span className="font-outfit font-bold text-sm">
                        {used.toLocaleString()}
                        <span className="text-muted-foreground font-normal"> / {max === 999999 ? 'Unlimited' : max.toLocaleString()} {unit}</span>
                    </span>
                </div>
            </div>
            {max !== 999999 && (
                <div className="h-2.5 bg-accent rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all", isCritical ? "bg-hub-rose" : isWarning ? "bg-hub-amber" : "bg-hub-indigo")}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                </div>
            )}
            {max === 999999 && (
                <div className="h-2.5 bg-hub-teal/20 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-hub-teal/40 rounded-full" />
                </div>
            )}
            <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{max === 999999 ? '✓ Unlimited' : `${pct}% used`}</span>
                {max !== 999999 && <span>{(max - used).toLocaleString()} remaining</span>}
            </div>
        </div>
    );
}

const tierOrder: PlanTier[] = ['free', 'starter', 'professional', 'enterprise'];
const tierColors: Record<PlanTier, string> = {
    free:         "border-border/50   bg-card",
    starter:      "border-hub-teal/40 bg-hub-teal/5",
    professional: "border-hub-indigo/50 bg-hub-indigo/5",
    enterprise:   "border-hub-purple/50 bg-hub-purple/5",
};
const tierTextColors: Record<PlanTier, string> = {
    free: "text-muted-foreground", starter: "text-hub-teal", professional: "text-hub-indigo", enterprise: "text-hub-purple"
};

export default function SubscriptionPage() {
    const [billingAnnual, setBillingAnnual] = useState(false);

    return (
        <div className="space-y-10 pb-12">
            {/* Header */}
            <div className="page-header">
                <div className="flex items-center gap-2 text-xs font-bold text-hub-indigo uppercase tracking-widest mb-2">
                    <Building2 className="w-4 h-4" /> Institution
                </div>
                <h1 className="page-title">Subscription Management</h1>
                <p className="page-description">Manage your plan, monitor usage limits, and ensure your institution has access to the right features.</p>
            </div>

            {/* Current Plan Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 premium-card p-6 space-y-6">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-hub-indigo/10 flex items-center justify-center">
                                    <CreditCard className="w-4 h-4 text-hub-indigo" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-hub-indigo">Current Plan</span>
                            </div>
                            <h2 className="text-3xl font-outfit font-bold">{currentPlan.name}</h2>
                            <p className="text-muted-foreground text-sm mt-1">
                                {currentPlan.price_monthly != null
                                    ? `$${billingAnnual ? Math.round(currentPlan.price_monthly * 0.8) : currentPlan.price_monthly}/mo`
                                    : 'Custom pricing'}
                                {billingAnnual && <span className="ml-2 text-hub-teal text-xs font-bold">· 20% annual discount</span>}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 bg-hub-teal/10 text-hub-teal text-xs font-bold rounded-full border border-hub-teal/20 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Active
                            </span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <UsageMeter label="Learners"         used={currentUsage.learners}        max={currentPlan.limits.max_learners}              unit="seats" color="text-hub-indigo" icon={Users}     />
                        <UsageMeter label="Tutors"           used={currentUsage.tutors}          max={currentPlan.limits.max_tutors}                unit=""      color="text-hub-teal"   icon={Shield}    />
                        <UsageMeter label="Recording Storage" used={currentUsage.storage_used_gb} max={currentPlan.limits.recording_storage_gb}       unit="GB"    color="text-hub-amber"  icon={HardDrive} />
                        <UsageMeter label="AI Queries"       used={currentUsage.ai_queries_used} max={currentPlan.limits.ai_queries_monthly}         unit="/ mo"  color="text-hub-purple" icon={Sparkles}  />
                    </div>
                </div>

                {/* Feature Summary */}
                <div className="premium-card p-6 space-y-4">
                    <h3 className="font-outfit font-bold">Plan Features</h3>
                    {[
                        { label: "Max session participants", value: `${currentPlan.limits.max_session_participants}`, icon: Video       },
                        { label: "Executive analytics",      value: currentPlan.limits.analytics_access ? "Included" : "Not included", icon: BarChart3 },
                        { label: "Custom branding",          value: currentPlan.limits.custom_branding  ? "Included" : "Not included", icon: Building2 },
                        { label: "AI Teaching Assistant",    value: "Included",                                                        icon: Sparkles  },
                        { label: "Session recordings",       value: `${currentPlan.limits.recording_storage_gb} GB`,                   icon: HardDrive },
                        { label: "Priority support",         value: currentTier === 'enterprise' ? "24/7" : "Business hours",          icon: Shield    },
                    ].map((f, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <f.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground">{f.label}</p>
                            </div>
                            <span className={cn("text-xs font-bold",
                                f.value === "Included" || f.value === "24/7" ? "text-hub-teal" :
                                f.value === "Not included" ? "text-muted-foreground" : "text-foreground"
                            )}>{f.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Plan Comparison */}
            <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h2 className="font-outfit font-bold text-xl">Available Plans</h2>
                    <button
                        onClick={() => setBillingAnnual(!billingAnnual)}
                        className={cn("flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all",
                            billingAnnual ? "bg-hub-teal/10 border-hub-teal/40 text-hub-teal" : "bg-accent/50 border-border/60 text-muted-foreground"
                        )}>
                        {billingAnnual ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                        Annual billing (save 20%)
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {plans.map(plan => {
                        const isCurrent = plan.tier === currentTier;
                        const isHigher = tierOrder.indexOf(plan.tier) > tierOrder.indexOf(currentTier);
                        return (
                            <div key={plan.tier} className={cn("rounded-2xl border p-5 space-y-5 relative", tierColors[plan.tier], isCurrent && "ring-2 ring-hub-indigo/30")}>
                                {isCurrent && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-hub-indigo text-white text-[10px] font-bold rounded-full uppercase tracking-widest whitespace-nowrap">
                                        Current Plan
                                    </div>
                                )}
                                <div>
                                    <p className={cn("font-outfit font-bold text-xl", tierTextColors[plan.tier])}>{plan.name}</p>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        {plan.price_monthly == null ? (
                                            <span className="font-bold text-foreground">Contact us</span>
                                        ) : plan.price_monthly === 0 ? (
                                            <span className="font-bold text-foreground">Free forever</span>
                                        ) : (
                                            <>
                                                <span className="font-bold text-foreground text-2xl">${billingAnnual ? Math.round(plan.price_monthly * 0.8) : plan.price_monthly}</span>/mo
                                            </>
                                        )}
                                    </p>
                                </div>
                                <div className="space-y-2 text-xs">
                                    {[
                                        `${plan.limits.max_learners === 999999 ? 'Unlimited' : plan.limits.max_learners} learners`,
                                        `${plan.limits.max_tutors   === 999999 ? 'Unlimited' : plan.limits.max_tutors} tutors`,
                                        `${plan.limits.max_session_participants} per session`,
                                        `${plan.limits.recording_storage_gb === 1000 ? '1 TB' : plan.limits.recording_storage_gb + ' GB'} storage`,
                                        `${plan.limits.ai_queries_monthly === 999999 ? 'Unlimited' : plan.limits.ai_queries_monthly.toLocaleString()} AI queries/mo`,
                                        plan.limits.analytics_access  ? 'Executive analytics' : null,
                                        plan.limits.custom_branding   ? 'Custom branding'     : null,
                                    ].filter(Boolean).map((f, i) => (
                                        <div key={i} className="flex items-center gap-2 text-muted-foreground">
                                            <CheckCircle className="w-3.5 h-3.5 text-hub-teal shrink-0" />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                                {isHigher ? (
                                    <button className={cn("w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                                        plan.tier === 'enterprise'
                                            ? "bg-hub-purple/10 text-hub-purple border border-hub-purple/30 hover:bg-hub-purple/20"
                                            : "bg-hub-indigo text-white hover:bg-hub-indigo/90 shadow-lg shadow-hub-indigo/20"
                                    )}>
                                        {plan.tier === 'enterprise' ? 'Contact Sales' : <><ArrowUp className="w-4 h-4" /> Upgrade</>}
                                    </button>
                                ) : isCurrent ? (
                                    <div className="w-full py-2.5 rounded-xl text-sm font-bold text-center text-hub-indigo bg-hub-indigo/10 border border-hub-indigo/20">
                                        ✓ Active Plan
                                    </div>
                                ) : (
                                    <div className="w-full py-2.5 rounded-xl text-sm font-bold text-center text-muted-foreground bg-accent/30">
                                        Downgrade
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
