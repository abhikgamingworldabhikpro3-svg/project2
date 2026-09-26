import React from 'react';
import { Shield, Lock, FileText, CheckCircle, X, Mail, School, Database, Smartphone } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContact?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onOpenContact,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header with Vibrant Accent */}
        <div className="relative p-6 sm:p-7 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Privacy Policy & Data Protection
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Last Updated: September 2026 · TutorFlow Tuition Platform
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>1. Complete Multi-Teacher & Student Data Isolation</span>
            </h3>
            <p className="text-slate-600">
              TutorFlow employs tenant-isolated security rules governed directly on Google Cloud Firestore. Every tuition academy and teacher owns an independent partition bound strictly to their authenticated Teacher ID. Students can only ever access batches they have joined via authorized 6-character invitation codes and which have been explicitly approved by the instructor.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-600" />
              <span>2. Information We Collect & How It Is Used</span>
            </h3>
            <p className="text-slate-600">
              We collect only the essential academic data required to facilitate tuition management:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Educator Profiles:</strong> Institute name, instructor name, email, official receipt headers, and currency preference.</li>
              <li><strong>Student Portals:</strong> Student name, email, phone number, gender, enrolled batch IDs, attendance records, homework submissions, and fee records.</li>
              <li><strong>Study Materials & Files:</strong> PDF notes, diagrams, and assignment attachments uploaded securely to Google Cloud Storage.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <School className="w-4 h-4 text-emerald-600" />
              <span>3. Student Join Approvals & Zero Un-Gated Access</span>
            </h3>
            <p className="text-slate-600">
              No student can view tuition materials, lecture timetable slots, homework, or fee history without entering a valid instructor code and receiving formal teacher approval. Teachers retain full administrative control to accept, reject, or un-enroll student members at any time.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-600" />
              <span>4. Offline Caching & Progressive Web App (PWA) Storage</span>
            </h3>
            <p className="text-slate-600">
              When using TutorFlow as an installed Progressive Web App, session metadata and cached timetables may be temporarily retained in local device storage (IndexedDB) to enable fast load speeds and offline continuity during network disruptions.
            </p>
          </div>

          {/* Section 5: Official Contact */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-indigo-950 text-xs sm:text-sm">Questions or Data Inquiries?</h4>
              <p className="text-[11px] sm:text-xs text-indigo-700 mt-0.5">
                Contact our privacy and support team at <span className="font-bold underline">avharapal@gmail.com</span>
              </p>
            </div>
            {onOpenContact && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenContact();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
              >
                Contact Support
              </button>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">TutorFlow Compliance & Data Privacy</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
