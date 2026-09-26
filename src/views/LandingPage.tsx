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
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<UserRole>('teacher');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const [quickJoinCode, setQuickJoinCode] = useState('');

  const openAuth = (role: UserRole, mode: 'login' | 'register') => {
    setAuthRole(role);
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleQuickJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickJoinCode.trim()) return;
    setAuthRole('student');
    setAuthMode('register');
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white relative">
      {/* 1-Row Clean Top Navigation with Colorful Glow */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/70 shadow-xs relative">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-indigo-500 via-purple-500 via-pink-500 via-amber-400 to-cyan-400 opacity-90" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Wordmark with Vibrant Icon */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-0.5">
                Tutor<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">Flow</span>
              </span>
              <span className="hidden sm:block text-[10px] font-bold text-slate-400 -mt-1 tracking-wider uppercase">
                Tuition & Coaching Hub
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Platform Features</a>
            <a href="#security" className="hover:text-indigo-600 transition-colors">Privacy & Isolation</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <BackgroundSelector compact />
            <PWAInstallButton variant="nav" />
            <button
              onClick={() => openAuth('student', 'login')}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              Student Portal
            </button>
            <button
              onClick={() => openAuth('teacher', 'login')}
              className="px-3 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors hidden sm:inline-block cursor-pointer whitespace-nowrap"
            >
              Teacher Login
            </button>
            <button
              onClick={() => openAuth('teacher', 'register')}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-[11px] sm:text-sm shadow-md shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span className="sm:hidden">Start Free</span>
              <span className="hidden sm:inline">Get Started Free</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section with Vibrant Ambient Mesh Background */}
        <section className="relative overflow-hidden pt-14 pb-20 sm:pt-24 sm:pb-28">
          {/* Colorful Ambient Glow Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-aura" />
          <div className="absolute top-1/3 left-10 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
          <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Zero-Pill Unboxed Text Metadata */}
            <div className="flex items-center justify-center gap-2 text-xs text-indigo-700 font-extrabold mb-6 tracking-wide flex-wrap">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Multi-Teacher Architecture
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>100% Private Cloud Firestore</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-emerald-600">Offline PWA Capable</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] max-w-4xl mx-auto">
              Your Tuition Practice.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Organized In One Seamless Flow.
              </span>
            </h1>

            <p className="mt-5 text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
              Empowering tutors and coaching academies to run batches, record session attendance, issue homework, collect fees with official PDF receipts, and share notes with complete peace of mind.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
              <button
                onClick={() => openAuth('teacher', 'register')}
                className="px-5 sm:px-7 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-xs sm:text-base shadow-xl shadow-indigo-600/30 transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Create Educator Account</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                onClick={() => openAuth('student', 'login')}
                className="px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl border border-slate-200/90 bg-white/95 hover:bg-white text-slate-800 font-extrabold text-xs sm:text-base shadow-sm backdrop-blur-md transition-all active:scale-95 cursor-pointer hover:border-indigo-200 hover:text-indigo-600 animate-in fade-in duration-300"
              >
                Student Portal
              </button>
            </div>

            {/* Quick Student Join Box with Luminous Glow */}
            <div className="mt-10 max-w-md mx-auto p-4 sm:p-5 rounded-3xl bg-white/90 shadow-2xl shadow-indigo-500/10 border border-white/80 backdrop-blur-2xl relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 -z-10 pointer-events-none" />
              <form onSubmit={handleQuickJoinSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={quickJoinCode}
                  onChange={(e) => setQuickJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit Join Code (e.g. 8K9B2X)"
                  maxLength={10}
                  className="flex-1 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-mono uppercase font-bold rounded-2xl border border-slate-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 shadow-inner text-center sm:text-left"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-black text-xs sm:text-sm whitespace-nowrap shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Join Class
                </button>
              </form>
              <p className="mt-2.5 text-[11px] font-medium text-slate-400">
                Students: Enter the 6-character code provided by your teacher to pre-select your batch and sign up instantly.
              </p>
            </div>
          </div>
        </section>

        {/* Bento Grid Features Section with Colorful Visual Cards */}
        <section id="features" className="py-24 bg-white/75 backdrop-blur-xl border-y border-slate-200/70 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider border border-indigo-200/60 inline-block mb-3">
                Tuition Command Center
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Crafted for the Realities of Modern Coaching
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-500 font-medium">
                Everything required to eliminate admin chaos, keep parents informed, and help students succeed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Feature 1: Classes & Batches */}
              <div className="p-7 rounded-3xl bg-white/90 border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center mb-5 shadow-md shadow-sky-500/20 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                    <School className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Class & Batch Roster</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                    Set up separate batches by subject or grade, configure seat limits, and generate printable QR code invitations with direct join links.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-bold">
                  <span>Batch Invitations</span>
                  <span className="group-hover:translate-x-1 transition-transform">Direct QR Codes &rarr;</span>
                </div>
              </div>

              {/* Feature 2: Attendance */}
              <div className="p-7 rounded-3xl bg-white/90 border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-5 shadow-md shadow-emerald-500/20 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Session Attendance</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                    Take rapid roll call in seconds. Record Present, Absent, Late, or Excused with duplicate prevention and automatic monthly attendance percentage summaries.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-bold">
                  <span>Daily Registers</span>
                  <span className="group-hover:translate-x-1 transition-transform">Instant Calculations &rarr;</span>
                </div>
              </div>

              {/* Feature 3: Assignments */}
              <div className="p-7 rounded-3xl bg-white/90 border border-slate-200/80 shadow-xs hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center mb-5 shadow-md shadow-cyan-500/20 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Assignments & Grading</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                    Publish homework tasks with clear rubrics and due dates. Students submit their work directly, and you provide marks, detailed feedback, and remarks.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-cyan-600 font-bold">
                  <span>Online Submissions</span>
                  <span className="group-hover:translate-x-1 transition-transform">Gradebook Included &rarr;</span>
                </div>
              </div>

              {/* Feature 4: Fees & Receipts */}
              <div className="p-7 rounded-3xl bg-white/90 border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mb-5 shadow-md shadow-amber-500/20 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Fee Ledger & Receipts</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                    Track recurring tuition fees, admission costs, and pending balances. Record cash, UPI, or bank payments and generate official printable PDF receipts.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-amber-600 font-bold">
                  <span>Payment Tracking</span>
                  <span className="group-hover:translate-x-1 transition-transform">Printable Slips &rarr;</span>
                </div>
              </div>

              {/* Feature 5: Study Notes */}
              <div className="p-7 rounded-3xl bg-white/90 border border-slate-200/80 shadow-xs hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center mb-5 shadow-md shadow-purple-500/20 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Study Notes & AI Explanations</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                    Organize lesson handouts, revision notes, and reference links by chapter. Leverage built-in Gemini high-thinking to break down difficult concepts for students.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-purple-600 font-bold">
                  <span>Structured Materials</span>
                  <span className="group-hover:translate-x-1 transition-transform">AI Learning Studio &rarr;</span>
                </div>
              </div>

              {/* Feature 6: Broadcast Alerts */}
              <div className="p-7 rounded-3xl bg-white/90 border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center mb-5 shadow-md shadow-rose-500/20 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Broadcast Alerts & Notices</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                    Instantly inform an entire class or specific batches about test schedules, holiday revisions, or venue changes with high-priority announcement banners.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-rose-600 font-bold">
                  <span>Instant Delivery</span>
                  <span className="group-hover:translate-x-1 transition-transform">Targeted Audiences &rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Multi-Teacher Isolation Promise */}
        <section id="security" className="py-20 bg-slate-950 text-white relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 mb-4">
              <Shield className="w-4 h-4" />
              <span>Strict Cloud Firestore Multi-Tenant Isolation</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Your Teaching Data Belongs Exclusively to You
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
              Teacher A never sees Teacher B&apos;s students, classes, or revenue. This guarantee is enforced by Cloud Firestore Security Rules on every single request.
            </p>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
                <CheckCircle className="w-5 h-5 text-emerald-400 mb-3" />
                <h4 className="font-extrabold text-sm text-white">Full Tenant Isolation</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                  Every class, fee, and student enrollment is bound to your unique teacherId.
                </p>
              </div>
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
                <CheckCircle className="w-5 h-5 text-emerald-400 mb-3" />
                <h4 className="font-extrabold text-sm text-white">Student Privacy Safeguard</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                  Students can only access their personal grades, fee records, and enrolled materials.
                </p>
              </div>
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
                <CheckCircle className="w-5 h-5 text-emerald-400 mb-3" />
                <h4 className="font-extrabold text-sm text-white">Offline PWA Resilience</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                  Installable on desktop, Android, and iOS with cached offline capability.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final Conversion Section */}
        <section className="py-20 bg-gradient-to-tr from-indigo-700 via-purple-700 to-indigo-900 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Ready to Upgrade Your Tuition Management?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-indigo-100 max-w-xl mx-auto font-medium">
              Set up your tuition portal in under 2 minutes. Free registration, zero server setup required.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
              <button
                onClick={() => openAuth('teacher', 'register')}
                className="px-7 py-4 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-black text-sm sm:text-base shadow-2xl transition-all active:scale-95 cursor-pointer"
              >
                Create Your Teacher Account
              </button>
              <button
                onClick={() => openAuth('student', 'login')}
                className="px-7 py-4 rounded-2xl border border-white/30 hover:bg-white/10 text-white font-black text-sm sm:text-base transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
              >
                Access Student Portal
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-xl border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
              TF
            </div>
            <span className="font-extrabold text-slate-900">TutorFlow</span>
            <span className="text-slate-400">— Multi-Teacher Tuition Management</span>
          </div>
          <p className="font-medium">© 2026 TutorFlow Platform. Contact: avharapal@gmail.com</p>
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
