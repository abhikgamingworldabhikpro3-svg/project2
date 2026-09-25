import React, { useEffect, useState } from 'react';
import {
  Archive,
  BookOpen,
  Calendar,
  Clock,
  Copy,
  Edit2,
  MoreVertical,
  Plus,
  QrCode,
  Search,
  Share2,
  Trash2,
  Users,
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
import { ClassItem, Enrollment } from '../types';
import { QRCodeModal } from '../components/QRCodeModal';
import { EmptyState } from '../components/EmptyState';

export const ClassesView: React.FC = () => {
  const { currentUser, teacherProfile } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [qrModalClass, setQrModalClass] = useState<ClassItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [batchName, setBatchName] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:30');
  const [maxStudents, setMaxStudents] = useState(35);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'classes'), where('teacherId', '==', currentUser.uid));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ClassItem));
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setClasses(items);
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'classes')
    );

    const qEnr = query(
      collection(db, 'enrollments'),
      where('teacherId', '==', currentUser.uid)
    );
    const unsubEnr = onSnapshot(
      qEnr,
      (snapshot) => {
        setEnrollments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Enrollment)));
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'enrollments')
    );

    return () => {
      unsub();
      unsubEnr();
    };
  }, [currentUser]);

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleOpenCreate = () => {
    setEditingClass(null);
    setName('');
    setSubject('');
    setBatchName('');
    setDescription('');
    setSchedule('');
    setStartTime('16:00');
    setEndTime('17:30');
    setMaxStudents(35);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ClassItem) => {
    setEditingClass(c);
    setName(c.name);
    setSubject(c.subject);
    setBatchName(c.batchName || '');
    setDescription(c.description || '');
    setSchedule(c.schedule || '');
    setStartTime(c.startTime || '16:00');
    setEndTime(c.endTime || '17:30');
    setMaxStudents(c.maxStudents || 35);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !name.trim() || !subject.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingClass) {
        // Update
        const cRef = doc(db, 'classes', editingClass.id);
        const updates = {
          name: name.trim(),
          subject: subject.trim(),
          batchName: batchName.trim(),
          description: description.trim(),
          schedule: schedule.trim(),
          startTime,
          endTime,
          maxStudents: Number(maxStudents),
          updatedAt: new Date().toISOString(),
        };
        await updateDoc(cRef, updates);
      } else {
        // Create
        const joinCode = generateJoinCode();
        const newClass = {
          teacherId: currentUser.uid,
          name: name.trim(),
          subject: subject.trim(),
          batchName: batchName.trim(),
          description: description.trim(),
          schedule: schedule.trim(),
          startTime,
          endTime,
          maxStudents: Number(maxStudents),
          status: 'active' as const,
          joinCode,
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'classes'), newClass);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      handleFirestoreError(
        err,
        editingClass ? OperationType.UPDATE : OperationType.CREATE,
        'classes'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleArchive = async (c: ClassItem) => {
    try {
      const newStatus = c.status === 'active' ? 'archived' : 'active';
      await updateDoc(doc(db, 'classes', c.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${c.id}`);
    }
  };

  const handleDelete = async (c: ClassItem) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${c.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'classes', c.id));
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.DELETE, `classes/${c.id}`);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered classes
  const filtered = classes.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.batchName && c.batchName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.joinCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Class Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize tuition batches, manage schedules, and share invitation codes.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Class</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-card p-3 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by class, subject, or code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          {(['active', 'archived', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 sm:flex-none px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Classes */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading your classes...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={searchTerm ? 'No matching classes found' : 'No classes created yet'}
          description={
            searchTerm
              ? 'Try adjusting your search keywords or status filter.'
              : 'Create your first course or tuition batch to start enrolling students.'
          }
          actionLabel={!searchTerm ? 'Create First Class' : undefined}
          onAction={!searchTerm ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => {
            const classEnrollments = enrollments.filter((e) => e.classId === c.id);
            const isFull = classEnrollments.length >= (c.maxStudents || 35);

            return (
              <div
                key={c.id}
                className="glass-card glass-card-hover rounded-3xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase">
                          {c.subject}
                        </span>
                        {c.status === 'archived' && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-semibold text-[10px] uppercase">
                            Archived
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-base mt-1.5 leading-snug">
                        {c.name}
                      </h3>
                      {c.batchName && (
                        <p className="text-xs text-slate-500 font-medium">{c.batchName}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQrModalClass(c)}
                        title="View Join QR Code"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        title="Edit Class Details"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {c.description && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  )}

                  {/* Metadata Chips */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {c.schedule && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.schedule}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          Enrolled: <strong>{classEnrollments.length}</strong> / {c.maxStudents || 35}
                        </span>
                      </div>
                      {isFull && (
                        <span className="text-[10px] text-amber-600 font-bold">Class Full</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Join Code Box & Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Join Code
                      </span>
                      <button
                        onClick={() => handleCopyCode(c.joinCode)}
                        className="font-mono text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{c.joinCode}</span>
                        <Copy className="w-3 h-3 text-slate-400" />
                        {copiedId === c.joinCode && (
                          <span className="text-[10px] text-emerald-600 font-sans font-bold">
                            Copied!
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleArchive(c)}
                        title={c.status === 'active' ? 'Archive Class' : 'Activate Class'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        title="Delete Class"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingClass ? 'Edit Class Details' : 'Create New Tuition Class'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Fill in the batch schedule, subject, and student limits.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Advanced Calculus"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Mathematics"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch Label
                  </label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g. Batch 2026-A"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maximum Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schedule (Days & Times)
                </label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="e.g. Tue, Thu, Sat (5:00 PM - 6:30 PM)"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Description / Syllabus Summary
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key topics, exam preparation targets, and study requirements..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingClass
                    ? 'Update Class'
                    : 'Create Class & Join Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code & Share Modal */}
      {qrModalClass && (
        <QRCodeModal
          classItem={qrModalClass}
          instituteName={teacherProfile?.instituteName}
          onClose={() => setQrModalClass(null)}
        />
      )}
    </div>
  );
};
