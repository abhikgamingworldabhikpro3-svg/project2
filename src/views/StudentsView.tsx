import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Copy,
  CreditCard,
  Edit2,
  FileText,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ClassItem, Enrollment, FeeRecord, Submission, AttendanceRecord } from '../types';
import { EmptyState } from '../components/EmptyState';

export const StudentsView: React.FC<{ initialInviteOpen?: boolean }> = ({
  initialInviteOpen = false,
}) => {
  const { currentUser, teacherProfile } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialInviteOpen);
  const [selectedStudent, setSelectedStudent] = useState<Enrollment | null>(null);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);

  // Form Fields
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [classId, setClassId] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    const unsubClasses = onSnapshot(
      query(collection(db, 'classes'), where('teacherId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassItem));
        setClasses(list);
        if (list.length > 0 && !classId) {
          setClassId(list[0].id);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'classes')
    );

    const unsubEnroll = onSnapshot(
      query(collection(db, 'enrollments'), where('teacherId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enrollment));
        list.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
        setEnrollments(list);
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'enrollments')
    );

    const unsubFees = onSnapshot(
      query(collection(db, 'fees'), where('teacherId', '==', uid)),
      (snap) => {
        setFees(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeeRecord)));
      }
    );

    const unsubAtt = onSnapshot(
      query(collection(db, 'attendance'), where('teacherId', '==', uid)),
      (snap) => {
        setAttendance(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord)));
      }
    );

    const unsubSub = onSnapshot(
      query(collection(db, 'submissions'), where('teacherId', '==', uid)),
      (snap) => {
        setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Submission)));
      }
    );

    return () => {
      unsubClasses();
      unsubEnroll();
      unsubFees();
      unsubAtt();
      unsubSub();
    };
  }, [currentUser]);

  const handleOpenAdd = () => {
    setEditingEnrollment(null);
    setStudentName('');
    setStudentEmail('');
    setStudentPhone('');
    setGuardianName('');
    setGuardianPhone('');
    setAddress('');
    setDateOfBirth('');
    setNotes('');
    if (classes.length > 0) setClassId(classes[0].id);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (enr: Enrollment) => {
    setEditingEnrollment(enr);
    setStudentName(enr.studentName);
    setStudentEmail(enr.studentEmail);
    setStudentPhone(enr.studentPhone || '');
    setClassId(enr.classId);
    setGuardianName(enr.guardianName || '');
    setGuardianPhone(enr.guardianPhone || '');
    setAddress(enr.address || '');
    setDateOfBirth(enr.dateOfBirth || '');
    setNotes(enr.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !studentName.trim() || !studentEmail.trim() || !classId) return;

    try {
      setIsSubmitting(true);
      if (editingEnrollment) {
        const ref = doc(db, 'enrollments', editingEnrollment.id);
        await updateDoc(ref, {
          studentName: studentName.trim(),
          studentEmail: studentEmail.trim().toLowerCase(),
          studentPhone: studentPhone.trim(),
          classId,
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          address: address.trim(),
          dateOfBirth,
          notes: notes.trim(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        const newEnrollment = {
          teacherId: currentUser.uid,
          classId,
          studentId: `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          studentName: studentName.trim(),
          studentEmail: studentEmail.trim().toLowerCase(),
          studentPhone: studentPhone.trim(),
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          address: address.trim(),
          dateOfBirth,
          status: 'active' as const,
          joinedAt: new Date().toISOString(),
          notes: notes.trim(),
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'enrollments'), newEnrollment);
      }
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      handleFirestoreError(
        err,
        editingEnrollment ? OperationType.UPDATE : OperationType.CREATE,
        'enrollments'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEnrollment = async (enr: Enrollment) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${enr.studentName} from this class?`
      )
    ) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'enrollments', enr.id));
      if (selectedStudent?.id === enr.id) setSelectedStudent(null);
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.DELETE, `enrollments/${enr.id}`);
    }
  };

  // Filter list
  const filtered = enrollments.filter((e) => {
    const matchesClass = selectedClassFilter === 'all' || e.classId === selectedClassFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      e.studentName.toLowerCase().includes(term) ||
      e.studentEmail.toLowerCase().includes(term) ||
      (e.studentPhone && e.studentPhone.includes(term)) ||
      (e.guardianName && e.guardianName.toLowerCase().includes(term));
    return matchesClass && matchesSearch;
  });

  // Calculate stats for student drawer
  const getStudentStats = (student: Enrollment) => {
    // Attendance
    let presentCount = 0;
    let totalSessions = 0;
    attendance.forEach((att) => {
      if (att.classId === student.classId && att.records && att.records[student.studentId]) {
        totalSessions++;
        if (att.records[student.studentId].status === 'present') {
          presentCount++;
        }
      }
    });
    const attPercent = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : null;

    // Fees
    const studentFees = fees.filter(
      (f) => f.studentId === student.studentId || f.studentName === student.studentName
    );
    const totalDue = studentFees.reduce((acc, f) => acc + (f.remainingAmount || 0), 0);
    const totalPaid = studentFees.reduce((acc, f) => acc + (f.amountPaid || 0), 0);

    // Submissions
    const studentSubmissions = submissions.filter(
      (s) => s.studentId === student.studentId || s.studentEmail === student.studentEmail
    );

    return { attPercent, totalSessions, totalDue, totalPaid, submissionsCount: studentSubmissions.length };
  };

  const selectedClass = classes.find((c) => c.id === (selectedStudent ? selectedStudent.classId : classId));
  const generalJoinLink = selectedClass
    ? `${window.location.origin}?join=${selectedClass.joinCode}`
    : window.location.origin;

  const handleCopyGeneralLink = () => {
    navigator.clipboard.writeText(generalJoinLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Student Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Directory of enrolled students across your tuition classes and batches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyGeneralLink}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/60 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Search and Class Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Filter Class:</span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-700 w-full sm:w-48"
          >
            <option value="all">All Classes ({enrollments.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Roster Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading student roster...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchTerm ? 'No students found matching your search' : 'No students enrolled yet'}
          description={
            searchTerm
              ? 'Try searching with a different name, email, or clear the class filter.'
              : 'Add students manually or share your class join code for students to enroll.'
          }
          actionLabel={!searchTerm ? 'Add Student' : undefined}
          onAction={!searchTerm ? handleOpenAdd : undefined}
          secondaryActionLabel={!searchTerm && classes.length > 0 ? 'Copy Invite Link' : undefined}
          onSecondaryAction={!searchTerm && classes.length > 0 ? handleCopyGeneralLink : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Class & Batch</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Guardian</th>
                  <th className="py-3.5 px-4">Enrolled Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((enr) => {
                  const c = classes.find((cl) => cl.id === enr.classId);
                  return (
                    <tr
                      key={enr.id}
                      className="hover:bg-indigo-50/20 transition-colors cursor-pointer group"
                      onClick={() => setSelectedStudent(enr)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {enr.studentName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-indigo-600 transition">
                              {enr.studentName}
                            </span>
                            <span className="text-[11px] text-slate-400">{enr.studentEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {c?.name || 'Class'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {c?.subject} {c?.batchName ? `• ${c.batchName}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-600">{enr.studentPhone || '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 block">
                          {enr.guardianName || '—'}
                        </span>
                        {enr.guardianPhone && (
                          <span className="text-[11px] text-slate-400">{enr.guardianPhone}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(enr.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(enr)}
                            title="Edit student"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEnrollment(enr)}
                            title="Remove student"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Profile Detail Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setSelectedStudent(null)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col z-10 overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Student Profile
              </span>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Avatar & Primary Info */}
            <div className="py-5 text-center border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md">
                {selectedStudent.studentName.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2.5">
                {selectedStudent.studentName}
              </h3>
              <p className="text-xs text-slate-500">{selectedStudent.studentEmail}</p>
              {selectedStudent.studentPhone && (
                <p className="text-xs text-indigo-600 font-mono mt-0.5">
                  {selectedStudent.studentPhone}
                </p>
              )}
            </div>

            {/* Quick Metrics */}
            {(() => {
              const stats = getStudentStats(selectedStudent);
              const curr = teacherProfile?.currency || '$';
              return (
                <div className="grid grid-cols-3 gap-2 py-4 border-b border-slate-100 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Attendance
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {stats.attPercent !== null ? `${stats.attPercent}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Fee Balance
                    </span>
                    <span className={`text-sm font-bold ${stats.totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {curr}{stats.totalDue.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Tasks Turned In
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {stats.submissionsCount}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Detailed Information Rows */}
            <div className="py-4 space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Enrolled Class
                </span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {classes.find((c) => c.id === selectedStudent.classId)?.name || 'Tuition Class'}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Guardian Information
                </span>
                <p className="font-medium text-slate-700 mt-0.5">
                  {selectedStudent.guardianName || 'Not specified'}
                </p>
                {selectedStudent.guardianPhone && (
                  <p className="text-slate-500 font-mono text-[11px]">
                    Phone: {selectedStudent.guardianPhone}
                  </p>
                )}
              </div>

              {selectedStudent.address && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Address</span>
                  <p className="text-slate-700 mt-0.5">{selectedStudent.address}</p>
                </div>
              )}

              {selectedStudent.dateOfBirth && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Date of Birth</span>
                  <p className="text-slate-700 mt-0.5">{selectedStudent.dateOfBirth}</p>
                </div>
              )}

              {selectedStudent.notes && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Teacher Notes</span>
                  <p className="p-2.5 rounded-xl bg-slate-50 text-slate-600 mt-0.5 italic">
                    "{selectedStudent.notes}"
                  </p>
                </div>
              )}

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Enrolled Since</span>
                <p className="text-slate-700 mt-0.5">
                  {new Date(selectedStudent.joinedAt).toLocaleDateString([], {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  handleOpenEdit(selectedStudent);
                  setSelectedStudent(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition"
              >
                Edit Details
              </button>
              <button
                onClick={() => handleDeleteEnrollment(selectedStudent)}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingEnrollment ? 'Edit Student Details' : 'Add / Enroll Student'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter student credentials and assign to an active tuition batch.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Maya Chen"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign to Class *
                  </label>
                  <select
                    required
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.subject})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Phone
                    <span className="text-[11px] font-normal text-slate-400 ml-1.5">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guardian Name
                    <span className="text-[11px] font-normal text-slate-400 ml-1.5">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="e.g. David Chen"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guardian Contact Phone
                    <span className="text-[11px] font-normal text-slate-400 ml-1.5">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth
                    <span className="text-[11px] font-normal text-slate-400 ml-1.5">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Address
                    <span className="text-[11px] font-normal text-slate-400 ml-1.5">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="City, State"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Private Notes / Strengths & Weaknesses
                  <span className="text-[11px] font-normal text-slate-400 ml-1.5">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Need extra assistance in trigonometry, prepares for Olympiad..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || classes.length === 0}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingEnrollment ? 'Save Changes' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
