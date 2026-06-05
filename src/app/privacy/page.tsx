import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export const metadata = {
    title: "Privacy Policy | MeruX",
    description: "MeruX Privacy Policy — Meru Tech and Innovation Hub",
};

const sections = [
    {
        id: "introduction",
        title: "1. Introduction",
        content: (
            <p>MeruX is committed to protecting the privacy and personal information of learners, instructors, mentors, administrators, and institutional partners. This Privacy Policy explains how we collect, use, store, and protect your information.</p>
        ),
    },
    {
        id: "information-collected",
        title: "2. Information We Collect",
        content: (
            <div className="space-y-4">
                {[
                    {
                        heading: "Account Information",
                        color: "hub-indigo",
                        items: ["Full name", "Email address", "Phone number", "Institution information", "Profile information"],
                    },
                    {
                        heading: "Learning Information",
                        color: "hub-teal",
                        items: ["Courses enrolled", "Lesson progress", "Quiz and examination results", "Certificates earned", "Attendance records", "Learning activity logs"],
                    },
                    {
                        heading: "AI Interaction Data",
                        color: "hub-purple",
                        items: ["Questions submitted to AI assistants", "AI-generated learning content", "AI-assisted assessments and summaries"],
                    },
                    {
                        heading: "Technical Information",
                        color: "hub-amber",
                        items: ["Device information", "Browser information", "IP address", "Session logs", "Usage analytics"],
                    },
                ].map((group) => (
                    <div key={group.heading}>
                        <p className={`text-xs font-bold uppercase tracking-widest mb-2 text-${group.color}`}>{group.heading}</p>
                        <ul className="space-y-1.5">
                            {group.items.map((item) => (
                                <li key={item} className="flex items-start gap-2 text-sm">
                                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-${group.color} shrink-0`} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        ),
    },
    {
        id: "how-we-use",
        title: "3. How We Use Information",
        content: (
            <>
                <p>We use collected information to:</p>
                <ul className="mt-3 space-y-2">
                    {[
                        "Deliver educational services",
                        "Manage user accounts",
                        "Track academic progress",
                        "Generate certificates",
                        "Improve learning experiences",
                        "Support mentorship programs",
                        "Enhance AI-powered learning features",
                        "Ensure platform security",
                    ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hub-indigo shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </>
        ),
    },
    {
        id: "recordings",
        title: "4. Session Recordings",
        content: (
            <>
                <p>Where live sessions are recorded, recordings may contain:</p>
                <ul className="mt-3 space-y-2">
                    {["Audio", "Video", "Chat messages", "Shared content", "Participation records"].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hub-rose shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
                <p className="mt-3">Recordings may be used for educational review, institutional compliance, and quality assurance purposes.</p>
            </>
        ),
    },
    {
        id: "data-sharing",
        title: "5. Data Sharing",
        content: (
            <>
                <p className="font-semibold text-white">We do not sell personal information.</p>
                <p className="mt-3">Information may be shared only with:</p>
                <ul className="mt-2 space-y-2">
                    {[
                        "Authorized instructors and tutors",
                        "Institutional administrators",
                        "Service providers supporting platform operations",
                        "Government or regulatory authorities when legally required",
                    ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hub-teal shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </>
        ),
    },
    {
        id: "security",
        title: "6. Data Security",
        content: (
            <p>We implement reasonable administrative, technical, and organizational measures to protect personal information against unauthorized access, loss, misuse, or disclosure.</p>
        ),
    },
    {
        id: "retention",
        title: "7. Data Retention",
        content: (
            <>
                <p>Information is retained only for as long as necessary to:</p>
                <ul className="mt-3 space-y-2">
                    {["Provide services", "Meet legal obligations", "Maintain academic records", "Verify certifications"].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hub-indigo shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </>
        ),
    },
    {
        id: "rights",
        title: "8. User Rights",
        content: (
            <>
                <p>Users may request:</p>
                <ul className="mt-3 space-y-2">
                    {[
                        "Access to personal information",
                        "Correction of inaccurate information",
                        "Deletion of eligible information",
                        "Withdrawal of consent where applicable",
                    ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hub-purple shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
                <p className="mt-3">Requests may be submitted through official platform support channels.</p>
            </>
        ),
    },
    {
        id: "cookies",
        title: "9. Cookies and Analytics",
        content: (
            <>
                <p>MeruX may use cookies and analytics technologies to:</p>
                <ul className="mt-3 space-y-2">
                    {["Improve performance", "Remember user preferences", "Analyze platform usage", "Enhance user experience"].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hub-amber shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </>
        ),
    },
    {
        id: "children",
        title: "10. Children's Privacy",
        content: (
            <p>Educational institutions using MeruX are responsible for ensuring appropriate consent and compliance when minors access the platform.</p>
        ),
    },
    {
        id: "changes",
        title: "11. Changes to this Policy",
        content: (
            <p>We may update this Privacy Policy periodically. Updates will be posted on the platform.</p>
        ),
    },
    {
        id: "contact",
        title: "12. Contact",
        content: (
            <div className="space-y-1">
                <p className="font-semibold">Meru Tech and Innovation Hub</p>
                <p>Email: <a href="mailto:merutechhub@gmail.com" className="text-hub-indigo hover:underline">merutechhub@gmail.com</a></p>
                <p>Website: <a href="https://merutechhub.co.ke" target="_blank" rel="noopener noreferrer" className="text-hub-indigo hover:underline">merutechhub.co.ke</a></p>
                <p>Location: Meru, Kenya</p>
            </div>
        ),
    },
];

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#23234b] to-[#0f3460] relative">
            {/* Background orbs */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-hub-purple/10 blur-[140px] rounded-full pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-hub-teal/10 blur-[140px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-20 bg-black/40 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/register" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Sign Up
                    </Link>
                    <div className="flex items-center gap-2 text-sm font-bold text-white/80">
                        <Lock className="w-4 h-4 text-hub-teal" />
                        MeruX Legal
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12 relative z-10">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-hub-teal to-hub-indigo shadow-xl shadow-hub-teal/30 mb-5">
                        <Lock className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-outfit font-bold bg-gradient-to-r from-white via-white to-hub-teal bg-clip-text text-transparent mb-3">
                        Privacy Policy
                    </h1>
                    <p className="text-white/50 text-sm">Last Updated: June 2025 &nbsp;·&nbsp; Meru Tech and Innovation Hub</p>
                    <div className="mt-4 flex justify-center gap-3">
                        <Link href="/terms" className="text-xs text-hub-indigo hover:underline font-medium">Terms of Service →</Link>
                    </div>
                </div>

                {/* Table of Contents */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mb-10">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Table of Contents</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sections.map((s) => (
                            <a key={s.id} href={`#${s.id}`} className="text-sm text-white/60 hover:text-hub-teal transition-colors hover:underline flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-hub-teal/60 shrink-0" />
                                {s.title}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Sections */}
                <div className="space-y-6">
                    {sections.map((section) => (
                        <section
                            key={section.id}
                            id={section.id}
                            className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 scroll-mt-24 hover:border-white/20 transition-colors"
                        >
                            <h2 className="font-outfit font-bold text-lg text-white mb-3">{section.title}</h2>
                            <div className="text-white/70 text-sm leading-relaxed">{section.content}</div>
                        </section>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-white/10 text-center space-y-3">
                    <p className="text-white/40 text-xs">© {new Date().getFullYear()} Meru Tech and Innovation Hub. All rights reserved.</p>
                    <div className="flex justify-center gap-6 text-xs">
                        <Link href="/terms" className="text-hub-indigo hover:underline">Terms of Service</Link>
                        <Link href="/register" className="text-white/50 hover:text-white transition-colors">Create Account</Link>
                        <Link href="/login" className="text-white/50 hover:text-white transition-colors">Sign In</Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
