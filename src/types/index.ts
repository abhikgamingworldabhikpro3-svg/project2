export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  gender?: 'Male' | 'Female' | 'Other';
  photoURL?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherProfile {
  id: string;
  teacherId: string;
  displayName: string;
  email: string;
  phone?: string;
  instituteName: string;
  instituteLogo?: string;
  address?: string;
  currency: string; // e.g. '$', '₹', '£', '€'
  timeZone: string;
  academicYear: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClassItem {
  id: string;
  teacherId: string;
  name: string;
  subject: string;
  batchName?: string;
  description?: string;
  schedule?: string;
  startTime?: string;
  endTime?: string;
  days?: string[];
  maxStudents?: number;
  status: 'active' | 'archived';
  joinCode: string;
  createdAt: string;
  updatedAt?: string;
}

export type Class = ClassItem;

export interface Enrollment {
  id: string;
  teacherId: string;
  classId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  dateOfBirth?: string;
  status: 'active' | 'pending' | 'dropped';
  joinedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceStudentEntry {
  status: AttendanceStatus;
  studentName: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string; // `${classId}_${date}_${session}`
  teacherId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  session: string; // e.g. 'Morning Session', 'Regular'
  records: Record<string, AttendanceStudentEntry>; // studentId -> status info
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Assignment {
  id: string;
  teacherId: string;
  classId: string;
  title: string;
  subject: string;
  description: string;
  instructions?: string;
  startDate?: string;
  dueDate: string;
  maxMarks: number;
  attachments?: { name: string; url: string; size?: string }[];
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt?: string;
}

export interface Submission {
  id: string; // `${assignmentId}_${studentId}`
  assignmentId: string;
  classId: string;
  teacherId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submissionText: string;
  attachments?: { name: string; url: string }[];
  status: 'submitted' | 'graded' | 'late';
  marksObtained?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StudyMaterial {
  id: string;
  teacherId: string;
  classId: string;
  title: string;
  subject: string;
  chapter?: string;
  topic?: string;
  description?: string;
  type: 'pdf' | 'image' | 'doc' | 'link' | 'youtube' | 'notes';
  fileUrl?: string;
  linkUrl?: string;
  content?: string;
  storagePath?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface StorageFile {
  id: string;
  name: string;
  storagePath: string;
  downloadURL: string;
  size: number;
  contentType: string;
  teacherId: string;
  classId?: string;
  uploaderId: string;
  uploaderRole: 'teacher' | 'student';
  category: 'study_material' | 'assignment_attachment' | 'submission' | 'receipt' | 'general';
  createdAt: string;
  updatedAt?: string;
}

export interface FeeRecord {
  id: string;
  teacherId: string;
  classId: string;
  studentId: string;
  studentName: string;
  title: string;
  feeType: 'monthly' | 'course' | 'admission' | 'custom';
  totalPayable: number;
  amountPaid: number;
  remainingAmount: number;
  dueDate: string;
  status: 'paid' | 'due';
  createdAt: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  feeId: string;
  teacherId: string;
  classId: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentDate: string;
  method: 'cash' | 'upi' | 'bank_transfer' | 'other';
  transactionId?: string;
  receiptNumber: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Announcement {
  id: string;
  teacherId: string;
  classId: string; // 'all' or classId
  title: string;
  message: string;
  targetAudience: 'all' | 'class';
  publishDate: string;
  expiryDate?: string;
  attachments?: { name: string; url: string }[];
  createdAt: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  senderId?: string;
  title: string;
  message: string;
  type:
    | 'assignment'
    | 'deadline'
    | 'grading'
    | 'material'
    | 'attendance'
    | 'announcement'
    | 'fee_reminder';
  relatedId?: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}
