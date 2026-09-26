import React, { useState } from 'react';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  School,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ClassItem, Enrollment } from '../types';

interface JoinClassCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingEnrollments: Enrollment[];
  onSuccess?: () => void;
}

export const JoinClassCodeModal: React.FC<JoinClassCodeModalProps> = ({
  isOpen,
  onClose,
  existingEnrollments,
  onSuccess,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successClass, setSuccessClass] = useState<ClassItem | null>(null);

  if (!isOpen) return null;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanCode = joinCode.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMsg('Please enter your 6-character class join code.');
      return;
    }

    if (!currentUser) {
      setErrorMsg('You must be signed in as a student to join a class.');
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Query Firestore for class matching this join code
      const q = query(
        collection(db, 'classes'),
        where('joinCode', '==', cleanCode),
        where('status', '==', 'active')
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setErrorMsg('Invalid join code. Please double-check the code provided by your teacher.');
        return;
      }

      const classDoc = snap.docs[0];
      const classData = { id: classDoc.id, ...classDoc.data() } as ClassItem;

      // 2. Check if student already has an enrollment (active or pending)
      const existing = existingEnrollments.find(
        (en) =>
          en.classId === classData.id &&
          (en.studentId === currentUser.uid ||
            en.studentEmail?.toLowerCase() === currentUser.email?.toLowerCase())
      );

      if (existing) {
        if (existing.status === 'active') {
          setErrorMsg(`You are already an actively enrolled member of "${classData.name}".`);
          return;
        }
        if (existing.status === 'pending') {
          setErrorMsg(
            `You have already submitted a join request for "${classData.name}". It is currently awaiting your teacher's approval.`
          );
          return;
        }
      }

      // 3. Create a pending enrollment in Firestore
      const newEnrollment = {
        teacherId: classData.teacherId,
        classId: classData.id,
        studentId: currentUser.uid,
        studentName: userProfile?.displayName || currentUser.displayName || 'Student',
        studentEmail: currentUser.email?.toLowerCase() || '',
        studentPhone: userProfile?.phone || '',
        gender: userProfile?.gender || 'Male',
        status: 'pending' as const,
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'enrollments'), newEnrollment);

      // 4. Create notification for the teacher
      try {
        await addDoc(collection(db, 'notifications'), {
          recipientId: classData.teacherId,
          senderId: currentUser.uid,
          title: 'New Student Join Request',
          message: `${newEnrollment.studentName} (${newEnrollment.studentEmail}) requested to join ${classData.name} using code ${cleanCode}. Please approve or decline.`,
          type: 'material',
          relatedId: classData.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      } catch (notifyErr) {
        console.warn('Teacher notification failed to send:', notifyErr);
      }

      setSuccessClass(classData);
      setJoinCode('');
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.WRITE, 'enrollments');
      setErrorMsg('Failed to submit join request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccessClass(null);
    setErrorMsg(null);
    setJoinCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-pink-50/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Join Class with Code
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Enter the private code from your tutor
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {successClass ? (
            <div className="py-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                  Request Awaiting Approval
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-2">
                  Join Request Sent to Teacher!
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                  You requested to join <span className="font-extrabold text-indigo-700">{successClass.name}</span> ({successClass.subject}).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Batch Name:</span>
                  <span className="font-bold text-slate-800">{successClass.batchName || 'General Batch'}</span>
                </div>
                {successClass.schedule && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Schedule:</span>
                    <span className="font-bold text-slate-800">{successClass.schedule}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-500">
                  <span>Approval Status:</span>
                  <span className="font-bold text-amber-600">Pending Review</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Once your teacher approves your join request, this class, homework tasks, study notes, and attendance will automatically activate in your dashboard.
              </p>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2.5 animate-in shake duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="font-medium leading-relaxed">{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Class Join Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MATH10 or PHY202"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                  Ask your tutor for their 6-character class code. Only authorized students with valid codes can request to join.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed space-y-1">
                <span className="font-bold flex items-center gap-1 text-indigo-950">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Teacher Approval Required
                </span>
                <p className="text-indigo-700/90 text-[11px]">
                  After you submit your join code, your tutor will review and approve your enrollment before materials and classes are shown.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !joinCode.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Verifying Code...' : 'Submit Join Request'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
