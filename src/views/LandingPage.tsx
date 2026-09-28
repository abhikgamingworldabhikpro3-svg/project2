import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  HelpCircle,
  Layers,
  Lock,
  Megaphone,
  QrCode,
  School,
  Search,
  Shield,
  Smartphone,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { BackgroundSelector } from '../components/BackgroundSelector';
import { AuthModal } from '../components/AuthModal';
import { PrivacyPolicyModal } from '../components/PrivacyPolicyModal';
import { ContactModal } from '../components/ContactModal';
import { UserRole } from '../types';

interface LandingPageProps {
  initialJoinCode?: string;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<UserRole>('teacher');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  // Quick Join Code state
  const [quickJoinCode, setQuickJoinCode] = useState('');
  const [joinValidationState, setJoinValidationState] = useState<{
    status: 'idle' | 'valid' | 'invalid';
    message?: string;
    className?: string;
    teacherName?: string;
  }>({ status: 'idle' });

  // Interactive Live Preview Simulator Tab
  const [simulatorMode, setSimulatorMode] = useState<'teacher' | 'student'>('teacher');
  const [simulatorSubTab, setSimulatorSubTab] = useState<'overview' | 'attendance' | 'assignments' | 'fees'>('overview');

  // Interactive Simulator Sample State
  const [sampleAttendance, setSampleAttendance] = useState([
    { id: '1', name: 'Aarav Sharma', status: 'present', rollNo: '101' },
    { id: '2', name: 'Diya Patel', status: 'present', rollNo: '102' },
    { id: '3', name: 'Rohan Gupta', status: 'late', rollNo: '103' },
    { id: '4', name: 'Ananya Roy', status: 'absent', rollNo: '104' },
  ]);

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const openAuth = (role: UserRole, mode: 'login' | 'register') => {
    setAuthRole(role);
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleQuickJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = quickJoinCode.trim().toUpperCase();
    if (!code) return;
    setAuthRole('student');
    setAuthMode('register');
    setAuthModalOpen(true);
  };

  const handleCodeChange = (val: string) => {
    const code = val.toUpperCase().slice(0, 8);
    setQuickJoinCode(code);
    if (code.length >= 6) {
      setJoinValidationState({
        status: 'valid',
        message: 'Valid Invitation Format',
        className: 'Physics Advanced Batch 2026',
        teacherName: 'Prof. Sharma',
      });
    } else if (code.length > 0) {
      setJoinValidationState({
        status: 'idle',
        message: `${6 - code.length} more characters needed`,
      });
    } else {
      setJoinValidationState({ status: 'idle' });
    }
  };

