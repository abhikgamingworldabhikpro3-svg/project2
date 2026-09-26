import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  GraduationCap,
  HardDrive,
  Megaphone,
  Plus,
  Printer,
  School,
  Send,
  Sparkles,
  UploadCloud,
  User,
  X,
} from 'lucide-react';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, uploadAndRegisterStorageFile } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  Announcement,
  Assignment,
  AttendanceRecord,
  ClassItem,
  Enrollment,
  FeeRecord,
  Payment,
  StudyMaterial,
  Submission,
  StorageFile,
} from '../types';
import { ReceiptModal } from '../components/ReceiptModal';
import { EmptyState } from '../components/EmptyState';

export const StudentPortal: React.FC = () => {
  const { currentUser, userProfile, updateStudentProfile } = useAuth();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    'classes' | 'assignments' | 'attendance' | 'materials' | 'storage' | 'fees' | 'announcements' | 'profile'
  >('classes');

  // Modals & Forms
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  // Submit Homework Modal
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // View Material Reader
  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);

  // Receipt Modal
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  // Student Profile fields
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [savedProfileSuccess, setSavedProfileSuccess] = useState(false);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = daysOfWeek[new Date().getDay()];
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<string>(currentDayName);

  const getDaysForClass = (scheduleStr: string) => {
    if (!scheduleStr) return [];
    const days: string[] = [];
    const s = scheduleStr.toLowerCase();
    if (s.includes('mon') || s.includes('mnd')) days.push('Monday');
    if (s.includes('tue') || s.includes('tus')) days.push('Tuesday');
    if (s.includes('wed') || s.includes('wdn')) days.push('Wednesday');
    if (s.includes('thu') || s.includes('thr')) days.push('Thursday');
    if (s.includes('fri')) days.push('Friday');
    if (s.includes('sat')) days.push('Saturday');
    if (s.includes('sun')) days.push('Sunday');
    return days;
  };

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const userEmail = currentUser.email?.toLowerCase() || '';

    // 1. Enrollments for this student (either by studentId == uid or studentEmail == email)
    const qEnroll = query(collection(db, 'enrollments'), where('studentEmail', '==', userEmail));
    const unsubEnroll = onSnapshot(
      qEnroll,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enrollment));
        setEnrollments(list);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'enrollments')
    );

    // 2. Classes
    const qClasses = query(collection(db, 'classes'));
    const unsubClasses = onSnapshot(
      qClasses,
      (snap) => {
        setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassItem)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'classes')
    );

    // 3. Assignments
    const qAssign = query(collection(db, 'assignments'));
    const unsubAssign = onSnapshot(
      qAssign,
      (snap) => {
        setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'assignments')
    );

    // 4. Submissions for this student
    const qSub = query(collection(db, 'submissions'), where('studentId', '==', uid));
    const unsubSub = onSnapshot(
      qSub,
      (snap) => {
        setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Submission)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'submissions')
    );

    // 5. Materials
    const qMat = query(collection(db, 'materials'));
    const unsubMat = onSnapshot(
      qMat,
      (snap) => {
        setMaterials(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudyMaterial)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'materials')
    );

    // 6. Attendance records
    const qAtt = query(collection(db, 'attendance'));
    const unsubAtt = onSnapshot(
      qAtt,
      (snap) => {
        setAttendance(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'attendance')
    );

    // 7. Fees
    const qFees = query(collection(db, 'fees'), where('studentId', '==', uid));
    const unsubFees = onSnapshot(
      qFees,
      (snap) => {
        setFees(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeeRecord)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'fees')
    );

    // 8. Payments
    const qPay = query(collection(db, 'payments'), where('studentId', '==', uid));
    const unsubPay = onSnapshot(
      qPay,
      (snap) => {
        setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'payments')
    );

    // 9. Announcements
    const qAnnounce = query(collection(db, 'announcements'));
    const unsubAnnounce = onSnapshot(
      qAnnounce,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAnnouncements(items);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'announcements')
    );

    // 10. Storage Files
    const qStorage = query(collection(db, 'storage_files'));
    const unsubStorage = onSnapshot(
      qStorage,
      (snap) => {
        setStorageFiles(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StorageFile)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'storage_files')
    );

    return () => {
      unsubEnroll();
      unsubClasses();
      unsubAssign();
      unsubSub();
      unsubMat();
      unsubAtt();
      unsubFees();
      unsubPay();
      unsubAnnounce();
      unsubStorage();
    };
  }, [currentUser]);

  // Enrolled class IDs
  const enrolledClassIds = new Set(enrollments.map((e) => e.classId));
  const myClasses = classes.filter((c) => enrolledClassIds.has(c.id));
  const myAssignments = assignments.filter((a) => enrolledClassIds.has(a.classId));
  const myMaterials = materials.filter((m) => enrolledClassIds.has(m.classId));
  const myStorageFiles = storageFiles.filter(
    (f) => f.classId === 'general' || (f.classId && enrolledClassIds.has(f.classId)) || f.uploaderId === currentUser?.uid
  );
  const myAnnouncements = announcements.filter(
    (a) => a.classId === 'all' || enrolledClassIds.has(a.classId)
  );

  // Student Attendance Summary
  let myPresentCount = 0;
  let myTotalSessions = 0;
  attendance.forEach((att) => {
    if (enrolledClassIds.has(att.classId) && att.records) {
      // Find by UID or student name/email
      for (const [stId, entry] of Object.entries(att.records)) {
        if (
          stId === currentUser?.uid ||
          enrollments.some((en) => en.studentId === stId)
        ) {
          myTotalSessions++;
          if (entry.status === 'present') myPresentCount++;
        }
      }
    }
  });
  const myAttendancePercent =
    myTotalSessions > 0 ? Math.round((myPresentCount / myTotalSessions) * 100) : null;

  // Direct Class Enrollment Toggle Handler (replaces invitation codes)
  const toggleEnrollment = async (classItem: ClassItem) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const userEmail = currentUser.email?.toLowerCase() || '';

    // Check if enrolled
    const enrollment = enrollments.find((en) => en.classId === classItem.id);

    try {
      const { collection, addDoc, doc, deleteDoc } = await import('firebase/firestore');
      
      if (enrollment) {
        // Leave Class: Delete enrollment from Firestore
        await deleteDoc(doc(db, 'enrollments', enrollment.id));

        // Create teacher notification about student leaving
        try {
          await addDoc(collection(db, 'notifications'), {
            recipientId: classItem.teacherId,
            senderId: uid,
            title: 'Student Unenrolled',
            message: `${userProfile?.displayName || currentUser.displayName || 'A student'} left ${classItem.name}.`,
            type: 'material',
            relatedId: classItem.id,
            read: false,
            createdAt: new Date().toISOString(),
          });
        } catch {}
      } else {
        // Join Class: Add enrollment
        const newEnrollment = {
          teacherId: classItem.teacherId,
          classId: classItem.id,
          studentId: uid,
          studentName: userProfile?.displayName || currentUser.displayName || 'Student',
          studentEmail: userEmail,
          studentPhone: userProfile?.phone || '',
          gender: userProfile?.gender || 'Male',
          status: 'active' as const,
          joinedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'enrollments'), newEnrollment);

        // Create teacher notification about student joining
        try {
          await addDoc(collection(db, 'notifications'), {
            recipientId: classItem.teacherId,
            senderId: uid,
            title: 'Student Enrolled',
            message: `${newEnrollment.studentName} joined ${classItem.name} directly from Dashboard.`,
            type: 'material',
            relatedId: classItem.id,
            read: false,
            createdAt: new Date().toISOString(),
          });
        } catch {}
      }
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.UPDATE, 'enrollments');
    }
  };

  // Submit Homework
  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !submittingAssignment) return;
    if (!submissionText.trim() && !submissionFile) return;

    try {
      setIsSubmittingTask(true);
      const submissionId = `${submittingAssignment.id}_${currentUser.uid}`;

      let attachments: { name: string; url: string }[] = [];
      if (submissionFile) {
        const stored = await uploadAndRegisterStorageFile(
          submissionFile,
          submittingAssignment.teacherId,
          'submission',
          submittingAssignment.classId
        );
        attachments.push({
          name: submissionFile.name,
          url: stored.downloadURL,
        });
      }

      const newSubmission = {
        id: submissionId,
        assignmentId: submittingAssignment.id,
        classId: submittingAssignment.classId,
        teacherId: submittingAssignment.teacherId,
        studentId: currentUser.uid,
        studentName: userProfile?.displayName || currentUser.displayName || 'Student',
        studentEmail: currentUser.email?.toLowerCase() || '',
        submissionText: submissionText.trim() || (submissionFile ? `[Attached file: ${submissionFile.name}]` : ''),
        attachments,
        status: 'submitted' as const,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'submissions', submissionId), newSubmission);

      // Teacher notification
      try {
        await addDoc(collection(db, 'notifications'), {
          recipientId: submittingAssignment.teacherId,
          senderId: currentUser.uid,
          title: 'Assignment Submitted!',
          message: `${newSubmission.studentName} turned in ${submittingAssignment.title}.`,
          type: 'assignment',
          relatedId: submittingAssignment.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Silent notification
      }

      setSubmittingAssignment(null);
      setSubmissionText('');
      setSubmissionFile(null);
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.WRITE, `submissions/${submittingAssignment.id}`);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Update Student Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStudentProfile({ phone: phone.trim() });
      setSavedProfileSuccess(true);
      setTimeout(() => setSavedProfileSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Colorful Mesh Glow */}
      <div className="relative overflow-hidden glass-card p-6 sm:p-7 rounded-3xl border border-white/70 shadow-lg shadow-indigo-500/5">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-60 h-60 bg-gradient-to-br from-indigo-500/15 via-purple-500/15 to-pink-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-aura" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold uppercase tracking-wider text-[10px] shadow-2xs">
                {userProfile?.displayName || currentUser?.displayName || 'Student'}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-medium">Student Learning Hub</span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Enrolled
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Student Learning Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl font-medium">
              Access your batches, verify class attendance, submit assignments, and study course materials.
            </p>
          </div>

          <button
            onClick={() => setJoinModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all duration-200 active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Join Class with Code</span>
          </button>
        </div>
      </div>

      {/* Student 4 Metric Cards with Colorful Accent Halos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Classes */}
        <div
          onClick={() => setActiveTab('classes')}
          className="relative overflow-hidden p-5 rounded-3xl glass-card glass-card-hover cursor-pointer group border border-white/80"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-500/15 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Classes</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tabular-nums font-mono">{myClasses.length}</div>
          <span className="text-[11px] font-medium text-slate-400">Enrolled batches</span>
        </div>

        {/* Card 2: Attendance */}
        <div
          onClick={() => setActiveTab('attendance')}
          className="relative overflow-hidden p-5 rounded-3xl glass-card glass-card-hover cursor-pointer group border border-white/80"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500/15 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 tabular-nums font-mono">
            {myAttendancePercent !== null ? `${myAttendancePercent}%` : 'N/A'}
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            {myPresentCount} / {myTotalSessions} sessions attended
          </span>
        </div>

        {/* Card 3: Assignments */}
        <div
          onClick={() => setActiveTab('assignments')}
          className="relative overflow-hidden p-5 rounded-3xl glass-card glass-card-hover cursor-pointer group border border-white/80"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-rose-500/15 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assignments</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tabular-nums font-mono">{myAssignments.length}</div>
          <span className="text-[11px] font-medium text-slate-400">
            {submissions.length} submitted ({submissions.filter((s) => s.status === 'graded').length} graded)
          </span>
        </div>

        {/* Card 4: Study Materials */}
        <div
          onClick={() => setActiveTab('materials')}
          className="relative overflow-hidden p-5 rounded-3xl glass-card glass-card-hover cursor-pointer group border border-white/80"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/15 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Study Notes</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tabular-nums font-mono">{myMaterials.length}</div>
          <span className="text-[11px] font-medium text-slate-400">Notes & diagrams</span>
        </div>
      </div>

      {/* Navigation Tabs with Vibrant Active States */}
      <div className="flex overflow-x-auto p-1.5 glass-card rounded-2xl shadow-xs gap-1.5 border border-white/80">
        {(
          [
            { id: 'classes', label: 'My Classes', icon: School, activeGrad: 'bg-gradient-to-r from-sky-500 to-blue-600' },
            { id: 'assignments', label: 'Assignments', icon: FileText, activeGrad: 'bg-gradient-to-r from-rose-500 to-pink-600' },
            { id: 'attendance', label: 'Attendance', icon: CalendarCheck, activeGrad: 'bg-gradient-to-r from-amber-500 to-orange-500' },
            { id: 'materials', label: 'Study Materials', icon: BookOpen, activeGrad: 'bg-gradient-to-r from-purple-600 to-pink-600' },
            { id: 'storage', label: 'Cloud Files', icon: HardDrive, activeGrad: 'bg-gradient-to-r from-cyan-500 to-blue-600' },
            { id: 'fees', label: 'Fees & Invoices', icon: CreditCard, activeGrad: 'bg-gradient-to-r from-emerald-600 to-teal-600' },
            { id: 'announcements', label: 'Announcements', icon: Megaphone, activeGrad: 'bg-gradient-to-r from-orange-500 to-rose-500' },
            { id: 'profile', label: 'My Profile', icon: User, activeGrad: 'bg-gradient-to-r from-slate-700 to-slate-900' },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? `${t.activeGrad} text-white shadow-md shadow-indigo-500/20`
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div key={activeTab} className="smooth-tab-entry">
        {/* Tab Content 1: My Classes */}
        {activeTab === 'classes' && (
        <div className="space-y-4">
          {myClasses.length === 0 ? (
            <EmptyState
              icon={School}
              title="You haven't joined any classes yet"
              description="Browse our Academy Class Directory to enroll in your active tuition batches and courses."
              actionLabel="Browse Academy Directory"
              onAction={() => setJoinModalOpen(true)}
            />
          ) : (
            <div className="space-y-6">
              {/* Visual Weekly Class Timetable Slot Component */}
              <div className="glass-card rounded-3xl p-6 shadow-md border border-white/80 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <CalendarCheck className="w-5 h-5 text-indigo-600" />
                      <span>My Weekly Lecture Schedule</span>
                    </h3>
                    <p className="text-xs text-slate-400">View your active coaching lectures mapped by day of week</p>
                  </div>
                  <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 uppercase tracking-wider">
                    Today: {currentDayName}
                  </span>
                </div>

                {/* Day Tabs */}
                <div className="mt-4 flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Flexible'].map((day) => {
                    const count = myClasses.filter((c) => {
                      const days = getDaysForClass(c.schedule || '');
                      return day === 'Flexible' ? days.length === 0 : days.includes(day);
                    }).length;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedTimetableDay(day)}
                        className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 min-w-[80px] ${
                          selectedTimetableDay === day
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                        }`}
                      >
                        <span>{day.slice(0, 3)}</span>
                        {count > 0 && (
                          <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                            selectedTimetableDay === day ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Day Classes */}
                <div className="mt-5">
                  {myClasses.filter((c) => {
                    const days = getDaysForClass(c.schedule || '');
                    return selectedTimetableDay === 'Flexible' ? days.length === 0 : days.includes(selectedTimetableDay);
                  }).length === 0 ? (
                    <div className="py-8 text-center bg-slate-50/50 border border-dashed border-slate-200/80 rounded-2xl">
                      <p className="text-xs text-slate-400 font-semibold">No lectures scheduled for {selectedTimetableDay}.</p>
                      {selectedTimetableDay !== 'Flexible' && (
                        <p className="text-[10px] text-slate-400 mt-0.5">Perfect time to catch up on assignment homework!</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myClasses
                        .filter((c) => {
                          const days = getDaysForClass(c.schedule || '');
                          return selectedTimetableDay === 'Flexible' ? days.length === 0 : days.includes(selectedTimetableDay);
                        })
                        .map((c) => {
                          const s = c.subject.toLowerCase();
                          let colorClass = 'border-indigo-100 bg-indigo-50/20 text-indigo-700';
                          if (s.includes('math')) colorClass = 'border-indigo-100 bg-indigo-50/30 text-indigo-700';
                          else if (s.includes('physic')) colorClass = 'border-cyan-100 bg-cyan-50/30 text-cyan-700';
                          else if (s.includes('chem')) colorClass = 'border-emerald-100 bg-emerald-50/30 text-emerald-700';
                          else if (s.includes('bio')) colorClass = 'border-rose-100 bg-rose-50/30 text-rose-700';
                          else if (s.includes('eng')) colorClass = 'border-amber-100 bg-amber-50/30 text-amber-700';

                          return (
                            <div
                              key={c.id}
                              className={`p-4 rounded-2xl border-2 ${colorClass} transition-all hover:-translate-y-0.5 hover:shadow-xs flex flex-col justify-between`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-white/80 border border-slate-100">
                                    {c.subject}
                                  </span>
                                  {c.batchName && (
                                    <span className="text-[10px] text-slate-500 font-bold">{c.batchName}</span>
                                  )}
                                </div>
                                <h4 className="font-black text-slate-900 text-sm mt-2">{c.name}</h4>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="truncate max-w-[150px]">{c.schedule}</span>
                                </div>
                                <button
                                  onClick={() => setActiveTab('materials')}
                                  className="text-[11px] font-extrabold text-indigo-600 hover:underline"
                                >
                                  Study Materials &rarr;
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* All Enrolled Classes Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-950 text-base">All Enrolled Batches</h3>
                  <button
                    onClick={() => setJoinModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/10 transition active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manage / Change Classes</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {myClasses.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-200 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase">
                      {c.subject}
                    </span>
                    {c.batchName && (
                      <span className="text-xs text-slate-500 font-medium">• {c.batchName}</span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base mt-2">{c.name}</h3>
                  {c.schedule && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.schedule}</span>
                    </div>
                  )}
                  {c.description && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">{c.description}</p>
                  )}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Enrolled</span>
                    <button
                      onClick={() => setActiveTab('materials')}
                      className="font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      View Notes &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )}

      {/* Tab Content 2: Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {myAssignments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No assignments posted yet"
              description="When your teacher assigns homework or practice problem sets, they will appear here."
            />
          ) : (
            <div className="space-y-3">
              {myAssignments.map((a) => {
                const sub = submissions.find((s) => s.assignmentId === a.id);
                const c = classes.find((cl) => cl.id === a.classId);

                return (
                  <div
                    key={a.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase">
                          {a.subject}
                        </span>
                        <span className="text-xs text-slate-500">{c?.name}</span>
                        <span className="text-xs font-semibold text-slate-700">
                          • Due: {a.dueDate}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-1.5">{a.title}</h3>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{a.description}</p>
                      {sub?.feedback && (
                        <p className="mt-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                          Teacher Feedback: "{sub.feedback}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {sub ? (
                        <div className="text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              sub.status === 'graded'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {sub.status === 'graded'
                              ? `${sub.marksObtained} / ${a.maxMarks} Marks`
                              : 'Submitted'}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Turned in: {new Date(sub.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSubmittingAssignment(a);
                            setSubmissionText('');
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          Submit Homework
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Attendance Summary</h3>
              <p className="text-xs text-slate-400">Class presence recorded by your teachers</p>
            </div>
            <span className="text-xl font-black text-emerald-600">
              {myAttendancePercent !== null ? `${myAttendancePercent}% Present` : 'No logs yet'}
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {attendance.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No attendance logs found for your classes.
              </div>
            ) : (
              attendance.map((att) => {
                const c = classes.find((cl) => cl.id === att.classId);
                // Check student presence
                const entry =
                  att.records &&
                  (att.records[currentUser?.uid || ''] ||
                    Object.values(att.records).find(
                      (r) => r.studentName === userProfile?.displayName
                    ));

                if (!entry) return null;

                return (
                  <div key={att.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{c?.name || 'Class'}</span>
                      <span className="text-[11px] text-slate-400">
                        {att.date} • {att.session}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        entry.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : entry.status === 'absent'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab Content 4: Study Materials */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {myMaterials.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No study materials available"
              description="Your teacher has not uploaded any study notes or references yet."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myMaterials.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setViewingMaterial(m)}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-200 hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase">
                      {m.subject}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">• {m.type}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mt-2 line-clamp-1">{m.title}</h3>
                  {m.chapter && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {m.chapter} {m.topic ? `— ${m.topic}` : ''}
                    </p>
                  )}
                  {m.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-2">{m.description}</p>
                  )}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-semibold text-indigo-600 flex items-center gap-1">
                      Open Resource &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Firebase Storage Cloud Files */}
      {activeTab === 'storage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Class Cloud Files & Attachments</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Download lecture handouts, syllabus sheets, and assignment resources from Firebase Storage.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              {myStorageFiles.length} files
            </span>
          </div>

          {myStorageFiles.length === 0 ? (
            <EmptyState
              icon={HardDrive}
              title="No cloud storage files available"
              description="Your educators have not attached any cloud files to your enrolled classes yet."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myStorageFiles.map((file) => {
                const classObj = classes.find((c) => c.id === file.classId);
                const formatBytes = (bytes: number) => {
                  if (!bytes) return '0 B';
                  const k = 1024;
                  const sizes = ['B', 'KB', 'MB', 'GB'];
                  const i = Math.floor(Math.log(bytes) / Math.log(k));
                  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                };

                return (
                  <div
                    key={file.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-200 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                          {file.category.replace('_', ' ')}
                        </span>
                        {classObj && (
                          <span className="text-[10px] font-medium text-slate-500">
                            {classObj.name}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm line-clamp-2" title={file.name}>
                        {file.name}
                      </h4>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2 font-mono">
                        <span>{formatBytes(file.size)}</span>
                        <span>·</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={file.downloadURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </a>
                      <a
                        href={file.downloadURL}
                        download={file.name}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 5: Fees & Receipts */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Tuition Invoices & Receipts</h3>
            <span className="text-xs text-slate-400">{fees.length} billing items</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {fees.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No fee invoices currently assigned to your student account.
              </div>
            ) : (
              fees.map((f) => (
                <div key={f.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{f.title}</span>
                    <span className="text-[11px] text-slate-500">
                      Total Payable: ${f.totalPayable} • Remaining: ${f.remainingAmount} • Due:{' '}
                      {f.dueDate}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      f.remainingAmount === 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {f.remainingAmount === 0 ? 'Paid' : 'Due'}
                  </span>
                </div>
              ))
            )}
          </div>

          {payments.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs mb-3">Download Payment Receipts</h4>
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-indigo-600 block">
                        {p.receiptNumber}
                      </span>
                      <span className="text-slate-500">
                        ${p.amount} paid on {p.paymentDate} ({p.method})
                      </span>
                    </div>
                    <button
                      onClick={() => setReceiptPayment(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Receipt</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 6: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-3">
          {myAnnouncements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No announcements"
              description="Teacher announcements will appear here."
            />
          ) : (
            myAnnouncements.map((a) => (
              <div
                key={a.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                    Notice
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-2">{a.title}</h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {a.message}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content 7: Student Profile Settings */}
      {activeTab === 'profile' && (
        <div className="max-w-xl bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">
            Student Profile Information
          </h3>
          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
              <input
                type="text"
                disabled
                value={userProfile?.displayName || ''}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div className="pt-2 flex items-center justify-between">
              {savedProfileSuccess && (
                <span className="text-xs text-emerald-600 font-bold">Profile updated!</span>
              )}
              <button
                type="submit"
                className="ml-auto px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}
      </div>

      {/* Manage Class Enrollments Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">Academy Class Directory</h3>
                <p className="text-xs text-slate-400">Enroll in batches or update your registered classes</p>
              </div>
              <button
                onClick={() => setJoinModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 overflow-y-auto space-y-3.5 pr-1 flex-1 py-1">
              {classes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active coaching classes registered in the academy yet.
                </div>
              ) : (
                classes.map((c) => {
                  const isEnrolled = enrolledClassIds.has(c.id);
                  const colors = c.subject.toLowerCase().includes('math') ? 'from-indigo-500 to-violet-600' :
                                 c.subject.toLowerCase().includes('physic') ? 'from-cyan-500 to-blue-600' :
                                 c.subject.toLowerCase().includes('chem') ? 'from-emerald-500 to-teal-600' :
                                 c.subject.toLowerCase().includes('bio') ? 'from-rose-500 to-pink-600' :
                                 c.subject.toLowerCase().includes('eng') ? 'from-amber-500 to-orange-500' :
                                 'from-purple-500 to-indigo-600';

                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm hover:border-indigo-100 transition-all duration-150 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-white font-extrabold text-[9px] uppercase bg-gradient-to-r ${colors}`}>
                            {c.subject}
                          </span>
                          {c.batchName && (
                            <span className="text-[10px] text-slate-400 font-bold">• {c.batchName}</span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-1">{c.name}</h4>
                        {c.schedule && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{c.schedule}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => toggleEnrollment(c)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer whitespace-nowrap ${
                          isEnrolled
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                        }`}
                      >
                        {isEnrolled ? 'Leave Class' : 'Enroll Now'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Homework Submission Modal */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Submit Homework: {submittingAssignment.title}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your solution, calculations, or link to your work.
            </p>

            <form onSubmit={handleSubmitHomework} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Answer & Work
                  <span className="text-[11px] font-normal text-slate-400 ml-1.5">
                    {submissionFile ? '(Optional when file is attached)' : '(Required)'}
                  </span>
                </label>
                <textarea
                  rows={4}
                  required={!submissionFile}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder={
                    submissionFile
                      ? "Optional: Add any comments, working notes, or steps for your teacher..."
                      : "Type your solution step-by-step or paste external document link..."
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attach Homework File / Photo / PDF
                  <span className="text-[11px] font-normal text-slate-400 ml-1.5">(Optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 cursor-pointer font-semibold transition">
                    <UploadCloud className="w-4 h-4 text-indigo-600" />
                    <span className="truncate max-w-[240px]">
                      {submissionFile ? submissionFile.name : 'Choose File to Upload to Storage'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSubmissionFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  {submissionFile && (
                    <button
                      type="button"
                      onClick={() => setSubmissionFile(null)}
                      className="text-xs text-rose-500 hover:underline font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Direct upload to Firebase Storage bucket. Your teacher will be able to review and grade it.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask || !submissionText.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition disabled:opacity-50"
                >
                  {isSubmittingTask ? 'Submitting...' : 'Turn In Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Material Reader */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setViewingMaterial(null)}
          />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl p-6 flex flex-col z-10 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">{viewingMaterial.title}</h3>
              <button
                onClick={() => setViewingMaterial(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 flex-1 text-xs">
              {viewingMaterial.type === 'image' && viewingMaterial.linkUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                  <img
                    src={viewingMaterial.linkUrl}
                    alt={viewingMaterial.title}
                    className="w-full object-contain max-h-[400px]"
                  />
                </div>
              )}

              {viewingMaterial.content && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 font-mono whitespace-pre-wrap leading-relaxed text-sm text-slate-800">
                  {viewingMaterial.content}
                </div>
              )}

              {viewingMaterial.linkUrl && viewingMaterial.type !== 'image' && (
                <a
                  href={viewingMaterial.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                >
                  <span>Open Resource Link</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptPayment && (
        <ReceiptModal payment={receiptPayment} onClose={() => setReceiptPayment(null)} />
      )}
    </div>
  );
};
