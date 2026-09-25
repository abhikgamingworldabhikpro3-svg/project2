import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle,
  CreditCard,
  FileText,
  GraduationCap,
  Layers,
  Lock,
  Megaphone,
  QrCode,
  School,
  Shield,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { BackgroundSelector } from '../components/BackgroundSelector';
import { AuthModal } from '../components/AuthModal';
import { UserRole } from '../types';

interface LandingPageProps {
  initialJoinCode?: string;
  onStudentJoinDirect?: (code: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  initialJoinCode = '',
  onStudentJoinDirect,
}) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<UserRole>('teacher');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [quickJoinCode, setQuickJoinCode] = useState(initialJoinCode);

  // Interactive Live Feature Demo Tab in the Hero
  const [activeFeatureTab, setActiveFeatureTab] = useState<'overview' | 'attendance' | 'fees' | 'assignments' | 'materials'>('overview');

  const openAuth = (role: UserRole, mode: 'login' | 'register') => {
    setAuthRole(role);
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickJoinCode.trim()) return;
    if (onStudentJoinDirect) {
      onStudentJoinDirect(quickJoinCode.trim().toUpperCase());
    } else {
      openAuth('student', 'register');
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* 1-Row, 3-Zone Clean Top Navigation Contract */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Zone 1: Single text element wordmark with icon */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1">
                Tutor<span className="text-indigo-600">Flow</span>
              </span>
              <span className="hidden sm:block text-[10px] font-medium text-slate-400 -mt-1 tracking-wider uppercase">
                Tuition Management
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Clean Typography, No Pill Enclosures) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#showcase" className="hover:text-indigo-600 transition-colors">Live Platform</a>
            <a href="#security" className="hover:text-indigo-600 transition-colors">Data Isolation</a>
          </nav>

          {/* Zone 3: Primary Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <BackgroundSelector compact />
            <PWAInstallButton variant="nav" />
            <button
              onClick={() => openAuth('student', 'login')}
              className="px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Student Portal
            </button>
            <button
              onClick={() => openAuth('teacher', 'login')}
              className="px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors hidden sm:inline-block cursor-pointer"
            >
              Teacher Login
            </button>
            <button
              onClick={() => openAuth('teacher', 'register')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Zero-Pill Unboxed Text Metadata */}
            <div className="flex items-center justify-center gap-2 text-xs text-indigo-700 font-semibold mb-6">
              <span>Multi-Teacher Architecture</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Complete Data Isolation</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>PWA Offline Ready</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] max-w-4xl mx-auto">
              Your Tuition Practice.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500">
                Organized In One Seamless Flow.
              </span>
            </h1>

            <p className="mt-5 text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              TutorFlow empowers independent educators and coaching academies to run batches, record attendance, issue homework, collect fees with official receipts, and track student mastery with complete privacy.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => openAuth('teacher', 'register')}
                className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/25 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Create Educator Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => openAuth('student', 'login')}
                className="px-6 py-3.5 rounded-2xl border border-slate-200/90 bg-white/90 hover:bg-white text-slate-800 font-bold text-sm sm:text-base shadow-xs backdrop-blur-xs transition-all active:scale-95 cursor-pointer"
              >
                Student Sign In
              </button>
            </div>

            {/* Quick Student Join Box */}
            <div className="mt-8 max-w-md mx-auto p-4 rounded-2xl bg-white/95 shadow-xl shadow-slate-200/50 border border-slate-200/90 backdrop-blur-md">
              <form onSubmit={handleQuickJoin} className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickJoinCode}
                  onChange={(e) => setQuickJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit Join Code (e.g. 8K9B2X)"
                  maxLength={10}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-mono uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer"
                >
                  Join Class
                </button>
              </form>
              <p className="mt-2 text-[11px] text-slate-400">
                Students: Enter the 6-character code provided by your teacher to join instantly.
              </p>
            </div>
          </div>

          {/* Interactive Live Showcase of TutorFlow Software */}
          <div id="showcase" className="mt-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-slate-900/95 p-3 sm:p-5 shadow-2xl shadow-indigo-950/30 border border-slate-800">
              {/* Feature Switcher Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs font-mono text-slate-400 hidden sm:inline">
                    tutorflow.app/dashboard
                  </span>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-xl overflow-x-auto max-w-full">
                  <button
                    onClick={() => setActiveFeatureTab('overview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      activeFeatureTab === 'overview'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Teacher Hub
                  </button>
                  <button
                    onClick={() => setActiveFeatureTab('attendance')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      activeFeatureTab === 'attendance'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Attendance
                  </button>
                  <button
                    onClick={() => setActiveFeatureTab('fees')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      activeFeatureTab === 'fees'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Fee Receipts
                  </button>
                  <button
                    onClick={() => setActiveFeatureTab('assignments')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      activeFeatureTab === 'assignments'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Assignments
                  </button>
                  <button
                    onClick={() => setActiveFeatureTab('materials')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      activeFeatureTab === 'materials'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Study Notes
                  </button>
                </div>
              </div>

              {/* Showcase Visual Display */}
              <div className="mt-3 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 relative min-h-[300px] sm:min-h-[460px] flex items-center justify-center">
                {activeFeatureTab === 'overview' && (
                  <img
                    src="/hero_tuition_classroom.svg"
                    alt="TutorFlow Multi-Teacher Tuition Dashboard"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover max-h-[540px]"
                  />
                )}
                {activeFeatureTab === 'attendance' && (
                  <img
                    src="/feature_attendance.svg"
                    alt="TutorFlow Student Attendance Register"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-contain max-h-[500px] p-4"
                  />
                )}
                {activeFeatureTab === 'fees' && (
                  <img
                    src="/feature_fees.svg"
                    alt="TutorFlow Tuition Fee Receipt Generator"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-contain max-h-[500px] p-4"
                  />
                )}
                {activeFeatureTab === 'assignments' && (
                  <img
                    src="/feature_assignments.svg"
                    alt="TutorFlow Homework & Grading System"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-contain max-h-[500px] p-4"
                  />
                )}
                {activeFeatureTab === 'materials' && (
                  <img
                    src="/feature_materials.svg"
                    alt="TutorFlow Study Materials and AI Explanations"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-contain max-h-[500px] p-4"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features Section */}
        <section id="features" className="py-20 bg-white/70 backdrop-blur-md border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Crafted for the Realities of Modern Coaching
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-500">
                Everything required to eliminate admin chaos, keep parents informed, and help students thrive.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Class & Batch Roster</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Set up separate batches by subject or grade, configure seat limits, and generate printable QR code invitations with direct join links.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                  <span>Batch Invitations</span>
                  <span>Direct QR Codes &rarr;</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Session Attendance</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Take rapid roll call in seconds. Record Present, Absent, Late, or Excused with duplicate prevention and automatic monthly attendance percentage summaries.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-semibold">
                  <span>Daily Registers</span>
                  <span>Instant Calculations &rarr;</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-cyan-300 hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Assignments & Grading</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Publish homework tasks with clear rubrics and due dates. Students submit their work directly, and you provide marks, detailed feedback, and remarks.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-cyan-600 font-semibold">
                  <span>Online Submissions</span>
                  <span>Gradebook Included &rarr;</span>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Fee Ledger & Receipts</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Track recurring tuition fees, admission costs, and pending balances. Record cash, UPI, or bank payments and generate official printable PDF receipts.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-amber-600 font-semibold">
                  <span>Payment Tracking</span>
                  <span>Printable Slips &rarr;</span>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-violet-300 hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Study Notes & AI Explanations</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Organize lesson handouts, revision notes, and reference links by chapter. Leverage built-in Gemini high-thinking to break down difficult concepts for students.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-violet-600 font-semibold">
                  <span>Structured Materials</span>
                  <span>AI Learning Studio &rarr;</span>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Broadcast Alerts & Notices</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Instantly inform an entire class or specific batches about test schedules, holiday revisions, or venue changes with high-priority announcement banners.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-rose-600 font-semibold">
                  <span>Instant Delivery</span>
                  <span>Targeted Audiences &rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Multi-Teacher Isolation Promise */}
        <section id="security" className="py-16 bg-slate-900 text-white relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400 mb-4">
              <Shield className="w-4 h-4" />
              <span>Strict Firestore Multi-Tenant Isolation</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Your Teaching Data Belongs Exclusively to You
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Teacher A never sees Teacher B's students, classes, or revenue. This guarantee is enforced by Cloud Firestore Security Rules on every single request, not just in UI filters.
            </p>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <CheckCircle className="w-5 h-5 text-emerald-400 mb-3" />
                <h4 className="font-bold text-sm text-white">Full Tenant Isolation</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Every class, fee, and student enrollment is bound to your unique teacherId.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <CheckCircle className="w-5 h-5 text-emerald-400 mb-3" />
                <h4 className="font-bold text-sm text-white">Student Privacy Safeguard</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Students can only access their personal grades, fee records, and enrolled materials.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <CheckCircle className="w-5 h-5 text-emerald-400 mb-3" />
                <h4 className="font-bold text-sm text-white">Offline PWA Resilience</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Installable on desktop, Android, and iOS with cached offline capability.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final Conversion Section */}
        <section className="py-16 bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-800 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Upgrade Your Tuition Management?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-indigo-100 max-w-xl mx-auto">
              Set up your tuition portal in under 2 minutes. Free registration, zero server setup required.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => openAuth('teacher', 'register')}
                className="px-6 py-3.5 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm sm:text-base shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                Create Your Teacher Account
              </button>
              <button
                onClick={() => openAuth('student', 'login')}
                className="px-6 py-3.5 rounded-2xl border border-white/30 hover:bg-white/10 text-white font-bold text-sm sm:text-base transition-all active:scale-95 cursor-pointer"
              >
                Access Student Portal
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
              TF
            </div>
            <span className="font-bold text-slate-800">TutorFlow</span>
            <span className="text-slate-400">— Independent Multi-Teacher Tuition Management</span>
          </div>
          <p>© 2026 TutorFlow Platform. All rights reserved.</p>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authRole}
        initialMode={authMode}
        prefilledJoinCode={quickJoinCode}
      />
    </div>
  );
};
