import React, { Component } from 'react';
import {
  Bell,
  ChevronLeft,
  Home as HomeIcon,
  ShieldAlert,
  Tv,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { FirestoreErrorInfo } from '../../lib/error';
import { View } from '../../types';

export const LoadingSpinner = ({ label = 'Loading content...' }: { label?: string }) => (
  <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-border/70 bg-card/70 px-6 py-12 text-center shadow-[var(--shadow-md)] backdrop-blur-xl">
    <div className="mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--accent-soft)] border-t-[var(--accent)]" />
    <p className="text-sm font-semibold text-muted">{label}</p>
  </div>
);

export const Header = ({
  title,
  showBack,
  onBack,
  rightElement,
  hasNotification,
}: {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  hasNotification?: boolean;
}) => (
  <header className="sticky top-0 z-40 -mx-4 border-b border-border/60 bg-background/75 px-4 py-4 backdrop-blur-2xl md:-mx-6 md:px-6">
    <div className="page-shell !w-full !max-w-[1200px] !p-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {showBack ? (
            <button
              onClick={onBack}
              className="secondary-button !p-3"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}
          <div className="min-w-0">
            <p className="section-label mb-1">HomeTheatre</p>
            <h1 className="truncate text-2xl font-extrabold tracking-[-0.05em] md:text-4xl">{title}</h1>
          </div>
        </div>
        {rightElement || (
          <button className="secondary-button relative !p-3" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {hasNotification ? (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[var(--danger)]" />
            ) : null}
          </button>
        )}
      </div>
    </div>
  </header>
);

const navItems: Array<{ view: View; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { view: 'home', label: 'Home', icon: HomeIcon },
  { view: 'social', label: 'Social', icon: Users },
  { view: 'watch', label: 'Watch', icon: Tv },
  { view: 'profile', label: 'Profile', icon: UserIcon },
];

export const BottomNav = ({
  activeView,
  setView,
  notificationCount,
}: {
  activeView: View;
  setView: (v: View) => void;
  notificationCount?: number;
}) => (
  <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4 md:px-6 md:pb-6">
    <nav className="pointer-events-auto mx-auto flex w-full max-w-3xl items-center justify-between gap-2 rounded-[1.75rem] border border-border/80 bg-card/90 p-2 shadow-[var(--shadow-lg)] backdrop-blur-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = activeView === item.view;

        return (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={cn(
              'relative flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[1.1rem] px-3 py-3 text-sm font-semibold transition-all md:justify-start md:px-4',
              active
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5',
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline">{item.label}</span>
          </button>
        );
      })}
      <button
        onClick={() => setView('notifications')}
        className={cn(
          'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] transition-all',
          activeView === 'notifications'
            ? 'bg-[var(--accent)] text-white shadow-[0_12px_30px_rgba(15,111,255,0.28)]'
            : 'bg-background text-foreground border border-border/80',
        )}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {notificationCount ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1.5 text-[10px] font-bold text-white">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        ) : null}
      </button>
    </nav>
  </div>
);

type ErrorState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = 'We hit an unexpected app error.';
      let errorDetail: string | null = 'Refreshing the app usually gets things back on track.';

      try {
        const parsed = JSON.parse(this.state.error?.message || '');
        if (parsed.operationType) {
          const info = parsed as FirestoreErrorInfo;
          if (info.error.includes('permission-denied')) {
            errorMessage = 'Security rules blocked this action.';
            errorDetail = `You do not have permission to ${info.operationType} at ${info.path}.`;
          } else {
            errorMessage = `Firestore ${info.operationType.toLowerCase()} failed.`;
            errorDetail = `Path: ${info.path}. Error: ${info.error}`;
          }
        }
      } catch {
        if (this.state.error?.message) {
          errorDetail = this.state.error.message;
        }
      }

      return (
        <div className="app-shell flex min-h-screen items-center justify-center">
          <div className="hero-panel max-w-xl rounded-[2rem] p-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--danger)]/10 text-[var(--danger)]">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h1 className="mb-3 text-3xl font-extrabold tracking-[-0.05em]">{errorMessage}</h1>
            <p className="mx-auto mb-8 max-w-md text-sm leading-6 text-muted">{errorDetail}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button onClick={() => window.location.reload()} className="primary-button">
                Refresh App
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="secondary-button"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
