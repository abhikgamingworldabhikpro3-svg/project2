import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  File,
  Check,
  Copy,
  ExternalLink,
  Trash2,
  Download,
  Search,
  HardDrive,
  RefreshCw,
  Plus,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
} from 'firebase/firestore';
import {
  db,
  auth,
  uploadAndRegisterStorageFile,
  deleteStorageFile,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { useAuth } from '../context/AuthContext';
import { StorageFile, Class } from '../types';

export const FirebaseStorageView: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Upload modal state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<StorageFile['category']>('study_material');
  const [uploadClassId, setUploadClassId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Subscribe to classes and storage_files collection in Firestore
  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    const unsubClasses = onSnapshot(
      query(collection(db, 'classes'), where('teacherId', '==', uid)),
      (snap) => {
        const clsList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Class));
        setClasses(clsList);
        if (clsList.length > 0 && !uploadClassId) {
          setUploadClassId(clsList[0].id);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'classes')
    );

    const unsubStorage = onSnapshot(
      query(collection(db, 'storage_files'), where('teacherId', '==', uid)),
      (snap) => {
        const fileList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StorageFile));
        fileList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setFiles(fileList);
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'storage_files')
    );

    return () => {
      unsubClasses();
      unsubStorage();
    };
  }, [currentUser]);

  // Upload handler
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedUploadFile) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(null);
      setUploadProgress(40);

      await uploadAndRegisterStorageFile(
        selectedUploadFile,
        currentUser.uid,
        uploadCategory,
        uploadClassId || undefined
      );

      setUploadProgress(100);
      setUploadSuccess(`"${selectedUploadFile.name}" successfully uploaded to Firebase Storage!`);
      setSelectedUploadFile(null);
      // Reset input
      const fileInput = document.getElementById('storage-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setTimeout(() => {
        setUploadProgress(null);
        setUploadSuccess(null);
      }, 3500);
    } catch (err: unknown) {
      const e = err as Error;
      setUploadError(e.message || 'Failed to upload file to Firebase Storage.');
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete handler
  const handleDelete = async (file: StorageFile) => {
    if (!window.confirm(`Are you sure you want to delete "${file.name}" from Firebase Storage?`)) {
      return;
    }

    try {
      setDeletingId(file.id);
      await deleteStorageFile(file.storagePath, file.id);
    } catch (err) {
      console.error('Failed to delete file:', err);
      alert('Failed to delete file from storage.');
    } finally {
      setDeletingId(null);
    }
  };

  // Copy link
  const handleCopyLink = (file: StorageFile) => {
    navigator.clipboard.writeText(file.downloadURL);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Add demo sample files to kickstart the collection if empty
  const handleAddSampleFiles = async () => {
    if (!currentUser) return;
    try {
      setIsUploading(true);
      const sampleFiles = [
        {
          name: 'Physics_Formula_Handbook_2026.pdf',
          storagePath: `storage/${currentUser.uid}/demo_Physics_Formula_Handbook_2026.pdf`,
          downloadURL: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
          size: 1420500,
          contentType: 'application/pdf',
          teacherId: currentUser.uid,
          classId: classes[0]?.id || 'general',
          uploaderId: currentUser.uid,
          uploaderRole: 'teacher' as const,
          category: 'study_material' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          name: 'Algebra_Quadratic_Practice_Set.pdf',
          storagePath: `storage/${currentUser.uid}/demo_Algebra_Quadratic_Practice_Set.pdf`,
          downloadURL: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
          size: 890400,
          contentType: 'application/pdf',
          teacherId: currentUser.uid,
          classId: classes[0]?.id || 'general',
          uploaderId: currentUser.uid,
          uploaderRole: 'teacher' as const,
          category: 'assignment_attachment' as const,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          name: 'Official_Tuition_Fee_Receipt_Template.pdf',
          storagePath: `storage/${currentUser.uid}/demo_Official_Tuition_Fee_Receipt_Template.pdf`,
          downloadURL: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
          size: 450200,
          contentType: 'application/pdf',
          teacherId: currentUser.uid,
          classId: 'general',
          uploaderId: currentUser.uid,
          uploaderRole: 'teacher' as const,
          category: 'receipt' as const,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      for (const sample of sampleFiles) {
        await addDoc(collection(db, 'storage_files'), sample);
      }
    } catch (err) {
      console.error('Failed to add sample files:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Helper formatters
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string, name: string) => {
    if (contentType?.includes('image') || /\.(png|jpe?g|webp|gif|svg)$/i.test(name)) {
      return <ImageIcon className="w-5 h-5 text-sky-500" />;
    }
    if (contentType?.includes('pdf') || /\.pdf$/i.test(name)) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    if (contentType?.includes('sheet') || contentType?.includes('excel') || /\.(xlsx?|csv)$/i.test(name)) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    }
    if (contentType?.includes('zip') || /\.(zip|rar|tar|gz)$/i.test(name)) {
      return <FileArchive className="w-5 h-5 text-amber-500" />;
    }
    if (/\.(ts|tsx|js|jsx|json|html|css|py)$/i.test(name)) {
      return <FileCode className="w-5 h-5 text-indigo-500" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  // Filtered files
  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesClass = selectedClassId === 'all' || f.classId === selectedClassId;
    return matchesSearch && matchesCategory && matchesClass;
  });

  // Calculate storage metrics
  const totalSizeBytes = files.reduce((acc, curr) => acc + (curr.size || 0), 0);
  const studyMaterialsCount = files.filter((f) => f.category === 'study_material').length;
  const assignmentsCount = files.filter((f) => f.category === 'assignment_attachment').length;
  const submissionsCount = files.filter((f) => f.category === 'submission').length;
  const receiptsCount = files.filter((f) => f.category === 'receipt').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-700 font-semibold mb-1">
            <HardDrive className="w-4 h-4" />
            <span>Google Cloud Firebase Storage</span>
            <span className="text-slate-300">·</span>
            <span>Firestore `storage_files` Collection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Firebase Storage Collection
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Direct Cloud Storage repository for lecture slides, past exams, answer keys, worksheets, and payment receipts with real-time Firestore metadata synchronization.
          </p>
        </div>

        {/* Bucket Status & Storage Health */}
        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-900 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <span className="font-bold">Cloud Bucket Active</span>
            <p className="text-[10px] text-slate-500 font-mono">gen-lang-client-0515403403</p>
          </div>
        </div>
      </div>

      {/* Storage Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Files</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
              {files.length}
            </span>
            <span className="text-xs text-slate-400">items</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Live in storage bucket</p>
        </div>

        <div className="glass-card p-5 rounded-2xl shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cloud Space Used</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 tabular-nums">
              {formatBytes(totalSizeBytes)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Fast CDN download speeds</p>
        </div>

        <div className="glass-card p-5 rounded-2xl shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Study Notes & Sheets</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
              {studyMaterialsCount}
            </span>
            <span className="text-xs text-slate-400">notes</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Available to students</p>
        </div>

        <div className="glass-card p-5 rounded-2xl shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignments & Receipts</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
              {assignmentsCount + receiptsCount}
            </span>
            <span className="text-xs text-slate-400">docs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{submissionsCount} student submissions</p>
        </div>
      </div>

      {/* Upload Dropzone Section */}
      <div className="glass-card p-6 rounded-3xl shadow-xs border border-indigo-100/80">
        <div className="flex items-center gap-2 mb-4">
          <UploadCloud className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Upload to Firebase Storage</h2>
        </div>

        <form onSubmit={handleFileUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* File Input Box */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Select File (PDF, Images, Worksheets, Exam Papers)
              </label>
              <div className="relative border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-indigo-50/20 transition-all cursor-pointer">
                <input
                  id="storage-file-input"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedUploadFile(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <UploadCloud className="w-8 h-8 text-indigo-600 mb-2" />
                  {selectedUploadFile ? (
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedUploadFile.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {formatBytes(selectedUploadFile.size)} · {selectedUploadFile.type || 'binary file'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Click or drag file here to upload
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        PDF, DOCX, XLSX, PNG, JPG, ZIP up to 25MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Classification Settings */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Collection Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="study_material">Study Material & Notes</option>
                  <option value="assignment_attachment">Assignment Attachment</option>
                  <option value="receipt">Fee Payment Receipt</option>
                  <option value="submission">Student Submission</option>
                  <option value="general">General Resource</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Class Association
                </label>
                <select
                  value={uploadClassId}
                  onChange={(e) => setUploadClassId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Global / All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.subject})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedUploadFile || isUploading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading to Bucket...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload to Firebase</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress / Status feedback */}
          {uploadProgress !== null && (
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {uploadSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{uploadError}</span>
            </div>
          )}
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-card p-4 rounded-2xl shadow-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search files by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="study_material">Study Materials</option>
            <option value="assignment_attachment">Assignments</option>
            <option value="receipt">Receipts</option>
            <option value="submission">Submissions</option>
            <option value="general">General</option>
          </select>

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none"
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-xs font-semibold cursor-pointer ${
                viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-xs font-semibold cursor-pointer ${
                viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Files Display */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          <p className="text-xs font-semibold">Connecting to Firebase Storage bucket...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-16 px-4 glass-card rounded-3xl border border-slate-200/80">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No files in Firebase Storage</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            {searchQuery
              ? 'No files matched your search or category filters.'
              : 'Upload study handouts, homework sheets, or student fee receipts to store them securely in Google Cloud Storage.'}
          </p>

          {!searchQuery && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleAddSampleFiles}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Add Sample Cloud Files</span>
              </button>
              <label
                htmlFor="storage-file-input"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload First File</span>
              </label>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Display */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => {
            const classObj = classes.find((c) => c.id === file.classId);
            return (
              <div
                key={file.id}
                className="glass-card p-4 rounded-2xl shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {getFileIcon(file.contentType, file.name)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                      {file.category.replace('_', ' ')}
                    </span>
                  </div>

                  <h4
                    className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-indigo-600 transition-colors"
                    title={file.name}
                  >
                    {file.name}
                  </h4>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2 font-mono">
                    <span>{formatBytes(file.size)}</span>
                    <span>·</span>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>

                  {classObj && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md">
                      <span>{classObj.name}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <a
                      href={file.downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Open file in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleCopyLink(file)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Copy Storage URL"
                    >
                      {copiedId === file.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={file.downloadURL}
                      download={file.name}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <button
                    onClick={() => handleDelete(file)}
                    disabled={deletingId === file.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete from Firebase Storage"
                  >
                    {deletingId === file.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Display */
        <div className="glass-card rounded-2xl shadow-xs overflow-hidden border border-slate-200/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFiles.map((file) => {
                  const classObj = classes.find((c) => c.id === file.classId);
                  return (
                    <tr key={file.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            {getFileIcon(file.contentType, file.name)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-xs sm:max-w-md">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {file.storagePath}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                          {file.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-700">
                          {classObj ? classObj.name : 'Global'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                        {formatBytes(file.size)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <a
                            href={file.downloadURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleCopyLink(file)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Copy link"
                          >
                            {copiedId === file.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(file)}
                            disabled={deletingId === file.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete file"
                          >
                            {deletingId === file.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
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
    </div>
  );
};
