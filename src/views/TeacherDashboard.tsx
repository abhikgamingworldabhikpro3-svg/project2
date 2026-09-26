import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  Megaphone,
  Plus,
  QrCode,
  School,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  Announcement,
  Assignment,
  AttendanceRecord,
  ClassItem,
  Enrollment,
  FeeRecord,
} from '../types';
import { EmptyState } from '../components/EmptyState';

interface TeacherDashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenCreateClass: () => void;
  onOpenInviteStudent: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  setActiveTab,
  onOpenCreateClass,
  onOpenInviteStudent,
}) => {
  const { currentUser, teacherProfile } = useAuth();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const currency = teacherProfile?.currency || '$';

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    // 1. Classes
    const qClasses = query(collection(db, 'classes'), where('teacherId', '==', uid));
    const unsubClasses = onSnapshot(
      qClasses,
      (snap) => {
        setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassItem)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'classes')
    );

    // 2. Enrollments (Students)
    const qEnroll = query(collection(db, 'enrollments'), where('teacherId', '==', uid));
    const unsubEnroll = onSnapshot(
      qEnroll,
      (snap) => {
        setEnrollments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enrollment)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'enrollments')
    );

    // 3. Assignments
    const qAssign = query(collection(db, 'assignments'), where('teacherId', '==', uid));
    const unsubAssign = onSnapshot(
      qAssign,
      (snap) => {
        setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'assignments')
    );

    // 4. Fees
    const qFees = query(collection(db, 'fees'), where('teacherId', '==', uid));
    const unsubFees = onSnapshot(
      qFees,
      (snap) => {
        setFees(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeeRecord)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'fees')
    );

    // 5. Attendance
    const qAtt = query(collection(db, 'attendance'), where('teacherId', '==', uid));
    const unsubAtt = onSnapshot(
      qAtt,
      (snap) => {
        setAttendance(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'attendance')
    );

    // 6. Announcements
    const qAnnounce = query(collection(db, 'announcements'), where('teacherId', '==', uid));
    const unsubAnnounce = onSnapshot(
      qAnnounce,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAnnouncements(items);
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'announcements')
    );

    return () => {
      unsubClasses();
      unsubEnroll();
      unsubAssign();
      unsubFees();
      unsubAtt();
      unsubAnnounce();
    };
  }, [currentUser]);

  // Copy code helper
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Color generator based on subject
  const getSubjectColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('math')) return { bg: 'bg-indigo-500/15', text: 'text-indigo-600', border: 'border-indigo-200/80', badge: 'bg-gradient-to-r from-indigo-500 to-violet-600' };
    if (s.includes('physic')) return { bg: 'bg-cyan-500/15', text: 'text-cyan-600', border: 'border-cyan-200/80', badge: 'bg-gradient-to-r from-cyan-500 to-blue-600' };
    if (s.includes('chem')) return { bg: 'bg-emerald-500/15', text: 'text-emerald-600', border: 'border-emerald-200/80', badge: 'bg-gradient-to-r from-emerald-500 to-teal-600' };
    if (s.includes('bio')) return { bg: 'bg-rose-500/15', text: 'text-rose-600', border: 'border-rose-200/80', badge: 'bg-gradient-to-r from-rose-500 to-pink-600' };
    if (s.includes('eng')) return { bg: 'bg-amber-500/15', text: 'text-amber-600', border: 'border-amber-200/80', badge: 'bg-gradient-to-r from-amber-500 to-orange-500' };
    if (s.includes('code') || s.includes('comput')) return { bg: 'bg-purple-500/15', text: 'text-purple-600', border: 'border-purple-200/80', badge: 'bg-gradient-to-r from-purple-500 to-fuchsia-600' };
    return { bg: 'bg-sky-500/15', text: 'text-sky-600', border: 'border-sky-200/80', badge: 'bg-gradient-to-r from-sky-500 to-indigo-600' };
  };

  // Compute metrics
  const activeClassesCount = classes.filter((c) => c.status === 'active').length;
  const uniqueStudents = Array.from(new Set(enrollments.map((e) => e.studentEmail || e.studentId)));
  const totalStudentsCount = uniqueStudents.length;

  // Attendance metrics
  const todayAttRecords = attendance.filter((a) => a.date === todayStr);
  let todayTotalPresent = 0;
  let todayTotalRecorded = 0;
  todayAttRecords.forEach((rec) => {
    todayTotalPresent += rec.totalPresent;
    todayTotalRecorded +=
      rec.totalPresent + rec.totalAbsent + rec.totalLate + rec.totalExcused;
  });
  const todayAttPercent =
    todayTotalRecorded > 0 ? Math.round((todayTotalPresent / todayTotalRecorded) * 100) : null;

  // Fee metrics
  const totalCollectedFees = fees.reduce((acc, f) => acc + (f.amountPaid || 0), 0);
  const totalUnpaidFees = fees.reduce((acc, f) => acc + (f.remainingAmount || 0), 0);
  const overdueFeesCount = fees.filter(
    (f) => f.status === 'overdue' || (f.status === 'pending' && f.dueDate < todayStr)
  ).length;

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg animate-pulse">
            <Sparkles className="w-5 h-5 animate-spin [animation-duration:8s]" />
          </div>
          <p className="text-xs text-slate-500 font-bold tracking-tight">Syncing Live Coaching Data...</p>
        </div>
      </div>
    );
  }

  const isBrandNewTeacher = classes.length === 0 && enrollments.length === 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Banner with Vibrant Glass Aesthetic */}
      <div className="relative overflow-hidden glass-card p-6 sm:p-7 rounded-3xl border border-white/60 shadow-lg shadow-indigo-500/5">
        {/* Colorful Ambient Mesh Glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-aura" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-56 h-56 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xs font-extrabold uppercase tracking-wider text-[10px]">
                {teacherProfile?.instituteName || 'Academy Hub'}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-medium">{teacherProfile?.academicYear || 'Session 2026-2027'}</span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Live Sync Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome back,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                {teacherProfile?.displayName || 'Educator'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Track real-time student engagement, class schedules, roll call registers, and fee receipts in one smooth flow.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenCreateClass}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Class</span>
            </button>
            <button
              onClick={onOpenInviteStudent}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/90 hover:bg-white text-slate-700 font-bold text-xs sm:text-sm border border-slate-200/80 shadow-xs hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Student</span>
            </button>
          </div>
        </div>
      </div>

      {/* Onboarding Guidance for Fresh Accounts */}
      {isBrandNewTeacher && (
        <EmptyState
          icon={School}
          title="Ready to launch your tuition classroom?"
          description="Create your first class to generate a unique 6-digit student join code. Students can enroll instantly and receive your study materials."
          actionLabel="Create First Class"
          onAction={onOpenCreateClass}
          secondaryActionLabel="Invite Student"
          onSecondaryAction={onOpenInviteStudent}
        />
      )}

      {/* 4 Vivid, Distinctive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Students */}
        <div
          onClick={() => setActiveTab('students')}
          className="relative overflow-hidden p-5 rounded-3xl glass-card glass-card-hover cursor-pointer group border border-white/80"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/15 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums font-mono">
              {totalStudentsCount}
            </span>
            <span className="text-xs font-semibold text-indigo-600">enrolled</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>{enrollments.length} total enrollments</span>
            <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </div>
        </div>

        {/* Card 2: Active Batches */}
        <div
          onClick={() => setActiveTab('classes')}
          className="relative overflow-hidden p-5 rounded-3xl glass-card glass-card-hover cursor-pointer group border border-white/80"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-500/15 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Batches</span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/25 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums font-mono">
              {activeClassesCount}
            </span>
            <span className="text-xs font-semibold text-sky-600">classes</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>{classes.length} registered batches</span>
            <span className="text-sky-600 font-bold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </div>
        </div>

        {/* Card 3: Today's Attendance */}
        <div
          onClick={() => setActiveTab('attendance')}
          className="relative overflow-hidden p-5 rounded-3xl glass-card glass-card-hover cursor-pointer group border border-white/80"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/15 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Attendance</span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            {todayAttPercent !== null ? (
              <>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums font-mono">
                  {todayAttPercent}%
                </span>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Present
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-slate-400">Not Logged</span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>{todayAttRecords.length > 0 ? `${todayAttRecords.length} sessions logged` : 'Take roll call'}</span>
            <span className="text-amber-600 font-bold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </div>
        </div>

        {/* Card 4: Fee Collections */}
        <div
          onClick={() => setActiveTab('fees')}
          className="relative overflow-hidden p-5 rounded-3xl glass-card glass-card-hover cursor-pointer group border border-white/80"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/15 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Collections</span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums font-mono">
              {currency}{totalCollectedFees.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="tabular-nums font-mono">Due: {currency}{totalUnpaidFees.toLocaleString()}</span>
            {overdueFeesCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 font-extrabold text-[10px]">
                {overdueFeesCount} overdue
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">&rarr;</span>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section: Active Classes & Right Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes Overview (2 cols) */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 shadow-xs border border-white/80">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Active Coaching Batches</h3>
              <p className="text-xs text-slate-400">Class schedule, student capacities, and 1-click join codes</p>
            </div>
            <button
              onClick={() => setActiveTab('classes')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All Batches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {classes.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No classes registered yet. Click &quot;Create Class&quot; above to set up your first batch.
              </div>
            ) : (
              classes.slice(0, 4).map((c) => {
                const enrolledCount = enrollments.filter((e) => e.classId === c.id).length;
                const colors = getSubjectColor(c.subject);
                const isCopied = copiedCode === c.joinCode;

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl border border-slate-100/90 bg-white/70 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-500/5 flex items-center justify-between gap-4 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl ${colors.badge} text-white font-black flex items-center justify-center text-xs shadow-md shadow-indigo-500/10 shrink-0`}>
                        {c.subject.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">{c.name}</h4>
                          {c.batchName && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              {c.batchName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{c.subject}</p>
                        {c.schedule && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{c.schedule}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs font-black text-slate-800 tabular-nums font-mono">
                          {enrolledCount} / {c.maxStudents || 30}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium">Students</p>
                      </div>

                      {/* Join Code with 1-click copy */}
                      <button
                        onClick={(e) => handleCopyCode(c.joinCode, e)}
                        title="Click to copy student join code"
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80'
                        }`}
                      >
                        <span>{c.joinCode}</span>
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-60" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Assignments & Announcements */}
        <div className="space-y-6">
          {/* Active Assignments Panel */}
          <div className="glass-card rounded-3xl p-5 shadow-xs border border-white/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Active Assignments</h3>
              </div>
              <button
                onClick={() => setActiveTab('assignments')}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {assignments.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No assignments yet. Create homework to review student submissions.
                </div>
              ) : (
                assignments.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setActiveTab('assignments')}
                    className="p-3 rounded-2xl border border-slate-100/90 bg-white/70 hover:bg-white hover:border-rose-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-rose-600 transition-colors">
                        {a.title}
                      </h4>
                      <span className="text-[10px] font-mono tabular-nums text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded-md shrink-0">
                        {a.maxMarks} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Due: {a.dueDate}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Announcements Bulletin */}
          <div className="glass-card rounded-3xl p-5 shadow-xs border border-white/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Megaphone className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Recent Broadcasts</h3>
              </div>
              <button
                onClick={() => setActiveTab('announcements')}
                className="text-xs font-bold text-orange-600 hover:text-orange-800 cursor-pointer"
              >
                Post
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {announcements.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No broadcasts yet. Post announcements to notify enrolled students.
                </div>
              ) : (
                announcements.slice(0, 3).map((an) => (
                  <div key={an.id} className="p-3 rounded-2xl bg-orange-50/50 border border-orange-100/80">
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{an.title}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 font-medium">{an.message}</p>
                    <span className="text-[9px] text-slate-400 mt-1.5 block font-mono">
                      {new Date(an.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
