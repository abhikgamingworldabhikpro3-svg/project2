import React, { useState } from 'react';
import {
  Check,
  Globe,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  Save,
  School,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const TeacherSettingsView: React.FC<{ onSwitchToStudentMode?: () => void }> = ({
  onSwitchToStudentMode,
}) => {
  const {
    currentUser,
    teacherProfile,
    userProfile,
    updateTeacherSettings,
    resetPassword,
    logout,
  } = useAuth();

  const [displayName, setDisplayName] = useState(teacherProfile?.displayName || '');
  const [instituteName, setInstituteName] = useState(teacherProfile?.instituteName || '');
  const [phone, setPhone] = useState(teacherProfile?.phone || '');
  const [address, setAddress] = useState(teacherProfile?.address || '');
  const [currency, setCurrency] = useState(teacherProfile?.currency || '$');
  const [timeZone, setTimeZone] = useState(
    teacherProfile?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [academicYear, setAcademicYear] = useState(teacherProfile?.academicYear || '2026-2027');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setIsSaving(true);
      await updateTeacherSettings({
        displayName: displayName.trim(),
        instituteName: instituteName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        currency,
        timeZone,
        academicYear: academicYear.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!currentUser?.email) return;
    try {
      await resetPassword(currentUser.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Institute & Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure your tuition center details, billing currency, and security credentials.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Card 1: Profile & Institute Information */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <School className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Tuition Academy Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teacher Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institute / Academy Brand Name
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physical Center Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 104 Academic Avenue, Suite 2B, Springfield"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Card 2: Regional & Academic Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">System & Billing Defaults</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receipt Currency
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
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone</label>
              <input
                type="text"
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          {savedSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <Check className="w-4 h-4" />
              Settings updated successfully!
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Card 3: Security & Session */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">Security & Access</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-100">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">Password Management</h4>
            <p className="text-xs text-slate-500">
              Send a secure password reset link to your registered email address.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSendPasswordReset}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition"
          >
            {resetSent ? 'Reset Email Sent!' : 'Send Password Reset Link'}
          </button>
        </div>

        {/* Student View Switcher */}
        {onSwitchToStudentMode && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-100">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">Preview Student Portal</h4>
              <p className="text-xs text-slate-500">
                Experience TutorFlow from the perspective of an enrolled student.
              </p>
            </div>
            <button
              type="button"
              onClick={onSwitchToStudentMode}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-200 transition"
            >
              Switch to Student View
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-rose-700">Account Session</h4>
            <p className="text-xs text-slate-500">Log out securely from this browser session.</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
