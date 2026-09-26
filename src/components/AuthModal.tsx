import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  Phone,
  School,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { db } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  initialMode?: 'login' | 'register';
  prefilledJoinCode?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'teacher',
  initialMode = 'login',
  prefilledJoinCode,
}) => {
  const {
    signInWithGoogle,
    registerWithEmail,
    loginWithEmail,
    resetPassword,
    error,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classesList, setClassesList] = useState<{ id: string; name: string; subject: string; teacherId: string; joinCode: string }[]>([]);
  const [instituteName, setInstituteName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const fetchClasses = async () => {
      try {
        const { getDocs, collection, query, where } = await import('firebase/firestore');
        const q = query(collection(db, 'classes'), where('status', '==', 'active'));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            subject: data.subject,
            teacherId: data.teacherId,
            joinCode: data.joinCode || '',
          };
        });
        setClassesList(list);
        if (list.length > 0) {
          const preselected = prefilledJoinCode
            ? list.find((c) => c.joinCode.trim().toLowerCase() === prefilledJoinCode.trim().toLowerCase())
            : null;
          if (preselected) {
            setSelectedClassId(preselected.id);
          } else {
            setSelectedClassId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching classes for student auth signup:', err);
      }
    };
    fetchClasses();
  }, [isOpen, prefilledJoinCode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (mode === 'forgot') {
      if (!email.trim()) {
        setFormError('Please enter your email address.');
        return;
      }
      try {
        setIsSubmitting(true);
        await resetPassword(email.trim());
        setResetSent(true);
      } catch (err: unknown) {
        const error = err as Error;
        setFormError(error.message || 'Failed to send reset email.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Unified Registration Flow
    if (mode === 'register') {
      if (!displayName.trim()) {
        setFormError('Full name is required.');
        return;
      }
      if (!email.trim()) {
        setFormError('Email address is required.');
        return;
      }
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }
      if (role === 'student' && !gender) {
        setFormError('Please select your gender.');
        return;
      }

      try {
        setIsSubmitting(true);
        await registerWithEmail(
          email.trim(),
          password,
          displayName.trim(),
          role,
          phone.trim(),
          role === 'teacher' ? instituteName.trim() : undefined
        );

        // Additional fields for student
        if (role === 'student') {
          const { auth } = await import('../firebase');
          const currentUid = auth.currentUser?.uid;
          if (currentUid) {
            const { doc, setDoc, addDoc, collection } = await import('firebase/firestore');
            
            // Update gender in the user doc
            await setDoc(doc(db, 'users', currentUid), {
              gender: gender,
            }, { merge: true });

            // Automatically enroll in selected class if specified
            if (selectedClassId) {
              const chosenClass = classesList.find((c) => c.id === selectedClassId);
              if (chosenClass) {
                const newEnrollment = {
                  teacherId: chosenClass.teacherId,
                  classId: chosenClass.id,
                  studentId: currentUid,
                  studentName: displayName.trim(),
                  studentEmail: email.trim().toLowerCase(),
                  studentPhone: phone.trim(),
                  gender: gender,
                  status: 'active' as const,
                  joinedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                };
                await addDoc(collection(db, 'enrollments'), newEnrollment);

                // Create teacher notification
                await addDoc(collection(db, 'notifications'), {
                  recipientId: chosenClass.teacherId,
                  senderId: currentUid,
                  title: 'New Student Enrolled!',
                  message: `${displayName.trim()} registered and joined ${chosenClass.name}.`,
                  type: 'material',
                  relatedId: chosenClass.id,
                  read: false,
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
        }
        onClose();
      } catch (err: unknown) {
        const error = err as Error;
        setFormError(error.message || 'Registration failed.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Unified Login Flow
    if (!email.trim() || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await loginWithEmail(email.trim(), password);
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      clearError();
      await signInWithGoogle(role);
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error.message || 'Google authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-md shadow-indigo-500/20 mb-3">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {mode === 'login'
              ? 'Welcome to TutorFlow'
              : mode === 'register'
              ? 'Create your Account'
              : 'Reset Password'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {mode === 'login'
              ? 'Sign in to access your classes, students & materials'
              : mode === 'register'
              ? 'Join TutorFlow to manage tuition or access classes'
              : 'Enter your registered email to receive a password reset link'}
          </p>
        </div>

        {/* Role Selector Tabs (Only on Register or Login) */}
        {mode !== 'forgot' && (
          <div className="flex p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                role === 'teacher'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <School className="w-4 h-4" />
              Teacher / Tutor
            </button>
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                role === 'student'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              Student
            </button>
          </div>
        )}

        {/* Prefilled Join Code Notice */}
        {prefilledJoinCode && role === 'student' && (
          <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Joining with invitation code: <strong>{prefilledJoinCode}</strong>
            </span>
          </div>
        )}

        {/* Google 1-Click Sign-In */}
        {mode !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-white px-2.5 text-slate-400 font-semibold tracking-wider">
                  Or with email
                </span>
              </div>
            </div>
          </>
        )}

        {/* Error Notification */}
        {(formError || error) && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{formError || error}</span>
          </div>
        )}

        {/* Reset Confirmation Notice */}
        {mode === 'forgot' && resetSent ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-3">
            <p className="font-semibold text-sm text-emerald-900">Password Reset Email Sent!</p>
            <p>Check your inbox for instructions to reset your password.</p>
            <button
              onClick={() => {
                setResetSent(false);
                setMode('login');
              }}
              className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Registration specific fields */}
            {mode === 'register' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={role === 'teacher' ? 'e.g. Alex Morgan' : 'e.g. Maya Chen'}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                  </div>
                </div>

                {/* Teacher specific: Institute Name */}
                {role === 'teacher' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Institute / Coaching Academy Name
                    </label>
                    <div className="relative">
                      <School className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={instituteName}
                        onChange={(e) => setInstituteName(e.target.value)}
                        placeholder="e.g. Apex Mathematics Academy"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                      />
                    </div>
                  </div>
                )}

                {/* Student specific: Gender dropdown */}
                {role === 'student' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gender *
                    </label>
                    <select
                      required
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}

                {/* Student specific: Class selection dropdown */}
                {role === 'student' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Initial Class Batch *
                    </label>
                    <select
                      required
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    >
                      {classesList.length === 0 ? (
                        <option value="">No Active Classes Available</option>
                      ) : (
                        classesList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} — {c.subject}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>

            {/* Password Fields */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Password *</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (only on Register) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'Sign In to TutorFlow'
                      : mode === 'register'
                      ? 'Create TutorFlow Account'
                      : 'Send Reset Link'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Toggle Mode Footer */}
        <div className="mt-5 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setMode('register');
                }}
                className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Sign up free
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setMode('login');
                }}
                className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
