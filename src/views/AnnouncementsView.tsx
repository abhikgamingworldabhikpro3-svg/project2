import React, { useEffect, useState } from 'react';
import {
  Calendar,
  ExternalLink,
  Megaphone,
  Plus,
  Search,
  Trash2,
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
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Announcement, ClassItem } from '../types';
import { EmptyState } from '../components/EmptyState';

export const AnnouncementsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetClassId, setTargetClassId] = useState<string>('all');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    const unsubClasses = onSnapshot(
      query(collection(db, 'classes'), where('teacherId', '==', uid)),
      (snap) => {
        setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassItem)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'classes')
    );

    const unsubAnnounce = onSnapshot(
      query(collection(db, 'announcements'), where('teacherId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAnnouncements(list);
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'announcements')
    );

    return () => {
      unsubClasses();
      unsubAnnounce();
    };
  }, [currentUser]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !message.trim()) return;

    try {
      setIsSubmitting(true);
      const attachments = attachmentUrl.trim()
        ? [{ name: 'Reference Link', url: attachmentUrl.trim() }]
        : [];

      const newAnnouncement = {
        teacherId: currentUser.uid,
        classId: targetClassId,
        title: title.trim(),
        message: message.trim(),
        targetAudience: (targetClassId === 'all' ? 'all' : 'class') as 'all' | 'class',
        publishDate: new Date().toISOString().split('T')[0],
        attachments,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'announcements'), newAnnouncement);

      // Reset
      setIsModalOpen(false);
      setTitle('');
      setMessage('');
      setAttachmentUrl('');
      setTargetClassId('all');
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.CREATE, 'announcements');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`);
    }
  };

  const filtered = announcements.filter((a) => {
    const term = searchTerm.toLowerCase();
    return a.title.toLowerCase().includes(term) || a.message.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Announcements & Bulletins
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Broadcast class schedules, holiday alerts, and exam notices to students.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading broadcasts...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={searchTerm ? 'No matching announcements' : 'No announcements published yet'}
          description={
            searchTerm
              ? 'Try modifying your search keywords.'
              : 'Post your first bulletin to inform all students or a specific tuition batch.'
          }
          actionLabel={!searchTerm ? 'Post Announcement' : undefined}
          onAction={!searchTerm ? () => setIsModalOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const targetClass = classes.find((c) => c.id === item.classId);

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase tracking-wider">
                        {item.classId === 'all'
                          ? 'All Students'
                          : `Class: ${targetClass?.name || 'Specific Batch'}`}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnouncement(item.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                      title="Delete announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2">{item.title}</h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {item.message}
                  </p>

                  {item.attachments && item.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-medium border border-slate-200 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{att.name || 'View Attachment'}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create Announcement</h3>
            <p className="text-xs text-slate-500 mb-4">
              Send a notification and bulletin to your enrolled students.
            </p>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule Change: Saturday Class moved to 10:00 AM"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Audience *
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="all">All Enrolled Students Across All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Only Students in {c.name} ({c.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message Body *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type the announcement details, zoom links, revision topics..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attachment Link (Optional)
                </label>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://... (Google Docs, Drive link, PDF)"
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
                  {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
