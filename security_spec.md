# TutorFlow Security Specification

## 1. Data Invariants
1. **Teacher Isolation**: A teacher can only create, read, update, and delete classes, attendance records, assignments, fees, payments, study materials, and announcements where `teacherId == request.auth.uid`.
2. **Student Privacy**: A student can only view their own enrollments, attendance records, submissions, fee invoices, payments, and notifications where `studentId == request.auth.uid`.
3. **No Cross-Tenant Leaks**: Teacher A cannot view, query, or mutate Teacher B's students, classes, attendance, fees, or study materials under any circumstance.
4. **Submission Integrity**: A student can only create and update their own submission (`studentId == request.auth.uid`). Only the teacher who owns the class can grade the submission (`marksObtained`, `feedback`, `status: 'graded'`).
5. **Fee & Attendance Lock**: Students have read-only access to their own attendance and fee records. Only the owning teacher can record or mutate attendance and fee payments.
6. **Immutable Fields**: `id`, `teacherId`, `studentId`, `createdAt` cannot be altered after creation.

## 2. The Dirty Dozen Payloads (Targeting Exploits)
1. **Payload 1 (Teacher Impersonation)**: Teacher B creates a class with `teacherId: "teacher_A"`. -> Rejection: `request.resource.data.teacherId != request.auth.uid`.
2. **Payload 2 (Cross-Tenant Attendance Tamper)**: Teacher B attempts to overwrite Teacher A's attendance document. -> Rejection: `resource.data.teacherId != request.auth.uid`.
3. **Payload 3 (Student Grade Forgery)**: Student attempts to update their submission to set `marksObtained: 100` and `status: 'graded'`. -> Rejection: only teacher can update marks/feedback/grading.
4. **Payload 4 (Fee Self-Forgiveness)**: Student attempts to update fee record to `status: 'paid'` and `remainingAmount: 0`. -> Rejection: students cannot write to `/fees/{feeId}`.
5. **Payload 5 (Cross-Student Submission Snooping)**: Student A queries `/submissions` where `studentId == "student_B"`. -> Rejection: student can only list where `resource.data.studentId == request.auth.uid`.
6. **Payload 6 (Shadow Field Injection)**: Teacher attempts to inject `{ isSuperAdmin: true, billingBypass: true }` into a class or user doc. -> Rejection: strict `affectedKeys` and schema validation.
7. **Payload 7 (Unauthenticated Read)**: Anonymous client attempts to read `/teachers` or `/classes`. -> Rejection: `request.auth != null` required.
8. **Payload 8 (Orphaned Write)**: Creating an enrollment with a non-existent or invalid classId. -> Rejection: path and ID validation.
9. **Payload 9 (ID Character Exhaustion / Denial of Wallet)**: Document ID containing 5KB payload. -> Rejection: `isValidId()` enforcing `size() <= 128` and alphanumeric regex.
10. **Payload 10 (Payment Modification)**: Student creates a fake payment receipt. -> Rejection: only teacher can create `/payments/{paymentId}`.
11. **Payload 11 (Cross-Teacher Material Scraping)**: Teacher B attempts to list `/materials` belonging to Teacher A. -> Rejection: `resource.data.teacherId == request.auth.uid`.
12. **Payload 12 (Self-Assigned Admin Role)**: User changes their own role in `/users/{userId}` from `student` to `admin`. -> Rejection: users cannot update their own `role` field.
