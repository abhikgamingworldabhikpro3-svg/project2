import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Copy,
  GraduationCap,
  School,
  Sparkles,
  X,
} from 'lucide-react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ClassItem } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassCreated?: (cls: ClassItem) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onClassCreated,
}) => {
  const { currentUser, teacherProfile, updateTeacherSettings } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Institute Settings
  const [instituteName, setInstituteName] = useState(
    teacherProfile?.instituteName || `${teacherProfile?.displayName || 'My'} Academy`
  );
  const [currency, setCurrency] = useState(teacherProfile?.currency || '$');
  const [academicYear, setAcademicYear] = useState('2026-2027');

  // Step 2: First Class Creation
  const [className, setClassName] = useState('Grade 10 Mathematics');
  const [subject, setSubject] = useState('Mathematics');
  const [batchName, setBatchName] = useState('Morning Batch A');
  const [schedule, setSchedule] = useState('Mon, Wed, Fri (4:00 PM - 5:30 PM)');
  const [maxStudents, setMaxStudents] = useState<number>(30);

  // Step 3: Invitation info
  const [createdClass, setCreatedClass] = useState<ClassItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSaveInstitute = async () => {
    try {
      setIsSubmitting(true);
      await updateTeacherSettings({
        instituteName: instituteName.trim(),
        currency,
        academicYear,
      });
      setStep(2);
    } catch (err: unknown) {
      console.error('Error saving institute settings:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateFirstClass = async () => {
    try {
      setIsSubmitting(true);
      const joinCode = generateJoinCode();
      const newClassData = {
        teacherId: currentUser.uid,
        name: className.trim(),
        subject: subject.trim(),
        batchName: batchName.trim(),
        schedule: schedule.trim(),
        maxStudents: Number(maxStudents) || 30,
        status: 'active' as const,
        joinCode,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'classes'), newClassData);
      const newClass: ClassItem = { id: docRef.id, ...newClassData };
      setCreatedClass(newClass);
      if (onClassCreated) onClassCreated(newClass);
      setStep(3);
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.CREATE, 'classes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const joinUrl = createdClass
    ? `${window.location.origin}?join=${createdClass.joinCode}`
    : '';

  const handleCopyLink = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Tracker */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              TF
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900">Educator Onboarding</span>
              <p className="text-[11px] text-slate-500">Step {step} of 3</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-6 h-1.5 rounded-full transition-colors ${
                  s === step
                    ? 'bg-indigo-600'
                    : s < step
                    ? 'bg-emerald-500'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Institute Profile */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <School className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Set Up Your Tuition Center</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize your institute name and currency for payment receipts.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institute or Coaching Brand Name
                </label>
                <input
                  type="text"
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  placeholder="e.g. Apex Mathematics Academy"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Currency Symbol
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="$">$ (USD)</option>
                    <option value="₹">₹ (INR)</option>
                    <option value="£">£ (GBP)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="C$">C$ (CAD)</option>
                    <option value="A$">A$ (AUD)</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2026-2027"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 flex items-center justify-between border-t border-slate-100">
              <button
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Skip for now
              </button>
              <button
                onClick={handleSaveInstitute}
                disabled={isSubmitting || !instituteName.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: First Class */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Create Your First Class</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set up a tuition batch to start enrolling students right away.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class / Course Name
                  </label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="e.g. Physics 101"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Physics"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g. Evening Batch"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Capacity
                  </label>
                  <input
                    type="number"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(parseInt(e.target.value) || 30)}
                    min={1}
                    max={500}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schedule Details
                </label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="e.g. Mon, Wed, Fri 4:00 PM"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="mt-6 pt-3 flex items-center justify-between border-t border-slate-100">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleCreateFirstClass}
                disabled={isSubmitting || !className.trim() || !subject.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create & Get Join Code</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Share Join Code & Complete */}
        {step === 3 && createdClass && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">Your First Class is Live!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Share this secure code or link with your students. Once they join, they'll immediately
              appear in your roster.
            </p>

            {/* Code Highlight Box */}
            <div className="my-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col items-center">
              <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-widest">
                Student Join Code
              </span>
              <p className="font-mono text-3xl font-extrabold text-indigo-900 tracking-widest my-1">
                {createdClass.joinCode}
              </p>
              <p className="text-[11px] text-slate-500">
                Class: {createdClass.name} ({createdClass.subject})
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50/50 text-indigo-700 text-xs font-semibold transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copiedLink ? 'Link Copied!' : 'Copy Invitation Link'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