  const toggleAttendanceStatus = (id: string) => {
    setSampleAttendance((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextStatus = s.status === 'present' ? 'absent' : s.status === 'absent' ? 'late' : 'present';
        return { ...s, status: nextStatus };
      })
    );
  };

  const faqs = [
    {
      q: 'How does the multi-teacher system protect my students and classes?',
      a: 'TutorFlow uses strict Firebase Cloud Firestore security rules. Every class, student roster, fee invoice, and assignment is isolated to your private teacher ID. Teacher A can never see or access Teacher B’s data.',
    },
    {
      q: 'Can students access study materials without joining a class?',
      a: 'No. To ensure security, all study materials, homework, fee invoices, and attendance logs are strictly locked until a student enters their teacher’s private 6-digit class code and is approved by the teacher.',
    },
    {
      q: 'Can I generate official PDF receipts for tuition fee payments?',
      a: 'Yes. You can record payments (Cash, UPI, Bank Transfer) and generate printable PDF receipts with institute watermarks, invoice numbers, date stamps, and signature blocks.',
    },
    {
      q: 'Does TutorFlow work on mobile phones and offline?',
      a: 'Yes! TutorFlow is built as a Progressive Web App (PWA). You can install it on Android, iPhone (iOS), or desktop PC with full offline support for roll calls and lecture viewing.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white relative">
      {/* 1-Row Clean Top Navigation with Colorful Glow */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs relative">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 via-pink-500 via-amber-400 to-cyan-400" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <GraduationCap className="w-5 h-5 text-white drop-shadow-xs" />
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
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600">
            <a href="#simulator" className="hover:text-indigo-600 transition-colors">Interactive Demo</a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">Platform Features</a>
            <a href="#security" className="hover:text-indigo-600 transition-colors">Security & Privacy</a>
            <a href="#faqs" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <BackgroundSelector compact />
            <PWAInstallButton variant="nav" />
            <button
              onClick={() => openAuth('student', 'login')}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span className="hidden sm:inline">Student Portal</span>
              <span className="sm:hidden">Student</span>
            </button>
            <button
              onClick={() => openAuth('teacher', 'login')}
              className="px-3 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors hidden sm:inline-block cursor-pointer whitespace-nowrap"
            >
              Teacher Login
            </button>
            <button
              onClick={() => openAuth('teacher', 'register')}
              className="shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 min-h-[36px] rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center"
            >
              <span className="sm:hidden">Get Started</span>
              <span className="hidden sm:inline">Start Free</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
          {/* Colorful Ambient Glow Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-aura" />
          <div className="absolute top-1/3 left-10 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
          <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Zero-Pill Unboxed Text Metadata */}
            <div className="flex items-center justify-center gap-2 text-xs text-indigo-700 font-extrabold mb-5 tracking-wide flex-wrap">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Multi-Teacher Architecture
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Cloud Firestore Isolation</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-emerald-600">Offline PWA Supported</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] max-w-4xl mx-auto">
              Your Tuition Practice.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Organized In One Seamless Flow.
              </span>
            </h1>

            <p className="mt-5 text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
              Empowering tutors and coaching academies to run batches, record rapid attendance, issue homework with online grading, collect fees with official PDF receipts, and share notes with complete peace of mind.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xs sm:max-w-none mx-auto w-full">
              <button
                onClick={() => openAuth('teacher', 'register')}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-xs sm:text-base shadow-xl shadow-indigo-600/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Get Started — Create Account</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                onClick={() => openAuth('student', 'login')}
                className="w-full sm:w-auto px-5 sm:px-7 py-3 sm:py-3.5 rounded-2xl border border-slate-200/90 bg-white/95 hover:bg-white text-slate-800 font-extrabold text-xs sm:text-base shadow-sm backdrop-blur-md transition-all active:scale-95 cursor-pointer hover:border-indigo-200 hover:text-indigo-600 flex items-center justify-center"
              >
                Student Portal
              </button>
            </div>

            {/* Quick Student Join Box with Live Validation */}
            <div className="mt-10 max-w-lg mx-auto p-4 sm:p-5 rounded-3xl bg-white/95 shadow-2xl shadow-indigo-500/10 border border-white/80 backdrop-blur-2xl relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 -z-10 pointer-events-none" />
              
              <div className="text-left mb-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                  Have a Class Join Code?
                </span>
              </div>

              <form onSubmit={handleQuickJoinSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={quickJoinCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="Enter 6-digit Code (e.g. 8K9B2X)"
                    maxLength={8}
                    className="w-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-mono uppercase font-bold rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 shadow-inner tracking-widest text-center sm:text-left"
                  />
                  {quickJoinCode && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400">
                      {quickJoinCode.length}/6
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-black text-xs sm:text-sm whitespace-nowrap shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Join Class</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {joinValidationState.status === 'valid' ? (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-left flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-900">{joinValidationState.className}</p>
                      <p className="text-[11px] text-emerald-700">Instructor: {joinValidationState.teacherName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    Ready to Join
                  </span>
                </div>
              ) : (
                <p className="mt-2.5 text-[11px] font-medium text-slate-400 text-left">
                  Students: Enter the 6-character code provided by your teacher to pre-select your batch and sign up instantly.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Interactive Live Preview Simulator Section */}
        <section id="simulator" className="py-16 sm:py-20 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 inline-block">
                Live Interactive Simulator
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Experience the Interface in Real-Time
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                Click tabs and test roll call toggles to see how effortlessly TutorFlow handles classroom management.
              </p>
            </div>

            {/* Simulator Container */}
            <div className="rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl overflow-hidden">
              {/* Simulator Header Bar */}
              <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-mono text-slate-400 ml-2">app.tutorflow.live/preview</span>
                </div>

                {/* Role Switcher */}
                <div className="flex items-center p-1 bg-slate-800/90 rounded-xl border border-slate-700">
                  <button
                    onClick={() => setSimulatorMode('teacher')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      simulatorMode === 'teacher'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Educator Cockpit
                  </button>
                  <button
                    onClick={() => setSimulatorMode('student')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      simulatorMode === 'student'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Student Class View
                  </button>
                </div>
              </div>

              {/* Simulator Content Area */}
              <div className="p-5 sm:p-8 bg-slate-950 min-h-[380px]">
                {simulatorMode === 'teacher' ? (
                  <div>
                    {/* Simulator Navigation Tabs */}
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3 overflow-x-auto">
                      <button
                        onClick={() => setSimulatorSubTab('overview')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          simulatorSubTab === 'overview' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Today's Schedule & Stats
                      </button>
                      <button
                        onClick={() => setSimulatorSubTab('attendance')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          simulatorSubTab === 'attendance' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        1-Click Roll Call
                      </button>
                      <button
                        onClick={() => setSimulatorSubTab('assignments')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          simulatorSubTab === 'assignments' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Gradebook & Homework
                      </button>
                      <button
                        onClick={() => setSimulatorSubTab('fees')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          simulatorSubTab === 'fees' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Fee Ledger & Receipts
                      </button>
                    </div>

                    {/* SubTab 1: Overview */}
                    {simulatorSubTab === 'overview' && (
                      <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                            <span className="text-[11px] text-slate-400 font-medium">Active Students</span>
                            <p className="text-2xl font-black text-white font-mono tabular-nums mt-1">48</p>
                            <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">100% Verified</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                            <span className="text-[11px] text-slate-400 font-medium">Attendance Rate</span>
                            <p className="text-2xl font-black text-emerald-400 font-mono tabular-nums mt-1">94.2%</p>
                            <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">This Month</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                            <span className="text-[11px] text-slate-400 font-medium">Fee Collection</span>
                            <p className="text-2xl font-black text-cyan-400 font-mono tabular-nums mt-1">$4,850</p>
                            <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">92% Collected</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                            <span className="text-[11px] text-slate-400 font-medium">Active Batches</span>
                            <p className="text-2xl font-black text-purple-400 font-mono tabular-nums mt-1">4</p>
                            <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">Physics & Math</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-black">
                              PH
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">Physics Advanced Batch 2026</p>
                              <p className="text-[11px] text-slate-400">Next Lecture: Today @ 04:00 PM (Rotational Dynamics)</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                            Live in 45m
                          </span>
                        </div>
                      </div>
                    )}

                    {/* SubTab 2: Interactive Attendance */}
                    {simulatorSubTab === 'attendance' && (
                      <div className="space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Click any student status badge to toggle live roll call:</span>
                          <span className="font-mono text-cyan-400">Physics Batch Roster</span>
                        </div>

                        <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                          {sampleAttendance.map((student) => (
                            <div key={student.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-slate-500 w-8">{student.rollNo}</span>
                                <div>
                                  <p className="text-xs font-bold text-white">{student.name}</p>
                                  <p className="text-[10px] text-slate-400">Physics Advanced Batch</p>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleAttendanceStatus(student.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                  student.status === 'present'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : student.status === 'absent'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {student.status.toUpperCase()}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SubTab 3: Assignments */}
                    {simulatorSubTab === 'assignments' && (
                      <div className="space-y-4 animate-in fade-in">
                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white">Problem Set #4: Rotational Dynamics</span>
                            <span className="text-[11px] font-mono text-indigo-400">Max Marks: 50</span>
                          </div>
                          <p className="text-xs text-slate-400 mb-4">Complete problems 1 to 12 from Chapter 5. Upload clear step-by-step PDF solutions.</p>
                          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
                            <span>Submissions: <strong className="text-white font-mono">18 / 22</strong></span>
                            <span className="text-emerald-400 font-bold">4 Pending Review</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SubTab 4: Fees */}
                    {simulatorSubTab === 'fees' && (
                      <div className="space-y-4 animate-in fade-in">
                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-white">Aarav Sharma — Invoice #INV-2026-089</p>
                            <p className="text-[11px] text-slate-400">Tuition Fee: October 2026 · Paid via UPI ($150)</p>
                          </div>
                          <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                            PAID · RECEIPT ISSUED
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Student Mode Preview */
                  <div className="space-y-5 animate-in fade-in">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-black">
                          AS
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Aarav Sharma (Enrolled)</p>
                          <p className="text-[11px] text-slate-400">Physics Batch 2026 · Instructor: Prof. Sharma</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-mono font-bold">
                        Enrolled & Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-xs text-slate-400">My Attendance</span>
                        <p className="text-xl font-bold text-emerald-400 font-mono mt-1">96.0%</p>
                        <span className="text-[10px] text-slate-400">24 of 25 Lectures Attended</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-xs text-slate-400">Pending Homework</span>
                        <p className="text-xl font-bold text-amber-400 font-mono mt-1">1 Task</p>
                        <span className="text-[10px] text-slate-400">Due in 2 days</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-xs text-slate-400">Fee Balance</span>
                        <p className="text-xl font-bold text-cyan-400 font-mono mt-1">$0.00</p>
                        <span className="text-[10px] text-emerald-400">All Invoices Cleared</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features Section */}
        <section id="features" className="py-24 bg-white/80 backdrop-blur-xl border-y border-slate-200/80 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="px-3.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider border border-indigo-200/60 inline-block mb-3">
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
              <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group flex flex-col justify-between interactive-card">
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
              <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group flex flex-col justify-between interactive-card">
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
              <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 group flex flex-col justify-between interactive-card">
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
              <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 group flex flex-col justify-between interactive-card">
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
              <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group flex flex-col justify-between interactive-card">
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
              <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-rose-300 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 group flex flex-col justify-between interactive-card">
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

        {/* Security & Multi-Teacher Isolation Section */}
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

        {/* FAQs Accordion */}
        <section id="faqs" className="py-20 bg-slate-50 border-t border-slate-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider mb-2 inline-block">
                Clear Answers
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-slate-900 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        expandedFaq === idx ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>
                  {expandedFaq === idx && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
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
      <footer className="bg-white/95 backdrop-blur-xl border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
              TF
            </div>
            <span className="font-extrabold text-slate-900">TutorFlow</span>
            <span className="text-slate-400">— Multi-Teacher Tuition Management</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setPrivacyOpen(true)}
              className="hover:text-indigo-600 transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>·</span>
            <button
              onClick={() => setContactOpen(true)}
              className="hover:text-indigo-600 transition cursor-pointer"
            >
              Contact Support
            </button>
            <span>·</span>
            <span className="font-mono text-indigo-700">avharapal@gmail.com</span>
          </div>

          <p className="font-medium">© 2026 TutorFlow Platform. All rights reserved.</p>
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

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        onOpenContact={() => setContactOpen(true)}
      />

      {/* Contact Support Modal */}
      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
};
