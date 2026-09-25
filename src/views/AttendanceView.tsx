import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CalendarCheck,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Filter,
  Save,
  UserCheck,
  UserX,
  X,
  XCircle,
} from 'lucide-react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceStudentEntry,
  ClassItem,
  Enrollment,
} from '../types';
import { EmptyState } from '../components/EmptyState';

export const AttendanceView: React.FC = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);

  // Selection controls
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [sessionName, setSessionName] = useState<string>('Regular Session');

  // Active session student status map
  const [studentStatuses, setStudentStatuses] = useState<
    Record<string, { status: AttendanceStatus; notes?: string }>
  >({});
  const [isExistingRecord, setIsExistingRecord] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load Classes
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'classes'), where('teacherId', '==', currentUser.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassItem));
        setClasses(list);
        if (list.length > 0 && !selectedClassId) {
          setSelectedClassId(list[0].id);
        }
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'classes')
    );
    return () => unsub();
  }, [currentUser]);

  // Load Enrollments for Teacher
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'enrollments'),
      where('teacherId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEnrollments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enrollment)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'enrollments')
    );
    return () => unsub();
  }, [currentUser]);

  // Load Teacher Attendance Records for History & Analytics
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'attendance'),
      where('teacherId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord));
        items.sort((a, b) => (b.date > a.date ? 1 : -1));
        setAttendanceHistory(items);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'attendance')
    );
    return () => unsub();
  }, [currentUser]);

  // Derive active class enrolled students
  const activeClassStudents = enrollments.filter((e) => e.classId === selectedClassId);

  // Unique document ID to prevent duplicate attendance:
  const getDocId = () => {
    const cleanSession = sessionName.trim().replace(/[^a-zA-Z0-9]/g, '_');
    return `${selectedClassId}_${selectedDate}_${cleanSession}`;
  };

  // Sync current student status map whenever class, date, or session changes
  useEffect(() => {
    if (!selectedClassId || !selectedDate || !sessionName) return;

    const docId = getDocId();
    const existing = attendanceHistory.find((a) => a.id === docId);

    if (existing && existing.records) {
      setIsExistingRecord(true);
      const map: Record<string, { status: AttendanceStatus; notes?: string }> = {};
      activeClassStudents.forEach((st) => {
        if (existing.records[st.studentId]) {
          map[st.studentId] = {
            status: existing.records[st.studentId].status,
            notes: existing.records[st.studentId].notes || '',
          };
        } else {
          map[st.studentId] = { status: 'present' };
        }
      });
      setStudentStatuses(map);
    } else {
      setIsExistingRecord(false);
      // Default all to 'present' for easy workflow
      const map: Record<string, { status: AttendanceStatus; notes?: string }> = {};
      activeClassStudents.forEach((st) => {
        map[st.studentId] = { status: 'present' };
      });
      setStudentStatuses(map);
    }
  }, [selectedClassId, selectedDate, sessionName, attendanceHistory, enrollments]);

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleSetNote = (studentId: string, notes: string) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const map: Record<string, { status: AttendanceStatus; notes?: string }> = {};
    activeClassStudents.forEach((st) => {
      map[st.studentId] = {
        status,
        notes: studentStatuses[st.studentId]?.notes,
      };
    });
    setStudentStatuses(map);
  };

  const handleSaveAttendance = async () => {
    if (!currentUser || !selectedClassId || activeClassStudents.length === 0) return;

    try {
      setIsSaving(true);
      const docId = getDocId();

      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;

      const records: Record<string, AttendanceStudentEntry> = {};
      activeClassStudents.forEach((st) => {
        const item = studentStatuses[st.studentId] || { status: 'present' };
        records[st.studentId] = {
          status: item.status,
          studentName: st.studentName,
          notes: item.notes,
        };

        if (item.status === 'present') present++;
        else if (item.status === 'absent') absent++;
        else if (item.status === 'late') late++;
        else if (item.status === 'excused') excused++;
      });

      const attRecord: AttendanceRecord = {
        id: docId,
        teacherId: currentUser.uid,
        classId: selectedClassId,
        date: selectedDate,
        session: sessionName.trim(),
        records,
        totalPresent: present,
        totalAbsent: absent,
        totalLate: late,
        totalExcused: excused,
        createdAt: isExistingRecord
          ? attendanceHistory.find((a) => a.id === docId)?.createdAt || new Date().toISOString()
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'attendance', docId), attRecord);

      setIsExistingRecord(true);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.WRITE, `attendance/${getDocId()}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Class historical attendance analytics
  const classRecords = attendanceHistory.filter((a) => a.classId === selectedClassId);
  let classPresentTotal = 0;
  let classTotalPossible = 0;
  classRecords.forEach((r) => {
    classPresentTotal += r.totalPresent;
    classTotalPossible += r.totalPresent + r.totalAbsent + r.totalLate + r.totalExcused;
  });
  const overallClassPercent =
    classTotalPossible > 0 ? Math.round((classPresentTotal / classTotalPossible) * 100) : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Attendance Register
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Mark daily sessions with status tracking and duplicate protection.
          </p>
        </div>

        {activeClassStudents.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAttendance}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isExistingRecord ? 'Update Record' : 'Save Attendance'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Selector Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 glass-card p-4 rounded-3xl shadow-xs">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Select Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.subject})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Session</label>
          <select
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            <option value="Regular Session">Regular Session</option>
            <option value="Morning Session">Morning Session</option>
            <option value="Evening Batch">Evening Batch</option>
            <option value="Weekend Extra">Weekend Extra</option>
            <option value="Test / Exam Session">Test / Exam Session</option>
          </select>
        </div>
      </div>

      {/* Class Statistics Ribbon */}
      {selectedClassId && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-950">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500 text-[11px] block">Enrolled Students:</span>
              <span className="font-bold text-sm text-indigo-900">
                {activeClassStudents.length}
              </span>
            </div>
            <div className="border-l border-indigo-200 pl-4">
              <span className="text-slate-500 text-[11px] block">Overall Attendance %:</span>
              <span className="font-bold text-sm text-indigo-900">
                {overallClassPercent !== null ? `${overallClassPercent}%` : 'No logs yet'}
              </span>
            </div>
            <div className="border-l border-indigo-200 pl-4">
              <span className="text-slate-500 text-[11px] block">Logged Sessions:</span>
              <span className="font-bold text-sm text-indigo-900">{classRecords.length}</span>
            </div>
          </div>

          {isExistingRecord && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Existing Attendance Record Loaded
            </span>
          )}
        </div>
      )}

      {/* Quick Mark All Buttons */}
      {activeClassStudents.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Quick Actions:</span>
            <button
              onClick={() => handleMarkAll('present')}
              className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll('absent')}
              className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition"
            >
              Mark All Absent
            </button>
          </div>

          <span className="text-xs text-slate-400">
            {
              Object.values(studentStatuses).filter((s) => s.status === 'present').length
            }{' '}
            Present / {activeClassStudents.length} Total
          </span>
        </div>
      )}

      {/* Students Roll Table */}
      {classes.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No classes available"
          description="Create a class first to start taking attendance."
        />
      ) : activeClassStudents.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No students enrolled in this class"
          description="Add students to this class or share your join code to record attendance."
        />
      ) : (
        <div className="glass-card rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">Remarks / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {activeClassStudents.map((st, idx) => {
                  const currentStatus = studentStatuses[st.studentId]?.status || 'present';
                  const currentNote = studentStatuses[st.studentId]?.notes || '';

                  return (
                    <tr key={st.studentId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{st.studentName}</span>
                        <span className="text-[11px] text-slate-400">{st.studentEmail}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl gap-1">
                          {(
                            [
                              { key: 'present', label: 'Present', color: 'emerald' },
                              { key: 'absent', label: 'Absent', color: 'rose' },
                              { key: 'late', label: 'Late', color: 'amber' },
                              { key: 'excused', label: 'Excused', color: 'slate' },
                            ] as const
                          ).map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => handleSetStatus(st.studentId, item.key)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                currentStatus === item.key
                                  ? item.key === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : item.key === 'absent'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : item.key === 'late'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-slate-700 text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={currentNote}
                          onChange={(e) => handleSetNote(st.studentId, e.target.value)}
                          placeholder="Optional note (e.g. Doctor appointment)"
                          className="w-full max-w-xs px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
