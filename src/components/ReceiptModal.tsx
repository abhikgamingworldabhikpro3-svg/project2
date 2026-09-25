import React from 'react';
import { Download, Printer, ShieldCheck, X } from 'lucide-react';
import { FeeRecord, Payment, TeacherProfile } from '../types';

interface ReceiptModalProps {
  payment: Payment;
  fee?: FeeRecord;
  teacherProfile?: TeacherProfile | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  fee,
  teacherProfile,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const currency = teacherProfile?.currency || '$';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-w-none print:w-full">
        {/* Modal Header Actions (hidden in print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Payment Receipt
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="pt-4 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  TF
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {teacherProfile?.instituteName || 'TutorFlow Academy'}
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {teacherProfile?.address || 'Official Coaching Center'}
              </p>
              {teacherProfile?.phone && (
                <p className="text-xs text-slate-500">Phone: {teacherProfile.phone}</p>
              )}
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-bold border border-emerald-200">
                {payment.receiptNumber}
              </span>
              <p className="mt-1.5 text-xs text-slate-400 font-medium">
                Date: {payment.paymentDate}
              </p>
            </div>
          </div>

          {/* Student & Payment Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Student Name
              </span>
              <p className="font-semibold text-slate-800 text-sm mt-0.5">{payment.studentName}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Fee Category / Item
              </span>
              <p className="font-semibold text-slate-800 text-sm mt-0.5">
                {fee?.title || 'Tuition Fee'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Payment Method
              </span>
              <p className="font-medium text-slate-700 capitalize mt-0.5">
                {payment.method.replace('_', ' ')}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Transaction ID
              </span>
              <p className="font-mono text-slate-700 mt-0.5">
                {payment.transactionId || 'N/A (Cash/Direct)'}
              </p>
            </div>
          </div>

          {/* Amount Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 px-3">
                    {fee?.title || 'Course Fee Payment'}
                    {payment.notes ? ` (${payment.notes})` : ''}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium">
                    {currency}
                    {payment.amount.toLocaleString()}
                  </td>
                </tr>
                {fee && (
                  <>
                    <tr className="bg-slate-50/50 text-slate-500">
                      <td className="py-2 px-3">Total Payable</td>
                      <td className="py-2 px-3 text-right">
                        {currency}
                        {fee.totalPayable.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/50 text-slate-500">
                      <td className="py-2 px-3">Previously Paid</td>
                      <td className="py-2 px-3 text-right">
                        {currency}
                        {Math.max(0, fee.amountPaid - payment.amount).toLocaleString()}
                      </td>
                    </tr>
                  </>
                )}
                <tr className="bg-indigo-50/60 font-bold text-slate-900 border-t border-indigo-100">
                  <td className="py-3 px-3 text-indigo-950">Amount Paid Now</td>
                  <td className="py-3 px-3 text-right text-indigo-700 text-sm">
                    {currency}
                    {payment.amount.toLocaleString()}
                  </td>
                </tr>
                {fee && (
                  <tr className="text-slate-600 font-medium">
                    <td className="py-2.5 px-3">Remaining Balance</td>
                    <td className="py-2.5 px-3 text-right">
                      {currency}
                      {fee.remainingAmount.toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer & Authenticity Badge */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Payment Record</span>
            </div>
            <div>Recorded by: {payment.recordedBy}</div>
          </div>
        </div>

        {/* Action Buttons in Modal (hidden in print) */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download / Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
