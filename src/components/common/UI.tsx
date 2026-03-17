import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Bell, 
  Home as HomeIcon, 
  Users, 
  User as UserIcon, 
  ShieldAlert 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { View } from '../../types';
import { FirestoreErrorInfo } from '../../lib/error';

export const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-12">
    <div className="w-8 h-8 border-4 border-[#0A84FF] border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-xs font-medium text-gray-500 animate-pulse">Loading content...</p>
  </div>
);

export const Header = ({ 
  title, 
  showBack, 
  onBack, 
  rightElement, 
  hasNotification 
}: { 
  title: string, 
  showBack?: boolean, 
  onBack?: () => void, 
  rightElement?: React.ReactNode, 
  hasNotification?: boolean 
}) => (
  <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md px-4 pt-6 pb-2">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {showBack && (
          <button onClick={onBack} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {rightElement || (
        <button className="relative p-2 bg-card rounded-full">
          <Bell className="h-5 w-5" />
          {hasNotification && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
          )}
        </button>
      )}
    </div>
  </header>
);

export const BottomNav = ({ 
  activeView, 
  setView, 
  notificationCount 
}: { 
  activeView: View, 
  setView: (v: View) => void, 
  notificationCount?: number 
}) => (
  <nav className="fixed bottom-0 left-0 w-full bg-card/90 backdrop-blur-xl border-t border-border pb-8 px-6 py-3 flex justify-between items-center z-50">
    <button onClick={() => setView('home')} className={cn("flex flex-col items-center gap-1", activeView === 'home' ? "text-[#0A84FF]" : "text-gray-400")}>
      <HomeIcon className="w-6 h-6" />
      <span className="text-[10px] font-medium">Home</span>
    </button>
    <button onClick={() => setView('social')} className={cn("flex flex-col items-center gap-1", activeView === 'social' ? "text-[#0A84FF]" : "text-gray-400")}>
      <Users className="w-6 h-6" />
      <span className="text-[10px] font-medium">Social</span>
    </button>
    <button onClick={() => setView('notifications')} className={cn("flex flex-col items-center gap-1 relative", activeView === 'notifications' ? "text-[#0A84FF]" : "text-gray-400")}>
      <Bell className="w-6 h-6" />
      {notificationCount ? (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-background">
          {notificationCount > 9 ? '9+' : notificationCount}
        </span>
      ) : null}
      <span className="text-[10px] font-medium">Inbox</span>
    </button>
    <button onClick={() => setView('profile')} className={cn("flex flex-col items-center gap-1", activeView === 'profile' ? "text-[#0A84FF]" : "text-gray-400")}>
      <UserIcon className="w-6 h-6" />
      <span className="text-[10px] font-medium">Profile</span>
    </button>
  </nav>
);

export class ErrorBoundary extends (Component as any) {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "We encountered an unexpected error. Please try refreshing the page.";
      let errorDetail = null;

      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.operationType) {
          const info = parsed as FirestoreErrorInfo;
          if (info.error.includes('permission-denied')) {
            errorMessage = "Security Rules Violation";
            errorDetail = `You don't have permission to ${info.operationType} at ${info.path}.`;
          } else {
            errorMessage = `Firestore ${info.operationType} Error`;
            errorDetail = `Error at ${info.path}: ${info.error}`;
          }
        }
      } catch (e) {
        if (this.state.error?.message) {
          errorDetail = this.state.error.message;
        }
      }

      return (
        <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{errorMessage}</h1>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {errorDetail || "We encountered an unexpected error. Please try refreshing the page."}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#0A84FF] text-white px-6 py-2 rounded-full font-bold"
            >
              Refresh App
            </button>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-card px-6 py-2 rounded-full font-bold"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
