import { verifyCertificate } from "@/lib/actions/assessment";
import { Award, CheckCircle2, Calendar, User, BookOpen, Star, Shield } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props { params: { code: string } }

export default async function CertificatePage({ params }: Props) {
    const { data, error } = await verifyCertificate(params.code);

    if (error || !data) return notFound();

    const gradeColors: Record<string, { bg: string; text: string; label: string }> = {
        distinction: { bg: "from-hub-indigo via-purple-700 to-hub-teal", text: "text-white", label: "With Distinction" },
        credit: { bg: "from-hub-teal via-emerald-600 to-cyan-700", text: "text-white", label: "With Credit" },
        pass: { bg: "from-amber-600 via-orange-600 to-yellow-600", text: "text-white", label: "Pass" },
    };

    const grade = data.grade || "pass";
    const gradeStyle = gradeColors[grade] || gradeColors.pass;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-8">

            {/* Certificate Card */}
            <div className="w-full max-w-3xl">
                <div className={`bg-gradient-to-br ${gradeStyle.bg} rounded-3xl p-1 shadow-2xl shadow-hub-indigo/20`}>
                    <div className="bg-card rounded-[22px] p-10 md:p-14 space-y-8 relative overflow-hidden">
                        {/* Decorative bg */}
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #6d5dfc 0%, transparent 50%), radial-gradient(circle at 80% 20%, #00c4a7 0%, transparent 50%)" }}
                        />

                        {/* Logo / Brand */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-hub-indigo/10 flex items-center justify-center text-hub-indigo">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <span className="font-outfit font-bold text-lg">MeruX Learn</span>
                            </div>
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r ${gradeStyle.bg}`}>
                                <Star className="w-4 h-4" />
                                {gradeStyle.label}
                            </div>
                        </div>

                        {/* Certificate Title */}
                        <div className="text-center space-y-2 py-4">
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Certificate of Completion</p>
                            <h1 className="text-4xl md:text-5xl font-outfit font-bold text-foreground leading-tight">
                                This certifies that
                            </h1>
                        </div>

                        {/* Student Name */}
                        <div className="text-center py-4 border-y border-border/50">
                            <div className="flex items-center justify-center gap-3">
                                <User className="w-5 h-5 text-muted-foreground" />
                                <h2 className="text-3xl md:text-4xl font-outfit font-bold tracking-tight">
                                    {(data.profiles as any)?.full_name || "Student"}
                                </h2>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium mt-2">has successfully completed</p>
                        </div>

                        {/* Course Name */}
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl md:text-3xl font-outfit font-bold text-hub-indigo leading-snug">
                                {(data.courses as any)?.title}
                            </h3>
                            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground font-medium">
                                <Award className="w-4 h-4" />
                                <span>Final Score: <strong className="text-foreground">{data.final_score}%</strong></span>
                                <span>·</span>
                                <span>Grade: <strong className="text-foreground capitalize">{data.grade}</strong></span>
                            </div>
                        </div>

                        {/* Footer Meta */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-border/50 text-xs">
                            <div className="space-y-0.5">
                                <p className="font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> Issued On
                                </p>
                                <p className="font-bold">{new Date(data.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Shield className="w-3 h-3" /> Certificate Code
                                </p>
                                <p className="font-bold font-mono tracking-wider text-hub-indigo">{data.certificate_code}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="font-bold uppercase tracking-widest text-muted-foreground">Status</p>
                                <div className="flex items-center gap-1.5 text-hub-teal font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {data.is_valid ? "Valid" : "Revoked"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Banner */}
            <div className="w-full max-w-3xl bg-hub-teal/10 border border-hub-teal/20 rounded-2xl p-5 flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-hub-teal shrink-0" />
                <div>
                    <p className="font-bold text-sm text-hub-teal">Verified Certificate</p>
                    <p className="text-xs text-muted-foreground font-medium">
                        This certificate was issued by MeruX Learn and is cryptographically verified via code <code className="font-mono">{data.certificate_code}</code>.
                    </p>
                </div>
            </div>
        </div>
    );
}
