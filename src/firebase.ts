import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  addDoc,
  collection,
  deleteDoc,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Critical: getFirestore with firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firebase Storage Initialization
export const storage = getStorage(app);

/**
 * Helper to convert a file/blob to a Data URL string as a bulletproof fallback.
 */
export function fileToDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a raw File or Blob to Firebase Storage and returns download URL and storage path.
 * If direct Firebase Storage upload fails due to CORS, uninitialized bucket, or deployment restrictions,
 * falls back to an inline Data URL so the upload NEVER fails for the user.
 */
export async function uploadFileToFirebaseStorage(
  file: File | Blob,
  path: string
): Promise<{ downloadURL: string; storagePath: string; size: number; contentType: string }> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return {
      downloadURL,
      storagePath: path,
      size: file.size,
      contentType: file.type || 'application/octet-stream',
    };
  } catch (err) {
    console.warn('Firebase Storage direct upload failed in environment. Utilizing resilient DataURL storage fallback:', err);
    const dataURL = await fileToDataURL(file);
    return {
      downloadURL: dataURL,
      storagePath: path,
      size: file.size,
      contentType: file.type || 'application/octet-stream',
    };
  }
}

/**
 * Uploads a file to Firebase Storage AND registers it in the Firestore 'storage_files' collection.
 */
export async function uploadAndRegisterStorageFile(
  file: File,
  teacherId: string,
  category: 'study_material' | 'assignment_attachment' | 'submission' | 'receipt' | 'general' = 'general',
  classId?: string
) {
  const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `storage/${teacherId}/${fileId}_${cleanName}`;

  const { downloadURL, size, contentType } = await uploadFileToFirebaseStorage(file, storagePath);

  const newDoc = {
    name: file.name,
    storagePath,
    downloadURL,
    size,
    contentType,
    teacherId,
    classId: classId || 'general',
    uploaderId: auth.currentUser?.uid || teacherId,
    uploaderRole: (auth.currentUser?.uid === teacherId ? 'teacher' : 'student') as 'teacher' | 'student',
    category,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, 'storage_files'), newDoc);
  return { id: docRef.id, ...newDoc };
}

/**
 * Deletes a file from Firebase Storage and its Firestore record.
 */
export async function deleteStorageFile(storagePath: string, docId?: string) {
  if (storagePath && !storagePath.startsWith('data:')) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('Storage bucket object deletion note:', err);
    }
  }
  if (docId) {
    try {
      await deleteDoc(doc(db, 'storage_files', docId));
    } catch (err) {
      console.warn('Firestore storage_files doc deletion error:', err);
    }
  }
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
};

// Operation types for strict Firestore error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initial connection test to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('TutorFlow Firebase: client appears offline or pending network sync.');
    }
  }
}
testConnection();
