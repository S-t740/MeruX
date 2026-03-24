import { verifyCertificate } from "@/lib/actions/certificate-actions";
import { Award, BadgeCheck, Download, Calendar, ExternalLink } from "lucide-react";

export default async function CertificateVerificationPage({ params }: { params: { certificate_code: string } }) {
  const certificate = await verifyCertificate(params.certificate_code);

  if (!certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border dark:border-gray-700">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold dark:text-white text-gray-900">Certificate Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">
            We couldn't verify this certificate code. It may be invalid or has been revoked.
          </p>
        </div>
      </div>
    );
  }

  // Formatting dates
  const issueDate = new Date(certificate.issued_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0">
      
      <div className="max-w-4xl mx-auto mb-8 print:hidden flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BadgeCheck className="text-blue-500 w-6 h-6" />
            Verified Credential
          </h2>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
          onClick={() => {
            // In a real app, this would use pdf-lib or window.print()
            // using window.print() here for simplicity as it's a client action
          }}
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {/* Certificate Frame */}
      <div className="max-w-4xl mx-auto bg-white border-8 border-double border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden print:shadow-none print:border-8 aspect-[1.414/1] flex flex-col items-center justify-center text-center p-12 lg:p-24 relative select-none">
        
        {/* Background Details */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at center, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 pointer-events-none" />

        <div className="relative z-10 w-full">
          <div className="flex justify-center mb-8">
             <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg">
                <Award className="w-12 h-12" />
             </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-gray-900 dark:text-white mb-4 uppercase tracking-widest font-black">
            Certificate of Completion
          </h1>
          
          <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl uppercase tracking-widest mb-10">
            This is to certify that
          </p>

          <h2 className="text-4xl md:text-5xl font-script text-blue-700 dark:text-blue-400 mb-10 italic">
            {certificate.profiles?.full_name || "Student Name"}
          </h2>

          <p className="text-gray-600 dark:text-gray-300 text-lg mx-auto max-w-2xl mb-12">
            has successfully completed the course <strong className="text-gray-900 dark:text-white">{certificate.courses?.title}</strong> on the MTIH Learn platform, demonstrating proficiency and achieving a final score of <strong>{certificate.final_score}%</strong>.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-left border-t border-gray-200 dark:border-gray-700 pt-8 mt-auto w-full max-w-3xl mx-auto">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Date Issued</p>
              <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {issueDate}
              </p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Credential ID</p>
              <p className="font-semibold text-gray-900 dark:text-white font-mono text-sm break-all">
                {certificate.certificate_code}
              </p>
            </div>
            <div className="text-right md:text-left">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Verification</p>
              <p className="font-semibold text-blue-600 flex items-center md:justify-start justify-end gap-1 text-sm">
                mtih.io/cert
                <ExternalLink className="w-3 h-3" />
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
