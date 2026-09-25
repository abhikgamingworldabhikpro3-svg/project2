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

export const StudentPortal: React.FC<{ initialJoinCode?: string }> = ({
  initialJoinCode = '',
}) => {
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
  const [joinModalOpen, setJoinModalOpen] = useState(!!initialJoinCode);
  const [joinCodeInput, setJoinCodeInput] = useState(initialJoinCode);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

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

  // Join Class Handler
  const handleJoinClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !joinCodeInput.trim()) return;

    try {
      setIsJoining(true);
      setJoinError(null);
      const code = joinCodeInput.trim().toUpperCase();

      // Find class by join code
      const targetClass = classes.find((c) => c.joinCode === code);
      if (!targetClass) {
        throw new Error('Class not found. Please double-check your 6-digit join code.');
      }

      // Check if already enrolled
      const isAlreadyEnrolled = enrollments.some((en) => en.classId === targetClass.id);
      if (isAlreadyEnrolled) {
        throw new Error('You are already enrolled in this class.');
      }

      // Create enrollment in Firestore
      const newEnrollment = {
        teacherId: targetClass.teacherId,
        classId: targetClass.id,
        studentId: currentUser.uid,
        studentName: userProfile?.displayName || currentUser.displayName || 'Student',
        studentEmail: currentUser.email?.toLowerCase() || '',
        studentPhone: userProfile?.phone || '',
        status: 'active' as const,
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'enrollments'), newEnrollment);

      // Create notification for teacher
      try {
        await addDoc(collection(db, 'notifications'), {
          recipientId: targetClass.teacherId,
          senderId: currentUser.uid,
          title: 'New Student Joined!',
          message: `${newEnrollment.studentName} joined ${targetClass.name}.`,
          type: 'material',
          relatedId: targetClass.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Notification silent
      }

      setJoinModalOpen(false);
      setJoinCodeInput('');
    } catch (err: unknown) {
      const e = err as Error;
      setJoinError(e.message || 'Failed to join class.');
    } finally {
      setIsJoining(false);
    }
  };

  // Submit Homework
  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !submittingAssignment || !submissionText.trim()) return;

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
        submissionText: submissionText.trim(),
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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-700 font-semibold mb-1">
            <span>{userProfile?.displayName || currentUser?.displayName || 'Student'}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Enrolled Student Portal</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Private Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Student Learning Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Access your classes, check attendance, turn in homework, and review study materials.
          </p>
        </div>

        <button
          onClick={() => setJoinModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Join Class with Code</span>
        </button>
      </div>

      {/* Student 4 Metric Cards with Glassmorphism and Tabular Numerals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('classes')}
          className="p-5 rounded-2xl glass-card glass-card-hover cursor-pointer group"
        >
          <span className="text-xs font-semibold text-slate-500">My Classes</span>
          <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums font-mono">{myClasses.length}</div>
          <span className="text-[11px] text-slate-400">Enrolled batches</span>
        </div>

        <div
          onClick={() => setActiveTab('attendance')}
          className="p-5 rounded-2xl glass-card glass-card-hover cursor-pointer group"
        >
          <span className="text-xs font-semibold text-slate-500">Attendance</span>
          <div className="mt-2 text-2xl font-black text-emerald-600 tabular-nums font-mono">
            {myAttendancePercent !== null ? `${myAttendancePercent}%` : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-400">
            {myPresentCount} / {myTotalSessions} sessions attended
          </span>
        </div>

        <div
          onClick={() => setActiveTab('assignments')}
          className="p-5 rounded-2xl glass-card glass-card-hover cursor-pointer group"
        >
          <span className="text-xs font-semibold text-slate-500">Assignments</span>
          <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums font-mono">{myAssignments.length}</div>
          <span className="text-[11px] text-slate-400">
            {submissions.length} turned in ({submissions.filter((s) => s.status === 'graded').length}{' '}
            graded)
          </span>
        </div>

        <div
          onClick={() => setActiveTab('materials')}
          className="p-5 rounded-2xl glass-card glass-card-hover cursor-pointer group"
        >
          <span className="text-xs font-semibold text-slate-500">Study Materials</span>
          <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums font-mono">{myMaterials.length}</div>
          <span className="text-[11px] text-slate-400">Notes & diagrams</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto p-1 glass-card rounded-2xl shadow-xs gap-1">
        {(
          [
            { id: 'classes', label: 'My Classes', icon: School },
            { id: 'assignments', label: 'Assignments', icon: FileText },
            { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
            { id: 'materials', label: 'Study Materials', icon: BookOpen },
            { id: 'storage', label: 'Cloud Files', icon: HardDrive },
            { id: 'fees', label: 'Fees & Invoices', icon: CreditCard },
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
            { id: 'profile', label: 'My Profile', icon: User },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: My Classes */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          {myClasses.length === 0 ? (
            <EmptyState
              icon={School}
              title="You haven't joined any classes yet"
              description="Ask your teacher for a 6-digit class join code to access lectures and assignments."
              actionLabel="Join Class with Code"
              onAction={() => setJoinModalOpen(true)}
            />
          ) : (
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
                      f.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {f.status.replace('_', ' ')}
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

      {/* Join Class Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Join Tuition Class</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the 6-character code provided by your teacher.
            </p>

            <form onSubmit={handleJoinClassSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Join Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. 8K9B2X"
                  className="w-full px-3 py-2 text-center text-lg font-mono uppercase tracking-widest rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold"
                />
              </div>

              {joinError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {joinError}
                </div>
              )}

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining || !joinCodeInput.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition disabled:opacity-50"
                >
                  {isJoining ? 'Joining...' : 'Join Class'}
                </button>
              </div>
            </form>
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
                  Your Answer & Work *
                </label>
                <textarea
                  rows={5}
                  required
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Type your solution step-by-step or paste external document link..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attach Homework File / Photo / PDF (Optional)
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
