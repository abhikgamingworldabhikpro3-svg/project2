import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
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

  // Compute actual metrics from live Firestore documents
  const activeClassesCount = classes.filter((c) => c.status === 'active').length;
  const uniqueStudents = Array.from(new Set(enrollments.map((e) => e.studentEmail || e.studentId)));
  const totalStudentsCount = uniqueStudents.length;

  // Today's attendance calculation
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
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your tuition portal...</p>
        </div>
      </div>
    );
  }

  // Brand empty state for new teachers (Section 11 & 32)
  const isBrandNewTeacher = classes.length === 0 && enrollments.length === 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-700 font-semibold mb-1">
            <span>{teacherProfile?.instituteName || 'Tuition Academy'}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{teacherProfile?.academicYear || 'Session 2026-2027'}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Private Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Welcome back, {teacherProfile?.displayName || 'Educator'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Here is your live coaching overview, class attendance, and fee collections.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCreateClass}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Class</span>
          </button>
          <button
            onClick={onOpenInviteStudent}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200/90 bg-white/90 hover:bg-white text-slate-700 font-semibold text-xs sm:text-sm shadow-2xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Student</span>
          </button>
        </div>
      </div>

      {/* When brand new teacher, display prominent onboarding guidance */}
      {isBrandNewTeacher && (
        <EmptyState
          icon={School}
          title="No classes created yet"
          description="Create your first tuition class or batch to generate student invitation links and start tracking attendance and fees."
          actionLabel="Create First Class"
          onAction={onOpenCreateClass}
          secondaryActionLabel="Invite Student"
          onSecondaryAction={onOpenInviteStudent}
        />
      )}

      {/* 4 Metric Cards with Glassmorphism and Tabular Numerals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Students */}
        <div
          onClick={() => setActiveTab('students')}
          className="p-5 rounded-2xl glass-card glass-card-hover cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Students</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums font-mono">
              {totalStudentsCount}
            </span>
            <span className="text-xs text-slate-400">enrolled</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>{enrollments.length} total batch enrollments</span>
          </div>
        </div>

        {/* Card 2: Active Classes */}
        <div
          onClick={() => setActiveTab('classes')}
          className="p-5 rounded-2xl glass-card glass-card-hover cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Batches</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums font-mono">
              {activeClassesCount}
            </span>
            <span className="text-xs text-slate-400">classes</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>{classes.length} total classes created</span>
          </div>
        </div>

        {/* Card 3: Today's Attendance */}
        <div
          onClick={() => setActiveTab('attendance')}
          className="p-5 rounded-2xl glass-card glass-card-hover cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Attendance</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            {todayAttPercent !== null ? (
              <>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums font-mono">
                  {todayAttPercent}%
                </span>
                <span className="text-xs text-emerald-600 font-bold">Present</span>
              </>
            ) : (
              <span className="text-base sm:text-lg font-bold text-slate-400">Not Logged</span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>
              {todayAttRecords.length > 0
                ? `${todayAttRecords.length} sessions logged today`
                : 'Click to record roll call'}
            </span>
          </div>
        </div>

        {/* Card 4: Fee Collections */}
        <div
          onClick={() => setActiveTab('fees')}
          className="p-5 rounded-2xl glass-card glass-card-hover cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Collected</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums font-mono">
              {currency}{totalCollectedFees.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="tabular-nums font-mono">Due: {currency}{totalUnpaidFees.toLocaleString()}</span>
            {overdueFeesCount > 0 && (
              <span className="text-rose-600 font-bold">{overdueFeesCount} overdue</span>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section: Active Classes & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes Overview (2 cols) */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Your Active Batches</h3>
              <p className="text-xs text-slate-400">Class schedule and student enrollment roster</p>
            </div>
            <button
              onClick={() => setActiveTab('classes')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {classes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No classes registered yet. Click "Create Class" above to set up your first batch.
              </div>
            ) : (
              classes.slice(0, 4).map((c) => {
                const enrolledCount = enrollments.filter((e) => e.classId === c.id).length;
                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-white/60 hover:bg-white flex items-center justify-between gap-4 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {c.subject.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{c.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          {c.subject} {c.batchName ? `• ${c.batchName}` : ''}
                        </p>
                        {c.schedule && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{c.schedule}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800 tabular-nums font-mono">
                          {enrolledCount} / {c.maxStudents || 30}
                        </span>
                        <p className="text-[10px] text-slate-400">Enrolled</p>
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs font-bold">
                        {c.joinCode}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Pending Assignments & Announcements */}
        <div className="space-y-6">
          {/* Assignments Panel */}
          <div className="glass-card rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Active Assignments</h3>
              <button
                onClick={() => setActiveTab('assignments')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {assignments.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No assignments yet. Create homework to review student submissions.
                </div>
              ) : (
                assignments.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setActiveTab('assignments')}
                    className="p-2.5 rounded-xl border border-slate-100 bg-white/60 hover:bg-white transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{a.title}</h4>
                      <span className="text-[10px] font-mono tabular-nums text-indigo-700 font-bold shrink-0">
                        {a.maxMarks} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Due: {a.dueDate}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Announcements Bulletin */}
          <div className="glass-card rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Recent Broadcasts</h3>
              <button
                onClick={() => setActiveTab('announcements')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Post
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {announcements.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No broadcasts yet. Post announcements to notify enrolled students.
                </div>
              ) : (
                announcements.slice(0, 3).map((an) => (
                  <div key={an.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{an.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{an.message}</p>
                    <span className="text-[9px] text-slate-400 mt-1 block">
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
