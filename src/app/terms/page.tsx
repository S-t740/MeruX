import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = {
    title: "Terms of Service | MeruX",
    description: "MeruX Terms of Service — Meru Tech and Innovation Hub",
};

const sections = [
    {
        id: "introduction",
        title: "1. Introduction",
        content: (
            <>
                <p>Welcome to <strong>MeruX</strong>, an online learning and innovation platform operated by Meru Tech and Innovation Hub ("MTIH", "we", "our", or "us").</p>
                <p className="mt-3">By accessing or using MeruX, you agree to be bound by these Terms of Service. If you do not agree to these terms, you should not access or use the platform.</p>
            </>
        ),
    },
    {
        id: "purpose",
        title: "2. Purpose of the Platform",
        content: (
            <>
                <p>MeruX is designed to provide:</p>
                <ul className="mt-3 space-y-2 list-none">
                    {[
                        "Online learning and training programs",
                        "Assessments and examinations",
                        "Certification services",
                        "Mentorship and coaching",
                        "Research and innovation collaboration",
                        "Live virtual learning sessions",
                        "AI-assisted educational support",
                    ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hub-indigo shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </>
        ),
    },
    {
        id: "accounts",
        title: "3. User Accounts",
        content: (
            <>
                <p>Users must provide accurate information during registration.</p>
                <p className="mt-3">You are responsible for:</p>
                <ul className="mt-2 space-y-2 list-none">
                    {["Maintaining account security", "Protecting login credentials", "Activities conducted under your account"].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hub-indigo shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
                <p className="mt-3">The platform reserves the right to suspend or terminate accounts involved in misuse or violations of these terms.</p>
            </>
        ),
    },
    {
        id: "acceptable-use",
        title: "4. Acceptable Use",
        content: (
            <>
                <p>Users shall not:</p>
                <ul className="mt-3 space-y-2 list-none">
                    {[
                        "Share account credentials",
                        "Attempt unauthorized access to systems",
                        "Upload malicious software",
                        "Distribute harmful, offensive, or unlawful content",
                        "Cheat in assessments or examinations",
                        "Interfere with platform operations",
                    ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hub-rose shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
                <p className="mt-3">Violation may result in suspension or permanent removal.</p>
            </>
        ),
    },
    {
        id: "content",
        title: "5. Learning Content",
        content: (
            <p>Courses, lessons, assessments, videos, and materials available on MeruX remain the intellectual property of their respective owners. Users may access content solely for educational purposes and may not reproduce, redistribute, or commercialize content without authorization.</p>
        ),
    },
    {
        id: "certificates",
        title: "6. Certificates",
        content: (
            <p>Certificates issued through MeruX are based on successful completion of course requirements. Meru Tech and Innovation Hub reserves the right to revoke certificates obtained through academic dishonesty, fraud, or violation of platform rules.</p>
        ),
    },
    {
        id: "ai",
        title: "7. AI Features",
        content: (
            <>
                <p>MeruX may utilize Artificial Intelligence technologies to:</p>
                <ul className="mt-3 space-y-2 list-none">
                    {["Generate learning materials", "Summarize content", "Answer educational questions", "Support learning activities"].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hub-purple shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
                <p className="mt-3">AI-generated responses may occasionally contain inaccuracies. Users are encouraged to verify critical information with instructors or official course materials.</p>
            </>
        ),
    },
    {
        id: "sessions",
        title: "8. Live Sessions and Mentorship",
        content: (
            <p>Users participating in virtual sessions, coaching programs, or mentorship activities must conduct themselves professionally and respectfully. Session recordings may be stored for educational, quality assurance, and compliance purposes.</p>
        ),
    },
    {
        id: "privacy",
        title: "9. Privacy and Data Protection",
        content: (
            <p>Personal data is handled according to the <Link href="/privacy" className="text-hub-indigo hover:underline font-medium">MeruX Privacy Policy</Link> and applicable data protection laws.</p>
        ),
    },
    {
        id: "availability",
        title: "10. Platform Availability",
        content: (
            <p>We strive to maintain platform availability but do not guarantee uninterrupted access. Maintenance, updates, technical failures, or external service interruptions may occasionally affect access.</p>
        ),
    },
    {
        id: "liability",
        title: "11. Limitation of Liability",
        content: (
            <p>Meru Tech and Innovation Hub shall not be liable for indirect, incidental, or consequential damages arising from use of the platform. Educational content is provided for learning purposes and should not be considered legal, medical, financial, or professional advice.</p>
        ),
    },
    {
        id: "modifications",
        title: "12. Modifications",
        content: (
            <p>We reserve the right to update these Terms of Service at any time. Continued use of the platform constitutes acceptance of revised terms.</p>
        ),
    },
    {
        id: "law",
        title: "13. Governing Law",
        content: (
            <p>These Terms shall be governed by the laws of the <strong>Republic of Kenya</strong>.</p>
        ),
    },
    {
        id: "contact",
        title: "14. Contact Information",
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

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#23234b] to-[#0f3460] relative">
            {/* Background orbs */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-hub-indigo/10 blur-[140px] rounded-full pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-hub-purple/10 blur-[140px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-20 bg-black/40 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/register" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Sign Up
                    </Link>
                    <div className="flex items-center gap-2 text-sm font-bold text-white/80">
                        <Shield className="w-4 h-4 text-hub-indigo" />
                        MeruX Legal
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12 relative z-10">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-hub-indigo to-hub-purple shadow-xl shadow-hub-indigo/30 mb-5">
                        <Shield className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-outfit font-bold bg-gradient-to-r from-white via-white to-hub-indigo bg-clip-text text-transparent mb-3">
                        Terms of Service
                    </h1>
                    <p className="text-white/50 text-sm">Last Updated: June 2025 &nbsp;·&nbsp; Meru Tech and Innovation Hub</p>
                    <div className="mt-4 flex justify-center gap-3">
                        <Link href="/privacy" className="text-xs text-hub-indigo hover:underline font-medium">Privacy Policy →</Link>
                    </div>
                </div>

                {/* Table of Contents */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mb-10">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Table of Contents</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sections.map((s) => (
                            <a key={s.id} href={`#${s.id}`} className="text-sm text-white/60 hover:text-hub-indigo transition-colors hover:underline flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-hub-indigo/60 shrink-0" />
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
                        <Link href="/privacy" className="text-hub-indigo hover:underline">Privacy Policy</Link>
                        <Link href="/register" className="text-white/50 hover:text-white transition-colors">Create Account</Link>
                        <Link href="/login" className="text-white/50 hover:text-white transition-colors">Sign In</Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
