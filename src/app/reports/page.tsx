"use client"

import { BarChart3, FileText, Download } from "lucide-react";

export default function ReportsPage() {
    return (
        <div className="space-y-8 pb-20">
            <div className="page-header">
                <h1 className="page-title">Reports & Exports</h1>
                <p className="page-description">Generate and download institutional progress reports, enrollment summaries, and performance exports.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {["Enrollment Report", "Completion Summary", "Grade Distribution", "Cohort Progress", "Research Output", "Certification Audit"].map((report, i) => (
                    <div key={i} className="premium-card p-6 space-y-4 group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-hub-indigo/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-hub-indigo" />
                            </div>
                            <h3 className="font-outfit font-bold group-hover:text-hub-indigo transition-colors">{report}</h3>
                        </div>
                        <button className="w-full py-2 flex items-center justify-center gap-2 bg-accent/30 hover:bg-accent rounded-xl text-xs font-bold transition-all">
                            <Download className="w-3 h-3" /> Export CSV
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
