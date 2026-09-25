import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { TeacherProfile, UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  teacherProfile: TeacherProfile | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signInWithGoogle: (preferredRole?: UserRole) => Promise<void>;
  registerWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    role: UserRole,
    phone?: string,
    instituteName?: string
  ) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateTeacherSettings: (updates: Partial<TeacherProfile>) => Promise<void>;
  updateStudentProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const loadUserData = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const uData = userSnap.data() as UserProfile;
        setUserProfile(uData);

        if (uData.role === 'teacher') {
          const tRef = doc(db, 'teachers', user.uid);
          const tSnap = await getDoc(tRef);
          if (tSnap.exists()) {
            setTeacherProfile(tSnap.data() as TeacherProfile);
          } else {
            // Create default teacher profile if missing
            const newTProfile: TeacherProfile = {
              id: user.uid,
              teacherId: user.uid,
              displayName: uData.displayName || user.displayName || 'Tutor',
              email: user.email || '',
              phone: uData.phone || '',
              instituteName: `${uData.displayName || 'My'} Tuition Academy`,
              currency: '$',
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
              academicYear: '2026-2027',
              createdAt: new Date().toISOString(),
            };
            await setDoc(tRef, newTProfile);
            setTeacherProfile(newTProfile);
          }
        } else {
          setTeacherProfile(null);
        }
      } else {
        // Fallback if record does not exist
        const role: UserRole = 'teacher';
        const newUProfile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Educator',
          role,
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newUProfile);
        setUserProfile(newUProfile);

        const newTProfile: TeacherProfile = {
          id: user.uid,
          teacherId: user.uid,
          displayName: newUProfile.displayName,
          email: user.email || '',
          instituteName: `${newUProfile.displayName}'s Academy`,
          currency: '$',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          academicYear: '2026-2027',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'teachers', user.uid), newTProfile);
        setTeacherProfile(newTProfile);
      }
    } catch (err: unknown) {
      console.error('Error loading user profile:', err);
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserData(user);
      } else {
        setUserProfile(null);
        setTeacherProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (preferredRole: UserRole = 'teacher') => {
    try {
      setError(null);
      setLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const uProfile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || (preferredRole === 'teacher' ? 'Educator' : 'Student'),
          role: preferredRole,
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, uProfile);
        setUserProfile(uProfile);

        if (preferredRole === 'teacher') {
          const tProfile: TeacherProfile = {
            id: user.uid,
            teacherId: user.uid,
            displayName: uProfile.displayName,
            email: user.email || '',
            instituteName: `${uProfile.displayName}'s Academy`,
            currency: '$',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            academicYear: '2026-2027',
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'teachers', user.uid), tProfile);
          setTeacherProfile(tProfile);
        }
      } else {
        await loadUserData(user);
      }
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Google sign in error:', e);
      setError(e.message || 'Failed to sign in with Google');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    role: UserRole,
    phone?: string,
    instituteName?: string
  ) => {
    try {
      setError(null);
      setLoading(true);
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const user = res.user;

      await firebaseUpdateProfile(user, { displayName });

      const uProfile: UserProfile = {
        id: user.uid,
        email: user.email || email,
        displayName: displayName || 'User',
        role,
        phone: phone || '',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid), uProfile);
      setUserProfile(uProfile);

      if (role === 'teacher') {
        const tProfile: TeacherProfile = {
          id: user.uid,
          teacherId: user.uid,
          displayName,
          email,
          phone: phone || '',
          instituteName: instituteName || `${displayName}'s Academy`,
          currency: '$',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          academicYear: '2026-2027',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'teachers', user.uid), tProfile);
        setTeacherProfile(tProfile);
      }
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Registration error:', e);
      let humanMsg = e.message;
      if (humanMsg.includes('auth/email-already-in-use')) {
        humanMsg = 'This email is already registered. Please sign in instead.';
      } else if (humanMsg.includes('auth/weak-password')) {
        humanMsg = 'Password must be at least 6 characters.';
      } else if (humanMsg.includes('auth/invalid-email')) {
        humanMsg = 'Please enter a valid email address.';
      }
      setError(humanMsg);
      throw new Error(humanMsg);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      setLoading(true);
      const res = await signInWithEmailAndPassword(auth, email, pass);
      await loadUserData(res.user);
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Login error:', e);
      let humanMsg = e.message;
      if (humanMsg.includes('auth/user-not-found') || humanMsg.includes('auth/wrong-password') || humanMsg.includes('auth/invalid-credential')) {
        humanMsg = 'Invalid email or password. Please verify your credentials.';
      } else if (humanMsg.includes('auth/too-many-requests')) {
        humanMsg = 'Too many failed login attempts. Please try again in a few moments.';
      }
      setError(humanMsg);
      throw new Error(humanMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to send password reset email.');
      throw e;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
      setTeacherProfile(null);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to logout');
    }
  };

  const updateTeacherSettings = async (updates: Partial<TeacherProfile>) => {
    if (!currentUser) return;
    try {
      const tRef = doc(db, 'teachers', currentUser.uid);
      const merged = { ...updates, updatedAt: new Date().toISOString() };
      await updateDoc(tRef, merged);
      setTeacherProfile((prev) => (prev ? { ...prev, ...merged } : null));
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.UPDATE, `teachers/${currentUser.uid}`);
    }
  };

  const updateStudentProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const uRef = doc(db, 'users', currentUser.uid);
      const merged = { ...updates, updatedAt: new Date().toISOString() };
      await updateDoc(uRef, merged);
      setUserProfile((prev) => (prev ? { ...prev, ...merged } : null));
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const refreshProfiles = async () => {
    if (currentUser) {
      await loadUserData(currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        teacherProfile,
        loading,
        error,
        clearError,
        signInWithGoogle,
        registerWithEmail,
        loginWithEmail,
        resetPassword,
        logout,
        updateTeacherSettings,
        updateStudentProfile,
        refreshProfiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
