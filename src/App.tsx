import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardView } from './components/dashboard/DashboardView';
import { DailyAttendanceView } from './components/attendance/DailyAttendanceView';
import { MonthlyRegisterView } from './components/attendance/MonthlyRegisterView';
import { StudentDirectoryView } from './components/students/StudentDirectoryView';
import { ClassesView } from './components/classes/ClassesView';
import { TeacherAssignmentsView } from './components/teachers/TeacherAssignmentsView';
import { SchoolCalendarView } from './components/calendar/SchoolCalendarView';
import { ReportsView } from './components/reports/ReportsView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { InstitutionSettingsView } from './components/settings/InstitutionSettingsView';
import { ConfirmModal } from './components/common/ConfirmModal';
import { OfflineScreen } from './components/common/OfflineScreen';
import { NavItem } from './types/models';
import { GraduationCap } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

const MainAppContent: React.FC = () => {
  const { user, role, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavItem>('dashboard');
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false);

  // Keep a mutable ref of activeTab so the Capacitor backButton event always reads current state
  const activeTabRef = useRef<NavItem>('dashboard');
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Initialize native features (Status Bar, Splash Screen, Network, Hardware Back Button)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // 1. Configure Status Bar
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#0F172A' }).catch(() => {});

      // 2. Hide Splash Screen smoothly once UI mounts
      SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});
    }

    // 3. Monitor Network Connectivity
    const checkNetworkStatus = async () => {
      try {
        const status = await Network.getStatus();
        setIsOnline(status.connected);
      } catch {
        setIsOnline(navigator.onLine);
      }
    };
    checkNetworkStatus();

    let networkListenerHandle: any = null;
    Network.addListener('networkStatusChange', (status) => {
      setIsOnline(status.connected);
    }).then((h) => {
      networkListenerHandle = h;
    });

    // 4. Android Hardware Back Button Handler
    let backButtonHandle: any = null;
    CapApp.addListener('backButton', () => {
      // If exit modal is open, close it
      if (isExitModalOpen) {
        setIsExitModalOpen(false);
        return;
      }

      // If user is not on dashboard, navigate back to dashboard
      if (activeTabRef.current !== 'dashboard') {
        setActiveTab('dashboard');
      } else {
        // Already on Dashboard -> Show exit confirmation modal
        setIsExitModalOpen(true);
      }
    }).then((h) => {
      backButtonHandle = h;
    });

    return () => {
      if (networkListenerHandle) networkListenerHandle.remove();
      if (backButtonHandle) backButtonHandle.remove();
    };
  }, [isExitModalOpen]);

  const handleRetryConnection = async () => {
    setIsCheckingNetwork(true);
    try {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    } catch {
      setIsOnline(navigator.onLine);
    } finally {
      setTimeout(() => setIsCheckingNetwork(false), 500);
    }
  };

  const handleConfirmExitApp = () => {
    setIsExitModalOpen(false);
    if (Capacitor.isNativePlatform()) {
      CapApp.exitApp();
    }
  };

  if (!isOnline) {
    return (
      <OfflineScreen
        onRetry={handleRetryConnection}
        isChecking={isCheckingNetwork}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-3 shadow-xl animate-pulse">
          <GraduationCap className="w-8 h-8" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Loading Student Attendance Manager...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const isAdmin = role === 'admin';

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'daily-attendance':
        return <DailyAttendanceView />;
      case 'monthly-register':
        return <MonthlyRegisterView />;
      case 'students':
        return <StudentDirectoryView />;
      case 'classes':
        return isAdmin ? <ClassesView /> : <DashboardView />;
      case 'teachers':
        return isAdmin ? <TeacherAssignmentsView /> : <DashboardView />;
      case 'calendar':
        return isAdmin ? <SchoolCalendarView /> : <DashboardView />;
      case 'reports':
        return <ReportsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return isAdmin ? <InstitutionSettingsView /> : <DashboardView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <>
      <AppLayout
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unmarkedCount={0}
      >
        {renderActiveView()}
      </AppLayout>

      {/* Android Hardware Back Button Exit Confirmation */}
      <ConfirmModal
        isOpen={isExitModalOpen}
        title="Exit Student Attendance Manager"
        message="Are you sure you want to exit the application?"
        confirmLabel="Exit App"
        cancelLabel="Stay in App"
        variant="danger"
        onConfirm={handleConfirmExitApp}
        onClose={() => setIsExitModalOpen(false)}
      />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
