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
  getDocs,
  query,
  where,
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
 * Extracts a clean relative storage path from a raw path string, gs:// URI, or download URL.
 */
export function getCleanStoragePath(input?: string): string | null {
  if (!input || input.startsWith('data:')) return null;

  if (input.includes('/o/')) {
    try {
      const parts = input.split('/o/')[1];
      const pathEncoded = parts.split('?')[0];
      return decodeURIComponent(pathEncoded);
    } catch {
      // fallback
    }
  }

  if (input.startsWith('gs://')) {
    const parts = input.replace('gs://', '').split('/');
    parts.shift(); // remove bucket name
    return parts.join('/');
  }

  return input.startsWith('/') ? input.substring(1) : input;
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
 * Deletes a file from Firebase Storage bucket AND removes all matching metadata records in Firestore ('storage_files').
 */
export async function deleteStorageFile(storagePathOrUrl?: string, docId?: string): Promise<boolean> {
  let objectDeleted = false;
  const cleanPath = getCleanStoragePath(storagePathOrUrl);

  // 1. Delete from Firebase Storage Bucket if cleanPath exists
  if (cleanPath) {
    try {
      const storageRef = ref(storage, cleanPath);
      await deleteObject(storageRef);
      objectDeleted = true;
      console.log(`Firebase Storage: Deleted object at "${cleanPath}"`);
    } catch (err: unknown) {
      console.warn(`Firebase Storage: Note on object deletion for "${cleanPath}":`, err);
    }
  }

  // 2. Delete specific document in 'storage_files' collection if docId is provided
  if (docId) {
    try {
      await deleteDoc(doc(db, 'storage_files', docId));
      console.log(`Firestore: Deleted storage_files doc with id "${docId}"`);
    } catch (err) {
      console.error(`Firestore: Error deleting storage_files doc "${docId}":`, err);
    }
  }

  // 3. Always search 'storage_files' collection for any records matching cleanPath or storagePathOrUrl, and delete them!
  if (cleanPath || storagePathOrUrl) {
    try {
      const storageFilesRef = collection(db, 'storage_files');
      const queriesToRun = [];
      if (cleanPath) {
        queriesToRun.push(query(storageFilesRef, where('storagePath', '==', cleanPath)));
      }
      if (storagePathOrUrl && storagePathOrUrl !== cleanPath) {
        queriesToRun.push(query(storageFilesRef, where('storagePath', '==', storagePathOrUrl)));
        queriesToRun.push(query(storageFilesRef, where('downloadURL', '==', storagePathOrUrl)));
      }

      for (const q of queriesToRun) {
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          if (d.id !== docId) {
            await deleteDoc(doc(db, 'storage_files', d.id));
            console.log(`Firestore: Purged matching storage_files doc "${d.id}"`);
          }
        }
      }
    } catch (err) {
      console.warn('Firestore: Error during storage_files cleanup query:', err);
    }
  }

  return objectDeleted;
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
