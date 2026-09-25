import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Brain,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  HardDrive,
  Image as ImageIcon,
  Layers,
  Link as LinkIcon,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  Video,
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
import {
  db,
  handleFirestoreError,
  OperationType,
  uploadAndRegisterStorageFile,
  deleteStorageFile,
} from '../firebase';
import { FirebaseStorageView } from './FirebaseStorageView';
import { useAuth } from '../context/AuthContext';
import { ClassItem, StudyMaterial, StorageFile } from '../types';
import { EmptyState } from '../components/EmptyState';

export const StudyMaterialsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active tab: Structured study materials vs direct Firebase Storage collection
  const [activeTab, setActiveTab] = useState<'materials' | 'storage'>('materials');
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [directUploadFile, setDirectUploadFile] = useState<File | null>(null);
  const [directCategory, setDirectCategory] = useState<StorageFile['category']>('study_material');
  const [directClassId, setDirectClassId] = useState<string>('');
  const [isUploadingToStorage, setIsUploadingToStorage] = useState(false);
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiDiagramModalOpen, setIsAiDiagramModalOpen] = useState(false);
  const [isAiThinkModalOpen, setIsAiThinkModalOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);

  // Material Form
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<StudyMaterial['type']>('notes');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Diagram Generator State (gemini-3-pro-image-preview with 1K, 2K, 4K)
  const [diagramPrompt, setDiagramPrompt] = useState(
    'A labeled scientific diagram of photosynthesis and cellular respiration in plant cells'
  );
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '16:9'>('1:1');
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [generatedDiagramUrl, setGeneratedDiagramUrl] = useState<string | null>(null);
  const [diagramError, setDiagramError] = useState<string | null>(null);

  // AI Deep Think Explainer State (gemini-3.1-pro-preview with HIGH thinking)
  const [thinkQuery, setThinkQuery] = useState(
    'Derive and intuitively explain Kepler’s Third Law of Planetary Motion with first principles and common exam pitfalls.'
  );
  const [thinkSubject, setThinkSubject] = useState('Physics / Astronomy');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkSolution, setThinkSolution] = useState<string | null>(null);
  const [thinkError, setThinkError] = useState<string | null>(null);

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

    const unsubMat = onSnapshot(
      query(collection(db, 'materials'), where('teacherId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudyMaterial));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMaterials(list);
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'materials')
    );

    // Subscribe to Firebase Storage files collection
    const unsubStorage = onSnapshot(
      query(collection(db, 'storage_files'), where('teacherId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StorageFile));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setStorageFiles(list);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'storage_files')
    );

    return () => {
      unsubClasses();
      unsubMat();
      unsubStorage();
    };
  }, [currentUser]);

  const handleClassSelect = (newId: string) => {
    setClassId(newId);
    const c = classes.find((cl) => cl.id === newId);
    if (c) setSubject(c.subject);
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !classId) return;

    try {
      setIsSubmitting(true);
      let finalFileUrl = linkUrl.trim();
      let storagePath: string | undefined = undefined;
      let fileName: string | undefined = undefined;
      let fileSize: number | undefined = undefined;

      // If a local file is chosen, upload it directly to Firebase Storage
      if (attachedFile) {
        const storageRecord = await uploadAndRegisterStorageFile(
          attachedFile,
          currentUser.uid,
          'study_material',
          classId
        );
        finalFileUrl = storageRecord.downloadURL;
        storagePath = storageRecord.storagePath;
        fileName = attachedFile.name;
        fileSize = attachedFile.size;
      }

      const determinedType = attachedFile
        ? attachedFile.type.includes('pdf')
          ? 'pdf'
          : attachedFile.type.includes('image')
          ? 'image'
          : 'doc'
        : type;

      const newMaterial = {
        teacherId: currentUser.uid,
        classId,
        title: title.trim(),
        subject: subject.trim(),
        chapter: chapter.trim(),
        topic: topic.trim(),
        description: description.trim(),
        type: determinedType,
        content: content.trim(),
        linkUrl: finalFileUrl,
        fileUrl: finalFileUrl,
        storagePath,
        fileName,
        fileSize,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'materials'), newMaterial);
      setIsCreateModalOpen(false);
      setTitle('');
      setChapter('');
      setTopic('');
      setDescription('');
      setContent('');
      setLinkUrl('');
      setAttachedFile(null);
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.CREATE, 'materials');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Upload to Firebase Storage
  const handleDirectStorageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUploadFile || !currentUser) return;
    try {
      setIsUploadingToStorage(true);
      await uploadAndRegisterStorageFile(
        directUploadFile,
        currentUser.uid,
        directCategory,
        directClassId || undefined
      );
      setDirectUploadFile(null);
    } catch (err) {
      console.error('Storage upload failed:', err);
    } finally {
      setIsUploadingToStorage(false);
    }
  };

  const handleDeleteStorageItem = async (fileItem: StorageFile) => {
    if (!window.confirm(`Delete "${fileItem.name}" from Firebase Storage?`)) return;
    try {
      await deleteStorageFile(fileItem.storagePath, fileItem.id);
    } catch (err) {
      console.error('Failed to delete storage file:', err);
    }
  };

  const handleCopyStorageUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedFileId(id);
    setTimeout(() => setCopiedFileId(null), 2000);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!window.confirm('Delete this study material?')) return;
    try {
      await deleteDoc(doc(db, 'materials', id));
      if (viewingMaterial?.id === id) setViewingMaterial(null);
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.DELETE, `materials/${id}`);
    }
  };

  // AI Diagram Generation Handler (gemini-3-pro-image-preview)
  const handleGenerateDiagram = async () => {
    if (!diagramPrompt.trim()) return;
    try {
      setIsGeneratingDiagram(true);
      setDiagramError(null);
      setGeneratedDiagramUrl(null);

      const res = await fetch('/api/gemini/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: diagramPrompt.trim(),
          aspectRatio,
          imageSize,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate diagram');
      }

      setGeneratedDiagramUrl(data.imageUrl);
    } catch (err: unknown) {
      const e = err as Error;
      setDiagramError(e.message || 'Image generation failed');
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  // Convert generated diagram directly into study material
  const handleAttachDiagramAsMaterial = async () => {
    if (!generatedDiagramUrl || !currentUser || !classId) return;
    try {
      setIsSubmitting(true);
      const newMaterial = {
        teacherId: currentUser.uid,
        classId,
        title: `Visual Aid: ${diagramPrompt.slice(0, 50)}...`,
        subject: subject || 'Science',
        chapter: 'Visual Aids',
        topic: 'AI Generated Diagrams',
        description: `Generated diagram (${imageSize} resolution, ${aspectRatio}): ${diagramPrompt}`,
        type: 'image' as const,
        linkUrl: generatedDiagramUrl,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'materials'), newMaterial);
      setIsAiDiagramModalOpen(false);
      setGeneratedDiagramUrl(null);
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.CREATE, 'materials');
    } finally {
      setIsSubmitting(false);
    }
  };

  // AI Deep Think Handler (gemini-3.1-pro-preview with HIGH Thinking)
  const handleDeepThink = async () => {
    if (!thinkQuery.trim()) return;
    try {
      setIsThinking(true);
      setThinkError(null);
      setThinkSolution(null);

      const res = await fetch('/api/gemini/deep-think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: thinkQuery.trim(),
          subject: thinkSubject.trim(),
          targetAudience: 'Secondary & High School Students',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Deep thinking failed');
      }

      setThinkSolution(data.solution);
    } catch (err: unknown) {
      const e = err as Error;
      setThinkError(e.message || 'Deep thinking failed');
    } finally {
      setIsThinking(false);
    }
  };

  // Convert deep think response into Lesson Notes study material
  const handleSaveThinkAsNotes = async () => {
    if (!thinkSolution || !currentUser || !classId) return;
    try {
      setIsSubmitting(true);
      const newMaterial = {
        teacherId: currentUser.uid,
        classId,
        title: `Curriculum Guide: ${thinkQuery.slice(0, 45)}...`,
        subject: thinkSubject || 'Academic Study',
        chapter: 'Deep Concept Breakdowns',
        topic: 'Pedagogical Notes',
        description: `Comprehensive explanation generated by TutorFlow AI High Thinking.`,
        type: 'notes' as const,
        content: thinkSolution,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'materials'), newMaterial);
      setIsAiThinkModalOpen(false);
      setThinkSolution(null);
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.CREATE, 'materials');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered materials
  const filtered = materials.filter((m) => {
    const matchesClass = selectedClassFilter === 'all' || m.classId === selectedClassFilter;
    const matchesType = selectedTypeFilter === 'all' || m.type === selectedTypeFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      m.title.toLowerCase().includes(term) ||
      m.subject.toLowerCase().includes(term) ||
      (m.chapter && m.chapter.toLowerCase().includes(term)) ||
      (m.topic && m.topic.toLowerCase().includes(term));
    return matchesClass && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Study Materials & AI Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Share structured notes, PDFs, and generate visual diagrams with Gemini AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Diagram Tool */}
          <button
            onClick={() => setIsAiDiagramModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Diagram Studio (1K/2K/4K)</span>
          </button>

          {/* AI High Thinking Tool */}
          <button
            onClick={() => setIsAiThinkModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5 text-emerald-600" />
            <span>High Thinking Mode</span>
          </button>

          {/* Add Study Material */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Material</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs: Structured Study Guides vs Firebase Storage Collection */}
      <div className="flex items-center gap-2 p-1.5 glass-card rounded-2xl shadow-xs max-w-fit">
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'materials'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100/50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Curriculum Notes ({materials.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'storage'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100/50'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Firebase Storage Collection ({storageFiles.length})</span>
        </button>
      </div>

      {activeTab === 'storage' ? (
        <FirebaseStorageView />
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, chapter, or topic..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Classes ({materials.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none capitalize"
          >
            <option value="all">All Formats</option>
            <option value="notes">Notes / Text</option>
            <option value="pdf">PDF Documents</option>
            <option value="image">Illustrations / Images</option>
            <option value="link">Web Links</option>
            <option value="youtube">YouTube Videos</option>
          </select>
        </div>
      </div>

      {/* Grid of Materials */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading study materials...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={searchTerm ? 'No matching materials found' : 'No study materials uploaded yet'}
          description={
            searchTerm
              ? 'Try adjusting your search criteria.'
              : 'Upload lecture notes, formulas, worksheets, or use our AI Generator to create visual diagrams.'
          }
          actionLabel={!searchTerm ? 'Upload Material' : undefined}
          onAction={!searchTerm ? () => setIsCreateModalOpen(true) : undefined}
          secondaryActionLabel={!searchTerm ? 'Generate AI Diagram' : undefined}
          onSecondaryAction={!searchTerm ? () => setIsAiDiagramModalOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((m) => {
            const c = classes.find((cl) => cl.id === m.classId);

            return (
              <div
                key={m.id}
                onClick={() => setViewingMaterial(m)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase">
                          {m.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px] capitalize">
                          {m.type}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-base mt-1.5 leading-snug line-clamp-1 group-hover:text-indigo-600 transition">
                        {m.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {c?.name || 'Class Resource'}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMaterial(m.id);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {(m.chapter || m.topic) && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      {m.chapter && (
                        <span className="font-medium text-slate-700">Ch: {m.chapter}</span>
                      )}
                      {m.chapter && m.topic && <span>•</span>}
                      {m.topic && <span className="text-slate-500 truncate">{m.topic}</span>}
                    </div>
                  )}

                  {m.description && (
                    <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {m.description}
                    </p>
                  )}

                  {/* Thumbnail Preview for Images */}
                  {m.type === 'image' && m.linkUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 aspect-video flex items-center justify-center">
                      <img src={m.linkUrl} alt={m.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                  <span className="font-semibold text-indigo-600 flex items-center gap-1">
                    <span>Open Resource</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Material Reader Drawer */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setViewingMaterial(null)}
          />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl p-6 flex flex-col z-10 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Study Resource
                </span>
                <h3 className="font-bold text-slate-900 text-base">{viewingMaterial.title}</h3>
              </div>
              <button
                onClick={() => setViewingMaterial(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold uppercase">
                  {viewingMaterial.subject}
                </span>
                {viewingMaterial.chapter && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    Chapter: {viewingMaterial.chapter}
                  </span>
                )}
                {viewingMaterial.topic && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    Topic: {viewingMaterial.topic}
                  </span>
                )}
              </div>

              {viewingMaterial.description && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {viewingMaterial.description}
                </p>
              )}

              {/* Image Preview */}
              {viewingMaterial.type === 'image' && viewingMaterial.linkUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                  <img
                    src={viewingMaterial.linkUrl}
                    alt={viewingMaterial.title}
                    className="w-full object-contain max-h-[400px] bg-slate-900/5"
                  />
                </div>
              )}

              {/* Content Text */}
              {viewingMaterial.content && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {viewingMaterial.content}
                </div>
              )}

              {/* Link / URL */}
              {viewingMaterial.linkUrl && viewingMaterial.type !== 'image' && (
                <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-between">
                  <span className="text-xs font-mono text-indigo-700 truncate max-w-xs">
                    {viewingMaterial.linkUrl}
                  </span>
                  <a
                    href={viewingMaterial.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition"
                  >
                    <span>Visit Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Diagram Generator Modal (gemini-3-pro-image-preview with 1K, 2K, 4K resolution) */}
      {isAiDiagramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    AI Visual Study Aid Generator
                  </h3>
                  <p className="text-xs text-slate-400">
                    Powered by Gemini Pro Image model with configurable resolution.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiDiagramModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Educational Diagram Prompt
                </label>
                <textarea
                  rows={3}
                  value={diagramPrompt}
                  onChange={(e) => setDiagramPrompt(e.target.value)}
                  placeholder="e.g. Cross-section of human heart with valves and blood flow arrows labeled..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Resolution (1K, 2K, 4K) & Aspect Ratio Affordances */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Image Resolution (Affordance)
                  </label>
                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    {(['1K', '2K', '4K'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setImageSize(sz)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          imageSize === sz
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aspect Ratio
                  </label>
                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    {(['1:1', '4:3', '16:9'] as const).map((ar) => (
                      <button
                        key={ar}
                        type="button"
                        onClick={() => setAspectRatio(ar)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          aspectRatio === ar
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {ar}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Trigger */}
              <button
                type="button"
                onClick={handleGenerateDiagram}
                disabled={isGeneratingDiagram || !diagramPrompt.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingDiagram ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing {imageSize} Diagram...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate High-Quality Visual Diagram</span>
                  </>
                )}
              </button>

              {/* Error */}
              {diagramError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {diagramError}
                </div>
              )}

              {/* Output Preview */}
              {generatedDiagramUrl && (
                <div className="space-y-3 pt-2">
                  <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-900/5 max-h-72 flex items-center justify-center">
                    <img
                      src={generatedDiagramUrl}
                      alt="Generated diagram"
                      className="max-h-72 object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">
                      Generated at {imageSize} ({aspectRatio})
                    </span>
                    <button
                      type="button"
                      onClick={handleAttachDiagramAsMaterial}
                      disabled={isSubmitting || classes.length === 0}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer"
                    >
                      Attach as Study Material
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI High Thinking Problem Explainer Modal (gemini-3.1-pro-preview with ThinkingLevel.HIGH) */}
      {isAiThinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    High Thinking Concept & Problem Solver
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gemini 3.1 Pro Preview with High Thinking Level for rigorous step-by-step reasoning.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiThinkModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Domain
                </label>
                <input
                  type="text"
                  value={thinkSubject}
                  onChange={(e) => setThinkSubject(e.target.value)}
                  placeholder="e.g. Organic Chemistry, Calculus, Microeconomics"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Complex Question or Curriculum Concept
                </label>
                <textarea
                  rows={3}
                  value={thinkQuery}
                  onChange={(e) => setThinkQuery(e.target.value)}
                  placeholder="Enter the complex problem, theorem, or student confusion to analyze..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <button
                type="button"
                onClick={handleDeepThink}
                disabled={isThinking || !thinkQuery.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isThinking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Engaging Deep Reasoning Engine...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>Execute High Thinking Analysis</span>
                  </>
                )}
              </button>

              {thinkError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {thinkError}
                </div>
              )}

              {thinkSolution && (
                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto font-mono">
                    {thinkSolution}
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleSaveThinkAsNotes}
                      disabled={isSubmitting || classes.length === 0}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer"
                    >
                      Save Analysis to Class Notes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Material Upload / Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Upload Study Material</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add class notes, chapter documents, or external resources.
            </p>

            <form onSubmit={handleCreateMaterial} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Material Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 3 Summary & Formula Cheat Sheet"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign to Class *
                  </label>
                  <select
                    required
                    value={classId}
                    onChange={(e) => handleClassSelect(e.target.value)}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Resource Format *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as StudyMaterial['type'])}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 capitalize"
                  >
                    <option value="notes">Notes / Text</option>
                    <option value="pdf">PDF Document Link</option>
                    <option value="link">Web Reference</option>
                    <option value="youtube">YouTube Lecture</option>
                    <option value="image">Diagram / Image</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chapter Name
                  </label>
                  <input
                    type="text"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    placeholder="e.g. Chapter 4: Kinetics"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Topic</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Rate Constants"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {type !== 'notes' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Resource Link / URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://... (Google Drive, YouTube, or direct PDF link)"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lecture Notes Content
                  </label>
                  <textarea
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type or paste study guide, key formulas, or lesson notes..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brief Overview
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key review points for the upcoming quiz..."
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
                  {isSubmitting ? 'Saving...' : 'Add Study Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
