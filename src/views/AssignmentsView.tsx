import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit2,
  FileCheck,
  FileText,
  Filter,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  User,
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
import { Assignment, ClassItem, Submission } from '../types';
import { EmptyState } from '../components/EmptyState';

export const AssignmentsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] = useState<Assignment | null>(
    null
  );
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Grading Form Fields
  const [gradeMarks, setGradeMarks] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);

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
          setSubject(list[0].subject);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'classes')
    );

    const unsubAssign = onSnapshot(
      query(collection(db, 'assignments'), where('teacherId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAssignments(list);
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'assignments')
    );

    const unsubSub = onSnapshot(
      query(collection(db, 'submissions'), where('teacherId', '==', uid)),
      (snap) => {
        setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Submission)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'submissions')
    );

    return () => {
      unsubClasses();
      unsubAssign();
      unsubSub();
    };
  }, [currentUser]);

  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    const c = classes.find((item) => item.id === newClassId);
    if (c) setSubject(c.subject);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !classId) return;

    try {
      setIsSubmitting(true);
      const attachments = attachmentUrl.trim()
        ? [{ name: 'Assignment Resource / Worksheet', url: attachmentUrl.trim() }]
        : [];

      const newAssignment = {
        teacherId: currentUser.uid,
        classId,
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        dueDate,
        maxMarks: Number(maxMarks) || 100,
        attachments,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'assignments'), newAssignment);

      // Create broadcast in notifications for enrolled students
      setIsCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setInstructions('');
      setAttachmentUrl('');
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.CREATE, 'assignments');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await deleteDoc(doc(db, 'assignments', id));
      if (selectedAssignmentForGrading?.id === id) {
        setSelectedAssignmentForGrading(null);
      }
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.DELETE, `assignments/${id}`);
    }
  };

  const handleOpenGrading = (sub: Submission) => {
    setGradingSubmission(sub);
    setGradeMarks(sub.marksObtained ?? 0);
    setGradeFeedback(sub.feedback || '');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    try {
      setIsGrading(true);
      const subRef = doc(db, 'submissions', gradingSubmission.id);
      await updateDoc(subRef, {
        marksObtained: Number(gradeMarks),
        feedback: gradeFeedback.trim(),
        status: 'graded',
        gradedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Send student in-app notification
      try {
        await addDoc(collection(db, 'notifications'), {
          recipientId: gradingSubmission.studentId,
          senderId: currentUser?.uid,
          title: 'Assignment Graded!',
          message: `Your submission has been reviewed: ${gradeMarks} marks awarded.`,
          type: 'grading',
          relatedId: gradingSubmission.assignmentId,
          read: false,
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Notification silent fallback
      }

      setGradingSubmission(null);
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.UPDATE, `submissions/${gradingSubmission.id}`);
    } finally {
      setIsGrading(false);
    }
  };

  // Filter assignments
  const filtered = assignments.filter((a) => {
    const matchesClass = selectedClassFilter === 'all' || a.classId === selectedClassFilter;
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Assignments & Grading
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create homework tasks, evaluate student responses, and provide feedback.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by assignment title or subject..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400">Class:</span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-700 w-full sm:w-48"
          >
            <option value="all">All Classes ({assignments.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Assignments */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading assignments...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={searchTerm ? 'No assignments match your search' : 'No assignments created yet'}
          description={
            searchTerm
              ? 'Try modifying your search keywords.'
              : 'Create homework or assessment tasks for your tuition classes.'
          }
          actionLabel={!searchTerm ? 'Create Assignment' : undefined}
          onAction={!searchTerm ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((a) => {
            const assignSubmissions = submissions.filter((s) => s.assignmentId === a.id);
            const gradedCount = assignSubmissions.filter((s) => s.status === 'graded').length;
            const c = classes.find((cl) => cl.id === a.classId);

            return (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase">
                          {a.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                          {a.maxMarks} Marks
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-base mt-1.5 leading-snug line-clamp-1">
                        {a.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Class: {c?.name || 'Assigned Class'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteAssignment(a.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {a.description}
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Due Date:
                      </span>
                      <span className="font-semibold text-slate-800">{a.dueDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" /> Submissions:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {assignSubmissions.length} Turned In ({gradedCount} Graded)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Created: {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setSelectedAssignmentForGrading(a)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <span>Submissions ({assignSubmissions.length})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submissions Review Drawer */}
      {selectedAssignmentForGrading && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setSelectedAssignmentForGrading(null)}
          />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl p-6 flex flex-col z-10 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Assignment Submissions
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {selectedAssignmentForGrading.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAssignmentForGrading(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 space-y-3">
              {(() => {
                const subs = submissions.filter(
                  (s) => s.assignmentId === selectedAssignmentForGrading.id
                );
                if (subs.length === 0) {
                  return (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No submissions turned in yet for this assignment.
                    </div>
                  );
                }

                return subs.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                          {sub.studentName}
                        </h4>
                        <p className="text-[11px] text-slate-400">{sub.studentEmail}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sub.status === 'graded'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {sub.status === 'graded' ? `${sub.marksObtained} Marks` : 'Pending Grade'}
                      </span>
                    </div>

                    <div className="mt-3 p-3 rounded-lg bg-white border border-slate-100 text-xs text-slate-700 whitespace-pre-wrap">
                      {sub.submissionText || 'No text content provided.'}
                    </div>

                    {sub.feedback && (
                      <p className="mt-2 text-[11px] text-slate-500 italic">
                        <strong>Teacher Feedback:</strong> "{sub.feedback}"
                      </p>
                    )}

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleOpenGrading(sub)}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer"
                      >
                        {sub.status === 'graded' ? 'Edit Grade' : 'Grade Submission'}
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Grading Form Modal */}
      {gradingSubmission && selectedAssignmentForGrading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-0.5">
              Grade Submission: {gradingSubmission.studentName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Assignment: {selectedAssignmentForGrading.title} (Max:{' '}
              {selectedAssignmentForGrading.maxMarks} marks)
            </p>

            <form onSubmit={handleSaveGrade} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Marks Awarded (Max: {selectedAssignmentForGrading.maxMarks}) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedAssignmentForGrading.maxMarks}
                  required
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teacher Feedback & Critique
                </label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Great explanation of the derivation. Be careful with sign changes in step 3..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGrading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer"
                >
                  {isGrading ? 'Saving Grade...' : 'Submit Grade & Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create New Assignment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Assign tasks, specify maximum marks, and add instructions.
            </p>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Thermodynamics Problem Set 4"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Class *
                  </label>
                  <select
                    required
                    value={classId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.subject})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Physics"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maximum Marks *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    required
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Questions
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline the problems, questions, or essay prompt..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submission Instructions / Reference Link (Optional)
                </label>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or pdf url"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || classes.length === 0}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
