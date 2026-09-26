import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OnboardingModal } from './components/OnboardingModal';
import { LandingPage } from './views/LandingPage';
import { TeacherDashboard } from './views/TeacherDashboard';
import { ClassesView } from './views/ClassesView';
import { StudentsView } from './views/StudentsView';
import { AttendanceView } from './views/AttendanceView';
import { AssignmentsView } from './views/AssignmentsView';
import { StudyMaterialsView } from './views/StudyMaterialsView';
import { FirebaseStorageView } from './views/FirebaseStorageView';
import { FeesView } from './views/FeesView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { ReportsView } from './views/ReportsView';
import { TeacherSettingsView } from './views/TeacherSettingsView';
import { StudentPortal } from './views/StudentPortal';
import { ClassItem } from './types';

function MainApp() {
  const { currentUser, userProfile, teacherProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [studentPreviewMode, setStudentPreviewMode] = useState(false);

  // Check URL query param for join code: ?join=XXXXXX
  const [urlJoinCode, setUrlJoinCode] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const join = params.get('join');
    if (join) {
      setUrlJoinCode(join.toUpperCase());
    }
  }, []);

  // Show onboarding for brand new teachers
  useEffect(() => {
    if (
      userProfile?.role === 'teacher' &&
      teacherProfile &&
      !localStorage.getItem(`tf_onboarded_${teacherProfile.id}`)
    ) {
      // Prompt onboarding once
      setOnboardingOpen(true);
      localStorage.setItem(`tf_onboarded_${teacherProfile.id}`, 'true');
    }
  }, [userProfile, teacherProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold animate-pulse shadow-lg">
            TF
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce" />
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading TutorFlow...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, render public Landing Page
  if (!currentUser) {
    return <LandingPage initialJoinCode={urlJoinCode} />;
  }

  // Student Experience
  if (userProfile?.role === 'student' || studentPreviewMode) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        {studentPreviewMode && (
          <div className="bg-amber-500 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between shadow-xs">
            <span>Viewing as Student (Teacher Preview Mode)</span>
            <button
              onClick={() => setStudentPreviewMode(false)}
              className="px-2.5 py-0.5 rounded bg-white text-amber-800 font-bold text-[11px] hover:bg-amber-50 cursor-pointer"
            >
              Exit Student Preview
            </button>
          </div>
        )}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <StudentPortal />
        </main>
        <OfflineIndicator />
      </div>
    );
  }

  // Teacher Experience
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenOnboarding={() => setOnboardingOpen(true)}
      />

      <div className="flex-1 flex w-full">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden pb-24 md:pb-8">
          <div key={activeTab} className="smooth-tab-entry">
            {activeTab === 'dashboard' && (
              <TeacherDashboard
                setActiveTab={setActiveTab}
                onOpenCreateClass={() => setActiveTab('classes')}
                onOpenInviteStudent={() => setActiveTab('students')}
              />
            )}

            {activeTab === 'classes' && <ClassesView />}

            {activeTab === 'students' && <StudentsView />}

            {activeTab === 'attendance' && <AttendanceView />}

            {activeTab === 'assignments' && <AssignmentsView />}

            {activeTab === 'materials' && <StudyMaterialsView />}

            {activeTab === 'storage' && <FirebaseStorageView />}

            {activeTab === 'fees' && <FeesView />}

            {activeTab === 'announcements' && <AnnouncementsView />}

            {activeTab === 'reports' && <ReportsView />}

            {activeTab === 'settings' && (
              <TeacherSettingsView
                onSwitchToStudentMode={() => setStudentPreviewMode(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Onboarding Wizard */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onClassCreated={() => setActiveTab('classes')}
      />

      {/* Offline Status Warning */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
