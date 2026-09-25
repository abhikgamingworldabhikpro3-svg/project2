import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  TrendingUp,
  Users,
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  Assignment,
  AttendanceRecord,
  ClassItem,
  Enrollment,
  FeeRecord,
  Payment,
  Submission,
} from '../types';

export const ReportsView: React.FC = () => {
  const { currentUser, teacherProfile } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [activeReportTab, setActiveReportTab] = useState<'attendance' | 'fees' | 'academic'>(
    'attendance'
  );
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const currency = teacherProfile?.currency || '$';

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    const unsubClasses = onSnapshot(
      query(collection(db, 'classes'), where('teacherId', '==', uid)),
      (snap) => setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassItem)))
    );

    const unsubEnroll = onSnapshot(
      query(collection(db, 'enrollments'), where('teacherId', '==', uid)),
      (snap) => setEnrollments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enrollment)))
    );

    const unsubAtt = onSnapshot(
      query(collection(db, 'attendance'), where('teacherId', '==', uid)),
      (snap) => setAttendance(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord)))
    );

    const unsubFees = onSnapshot(
      query(collection(db, 'fees'), where('teacherId', '==', uid)),
      (snap) => setFees(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeeRecord)))
    );

    const unsubPay = onSnapshot(
      query(collection(db, 'payments'), where('teacherId', '==', uid)),
      (snap) => setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment)))
    );

    const unsubAssign = onSnapshot(
      query(collection(db, 'assignments'), where('teacherId', '==', uid)),
      (snap) => setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment)))
    );

    const unsubSub = onSnapshot(
      query(collection(db, 'submissions'), where('teacherId', '==', uid)),
      (snap) => setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Submission)))
    );

    return () => {
      unsubClasses();
      unsubEnroll();
      unsubAtt();
      unsubFees();
      unsubPay();
      unsubAssign();
      unsubSub();
    };
  }, [currentUser]);

  // Export to CSV helper
  const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Attendance Report Computations
  const filteredEnrollments = enrollments.filter(
    (e) => selectedClassId === 'all' || e.classId === selectedClassId
  );

  const studentAttendanceStats = filteredEnrollments.map((st) => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let total = 0;

    attendance.forEach((att) => {
      if (att.classId === st.classId && att.records && att.records[st.studentId]) {
        total++;
        const status = att.records[st.studentId].status;
        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        else if (status === 'late') late++;
      }
    });

    const percent = total > 0 ? Math.round((present / total) * 100) : null;
    const c = classes.find((cl) => cl.id === st.classId);

    return {
      studentId: st.studentId,
      studentName: st.studentName,
      className: c?.name || 'Class',
      present,
      absent,
      late,
      total,
      percent,
    };
  });

  const handleExportAttendanceCSV = () => {
    const headers = ['Student Name', 'Class', 'Present Days', 'Absent Days', 'Late Days', 'Total Sessions', 'Attendance %'];
    const rows = studentAttendanceStats.map((s) => [
      s.studentName,
      s.className,
      s.present,
      s.absent,
      s.late,
      s.total,
      s.percent !== null ? `${s.percent}%` : 'N/A',
    ]);
    exportToCSV(`TutorFlow_Attendance_Report_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  // 2. Fee Report Computations
  const filteredFees = fees.filter(
    (f) => selectedClassId === 'all' || f.classId === selectedClassId
  );

  const handleExportFeesCSV = () => {
    const headers = ['Student Name', 'Invoice Title', 'Category', 'Total Payable', 'Amount Paid', 'Remaining Balance', 'Due Date', 'Status'];
    const rows = filteredFees.map((f) => [
      f.studentName,
      f.title,
      f.feeType,
      f.totalPayable,
      f.amountPaid,
      f.remainingAmount,
      f.dueDate,
      f.status,
    ]);
    exportToCSV(`TutorFlow_Fee_Collection_Report_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  // 3. Academic & Assignment Report Computations
  const filteredAssignments = assignments.filter(
    (a) => selectedClassId === 'all' || a.classId === selectedClassId
  );

  const assignmentStats = filteredAssignments.map((a) => {
    const subs = submissions.filter((s) => s.assignmentId === a.id);
    const graded = subs.filter((s) => s.status === 'graded');
    const avgMarks =
      graded.length > 0
        ? Math.round(
            graded.reduce((acc, curr) => acc + (curr.marksObtained || 0), 0) / graded.length
          )
        : null;
    const c = classes.find((cl) => cl.id === a.classId);

    return {
      id: a.id,
      title: a.title,
      className: c?.name || 'Class',
      dueDate: a.dueDate,
      maxMarks: a.maxMarks,
      totalSubmissions: subs.length,
      gradedCount: graded.length,
      avgMarks,
    };
  });

  const handleExportAcademicCSV = () => {
    const headers = ['Assignment Title', 'Class', 'Due Date', 'Max Marks', 'Turned In', 'Graded Count', 'Average Score'];
    const rows = assignmentStats.map((a) => [
      a.title,
      a.className,
      a.dueDate,
      a.maxMarks,
      a.totalSubmissions,
      a.gradedCount,
      a.avgMarks !== null ? a.avgMarks : 'N/A',
    ]);
    exportToCSV(`TutorFlow_Assignment_Performance_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time performance reports with one-click CSV spreadsheet export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeReportTab === 'attendance' && (
            <button
              onClick={handleExportAttendanceCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Attendance CSV</span>
            </button>
          )}

          {activeReportTab === 'fees' && (
            <button
              onClick={handleExportFeesCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Fees CSV</span>
            </button>
          )}

          {activeReportTab === 'academic' && (
            <button
              onClick={handleExportAcademicCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Academic CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs and Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveReportTab('attendance')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeReportTab === 'attendance'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Attendance Register
          </button>
          <button
            onClick={() => setActiveReportTab('fees')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeReportTab === 'fees'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Fee Collection
          </button>
          <button
            onClick={() => setActiveReportTab('academic')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeReportTab === 'academic'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Assignment Performance
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400">Class:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-1 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none w-full sm:w-48"
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab 1: Attendance Report Table */}
      {activeReportTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Student Attendance Breakdown</h3>
            <span className="text-xs text-slate-400">{studentAttendanceStats.length} students</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Present</th>
                  <th className="py-3 px-4">Absent</th>
                  <th className="py-3 px-4">Late</th>
                  <th className="py-3 px-4">Sessions</th>
                  <th className="py-3 px-4 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {studentAttendanceStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      No attendance data recorded yet.
                    </td>
                  </tr>
                ) : (
                  studentAttendanceStats.map((s) => (
                    <tr key={s.studentId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.studentName}</td>
                      <td className="py-3 px-4 text-slate-600">{s.className}</td>
                      <td className="py-3 px-4 text-emerald-600 font-semibold">{s.present}</td>
                      <td className="py-3 px-4 text-rose-600 font-semibold">{s.absent}</td>
                      <td className="py-3 px-4 text-amber-600 font-semibold">{s.late}</td>
                      <td className="py-3 px-4 text-slate-500">{s.total}</td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-bold ${
                            s.percent !== null && s.percent >= 80
                              ? 'text-emerald-600'
                              : s.percent !== null && s.percent >= 60
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {s.percent !== null ? `${s.percent}%` : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Fees Report Table */}
      {activeReportTab === 'fees' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Fee Invoices & Outstanding Balance</h3>
            <span className="text-xs text-slate-400">{filteredFees.length} invoices</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Fee Title</th>
                  <th className="py-3 px-4">Payable</th>
                  <th className="py-3 px-4">Collected</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredFees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      No fee records found.
                    </td>
                  </tr>
                ) : (
                  filteredFees.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{f.studentName}</td>
                      <td className="py-3 px-4 text-slate-600">{f.title}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {currency}
                        {f.totalPayable.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">
                        {currency}
                        {f.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-600">
                        {currency}
                        {f.remainingAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{f.dueDate}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-[10px] uppercase">
                          {f.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Academic & Assignment Report */}
      {activeReportTab === 'academic' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Assignment Score Averages</h3>
            <span className="text-xs text-slate-400">{assignmentStats.length} assignments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Assignment</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Submissions</th>
                  <th className="py-3 px-4">Graded</th>
                  <th className="py-3 px-4">Max Marks</th>
                  <th className="py-3 px-4 text-right">Class Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {assignmentStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      No assignments published yet.
                    </td>
                  </tr>
                ) : (
                  assignmentStats.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{a.title}</td>
                      <td className="py-3 px-4 text-slate-600">{a.className}</td>
                      <td className="py-3 px-4 text-slate-500">{a.dueDate}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {a.totalSubmissions}
                      </td>
                      <td className="py-3 px-4 text-indigo-600 font-semibold">{a.gradedCount}</td>
                      <td className="py-3 px-4 text-slate-500">{a.maxMarks}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-emerald-600">
                          {a.avgMarks !== null ? `${a.avgMarks} / ${a.maxMarks}` : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
