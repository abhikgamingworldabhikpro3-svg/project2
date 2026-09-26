import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  History,
  Plus,
  Printer,
  Receipt,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ClassItem, Enrollment, FeeRecord, Payment } from '../types';
import { ReceiptModal } from '../components/ReceiptModal';
import { EmptyState } from '../components/EmptyState';

export const FeesView: React.FC = () => {
  const { currentUser, teacherProfile } = useAuth();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partially_paid' | 'paid' | 'overdue'>(
    'all'
  );

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeRecord | null>(null);
  const [viewingReceiptPayment, setViewingReceiptPayment] = useState<Payment | null>(null);

  // Invoice Form Fields
  const [feeTitle, setFeeTitle] = useState('October 2026 Tuition Fee');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [feeType, setFeeType] = useState<FeeRecord['feeType']>('monthly');
  const [totalPayable, setTotalPayable] = useState<number>(150);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment Form Fields
  const [paymentAmount, setPaymentAmount] = useState<number>(150);
  const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('cash');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const currency = teacherProfile?.currency || '$';
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    const unsubClasses = onSnapshot(
      query(collection(db, 'classes'), where('teacherId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassItem));
        setClasses(list);
        if (list.length > 0 && !classId) setClassId(list[0].id);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'classes')
    );

    const unsubEnroll = onSnapshot(
      query(collection(db, 'enrollments'), where('teacherId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enrollment));
        setEnrollments(list);
        if (list.length > 0 && !studentId) setStudentId(list[0].studentId);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'enrollments')
    );

    const unsubFees = onSnapshot(
      query(collection(db, 'fees'), where('teacherId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeeRecord));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setFees(list);
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'fees')
    );

    const unsubPayments = onSnapshot(
      query(collection(db, 'payments'), where('teacherId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPayments(list);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'payments')
    );

    return () => {
      unsubClasses();
      unsubEnroll();
      unsubFees();
      unsubPayments();
    };
  }, [currentUser]);

  // Create Fee Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !feeTitle.trim() || !classId || !studentId) return;

    try {
      setIsSubmitting(true);
      const student = enrollments.find((e) => e.studentId === studentId);
      const studentName = student ? student.studentName : 'Enrolled Student';

      const newFee: Omit<FeeRecord, 'id'> = {
        teacherId: currentUser.uid,
        classId,
        studentId,
        studentName,
        title: feeTitle.trim(),
        feeType,
        totalPayable: Number(totalPayable),
        amountPaid: 0,
        remainingAmount: Number(totalPayable),
        dueDate,
        status: dueDate < todayStr ? 'overdue' : 'pending',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'fees'), newFee);
      setIsInvoiceModalOpen(false);
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.CREATE, 'fees');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Payment modal for a fee
  const handleOpenRecordPayment = (fee: FeeRecord) => {
    setSelectedFeeForPayment(fee);
    setPaymentAmount(fee.remainingAmount);
    setPaymentMethod('cash');
    setTransactionId('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  // Record Payment
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedFeeForPayment || paymentAmount <= 0) return;

    try {
      setIsSubmitting(true);
      const receiptNumber = `TF-REC-${Date.now().toString().slice(-6)}`;
      const paidDate = new Date().toISOString().split('T')[0];

      const newPayment: Omit<Payment, 'id'> = {
        feeId: selectedFeeForPayment.id,
        teacherId: currentUser.uid,
        classId: selectedFeeForPayment.classId,
        studentId: selectedFeeForPayment.studentId,
        studentName: selectedFeeForPayment.studentName,
        amount: Number(paymentAmount),
        paymentDate: paidDate,
        method: paymentMethod,
        transactionId: transactionId.trim() || undefined,
        receiptNumber,
        notes: paymentNotes.trim() || undefined,
        recordedBy: teacherProfile?.displayName || 'TutorFlow Teacher',
        createdAt: new Date().toISOString(),
      };

      const paymentDoc = await addDoc(collection(db, 'payments'), newPayment);

      // Update fee record
      const newPaid = (selectedFeeForPayment.amountPaid || 0) + Number(paymentAmount);
      const newRemaining = Math.max(0, selectedFeeForPayment.totalPayable - newPaid);
      const newStatus =
        newRemaining === 0 ? 'paid' : newPaid > 0 ? 'partially_paid' : 'pending';

      await updateDoc(doc(db, 'fees', selectedFeeForPayment.id), {
        amountPaid: newPaid,
        remainingAmount: newRemaining,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // Show receipt immediately
      setIsPaymentModalOpen(false);
      setViewingReceiptPayment({ id: paymentDoc.id, ...newPayment });
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.CREATE, 'payments');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFee = async (id: string) => {
    if (!window.confirm('Delete this fee invoice?')) return;
    try {
      await deleteDoc(doc(db, 'fees', id));
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.DELETE, `fees/${id}`);
    }
  };

  // Totals
  const totalInvoiced = fees.reduce((acc, f) => acc + (f.totalPayable || 0), 0);
  const totalCollected = fees.reduce((acc, f) => acc + (f.amountPaid || 0), 0);
  const totalOutstanding = fees.reduce((acc, f) => acc + (f.remainingAmount || 0), 0);

  // Filtered fees
  const filteredFees = fees.filter((f) => {
    const isOverdue = f.status === 'overdue' || (f.status === 'pending' && f.dueDate < todayStr);
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'overdue'
        ? isOverdue
        : f.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      f.title.toLowerCase().includes(term) || f.studentName.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Fee Management & Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create fee structures, record transactions, and generate official receipts.
          </p>
        </div>

        <button
          onClick={() => setIsInvoiceModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Fee Invoice</span>
        </button>
      </div>

      {/* 3 Metric Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl glass-card shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Invoiced</span>
          <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums font-mono">
            {currency}
            {totalInvoiced.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400">{fees.length} active fee records</span>
        </div>

        <div className="p-5 rounded-3xl glass-card shadow-xs">
          <span className="text-xs font-semibold text-emerald-600">Total Collected</span>
          <p className="text-2xl font-black text-emerald-600 mt-1 tabular-nums font-mono">
            {currency}
            {totalCollected.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400">{payments.length} transactions recorded</span>
        </div>

        <div className="p-5 rounded-3xl glass-card shadow-xs">
          <span className="text-xs font-semibold text-rose-500">Outstanding Balance</span>
          <p className="text-2xl font-black text-rose-600 mt-1 tabular-nums font-mono">
            {currency}
            {totalOutstanding.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400">
            {fees.filter((f) => f.remainingAmount > 0).length} pending payments
          </span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-card p-3 rounded-2xl shadow-xs">
        <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Fee Invoices ({fees.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Payment Log ({payments.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student or title..."
              className="w-full pl-9 pr-3 py-1 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {activeTab === 'invoices' && (
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | 'pending' | 'partially_paid' | 'paid' | 'overdue')
              }
              className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid in Full</option>
              <option value="overdue">Overdue</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Content: Invoices Table or Payments History */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading fee records...</div>
      ) : activeTab === 'invoices' ? (
        filteredFees.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={searchTerm ? 'No matching fee invoices' : 'No fee records created yet'}
            description={
              searchTerm
                ? 'Try clearing the search query or changing the status filter.'
                : 'Create monthly, admission, or course fee invoices for your students.'
            }
            actionLabel={!searchTerm ? 'Create Fee Invoice' : undefined}
            onAction={!searchTerm ? () => setIsInvoiceModalOpen(true) : undefined}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Fee Item & Student</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Remaining</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredFees.map((fee) => {
                    const isOverdue =
                      fee.status === 'overdue' || (fee.status === 'pending' && fee.dueDate < todayStr);

                    return (
                      <tr key={fee.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{fee.title}</span>
                          <span className="text-[11px] text-slate-500">{fee.studentName}</span>
                        </td>
                        <td className="py-3.5 px-4 capitalize text-slate-600">{fee.feeType}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {currency}
                          {fee.totalPayable.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-600">
                          {currency}
                          {fee.amountPaid.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-rose-600">
                          {currency}
                          {fee.remainingAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={
                              isOverdue ? 'text-rose-600 font-semibold flex items-center gap-1' : ''
                            }
                          >
                            {fee.dueDate}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              fee.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isOverdue
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : fee.status === 'partially_paid'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {fee.status === 'paid'
                              ? 'Paid'
                              : isOverdue
                              ? 'Overdue'
                              : fee.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {fee.remainingAmount > 0 && (
                              <button
                                onClick={() => handleOpenRecordPayment(fee)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer"
                              >
                                Record Payment
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteFee(fee.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                              title="Delete fee invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        )
      ) : (
        /* Payments History Log */
        payments.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No payments recorded yet"
            description="When you record fee collections, verified transaction receipts will appear here."
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Txn Ref</th>
                    <th className="py-3 px-4 text-right">Official Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.studentName}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600 text-sm">
                        {currency}
                        {p.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 capitalize">{p.method.replace('_', ' ')}</td>
                      <td className="py-3 px-4 text-slate-500">{p.paymentDate}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {p.transactionId || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewingReceiptPayment(p)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedFeeForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-0.5">Record Fee Payment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Student: <strong>{selectedFeeForPayment.studentName}</strong> (Remaining:{' '}
              {currency}
              {selectedFeeForPayment.remainingAmount.toLocaleString()})
            </p>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount ({currency}) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedFeeForPayment.remainingAmount}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as Payment['method'])}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 capitalize"
                >
                  <option value="cash">Cash in hand</option>
                  <option value="upi">UPI / Instant Mobile Payment</option>
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction / Reference ID
                  <span className="text-[11px] font-normal text-slate-400 ml-1.5">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. UPI-9284729103 or Check #301"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid in full for Q4"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer"
                >
                  {isSubmitting ? 'Recording...' : 'Record Payment & Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Fee Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create Fee Invoice</h3>
            <p className="text-xs text-slate-500 mb-4">
              Issue a tuition fee charge to an enrolled student.
            </p>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fee Title *
                </label>
                <input
                  type="text"
                  required
                  value={feeTitle}
                  onChange={(e) => setFeeTitle(e.target.value)}
                  placeholder="e.g. October 2026 Tuition Fee"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    required
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student *
                  </label>
                  <select
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    {enrollments
                      .filter((en) => !classId || en.classId === classId)
                      .map((en) => (
                        <option key={en.studentId} value={en.studentId}>
                          {en.studentName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fee Category
                  </label>
                  <select
                    value={feeType}
                    onChange={(e) => setFeeType(e.target.value as FeeRecord['feeType'])}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 capitalize"
                  >
                    <option value="monthly">Monthly Tuition</option>
                    <option value="course">Full Course Fee</option>
                    <option value="admission">Admission Fee</option>
                    <option value="custom">Custom Lab / Exam Fee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={totalPayable}
                    onChange={(e) => setTotalPayable(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || enrollments.length === 0}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {viewingReceiptPayment && (
        <ReceiptModal
          payment={viewingReceiptPayment}
          fee={fees.find((f) => f.id === viewingReceiptPayment.feeId)}
          teacherProfile={teacherProfile}
          onClose={() => setViewingReceiptPayment(null)}
        />
      )}
    </div>
  );
};
