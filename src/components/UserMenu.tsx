import React, { useState, useRef, useEffect } from 'react';
import { User, logOut, deleteAccount } from '../firebase';
import { Cloud, CloudCheck, CloudUpload, LogOut, ChevronDown, UserCheck, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';

interface UserMenuProps {
  user: User | null;
  syncStatus: 'synced' | 'syncing' | 'error' | 'idle';
  onOpenAuth: () => void;
  onManualSync: () => void;
}

export default function UserMenu({ user, syncStatus, onOpenAuth, onManualSync }: UserMenuProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await logOut();
      setDropdownOpen(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const needsPassword = !!user?.providerData.some((p) => p.providerId === 'password');

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      await deleteAccount(needsPassword ? deletePassword : undefined);
      setDeleteOpen(false);
      setDropdownOpen(false);
      setDeletePassword('');
    } catch (err: any) {
      console.error('Delete account error:', err);
      setDeleteError(
        err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential'
          ? 'That password was not accepted. Try again.'
          : err?.message || 'Account deletion failed. Please try again.'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-200/60 text-zinc-700 text-xs font-medium backdrop-blur-xs border border-zinc-200/80">
          <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
          <span>Guest Session</span>
        </div>
        <button
          type="button"
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Sign In / Save</span>
        </button>
      </div>
    );
  }

  // User is logged in
  const initials = (user.displayName || user.email || 'U')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-white/80 bg-white/50 backdrop-blur-md border border-zinc-200/80 transition-all cursor-pointer shadow-xs"
      >
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.displayName || 'Profile'} 
            className="w-7 h-7 rounded-lg object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {initials}
          </div>
        )}
        
        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold text-zinc-800 leading-none truncate max-w-[130px]">
            {user.displayName || user.email?.split('@')[0]}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {syncStatus === 'syncing' ? (
              <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                <CloudUpload className="w-3 h-3 animate-bounce" /> Syncing
              </span>
            ) : syncStatus === 'error' ? (
              <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-zinc-400" /> Unsynced
              </span>
            ) : (
              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Synced
              </span>
            )}
          </div>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
      </button>

      {/* Dropdown Menu - Frosted Glassmorphism */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 glass-panel rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-zinc-200/60 mb-1">
            <p className="text-xs font-bold text-zinc-900 truncate">{user.displayName || 'User Account'}</p>
            <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
              <Cloud className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Firebase Cloud Storage Active</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onManualSync();
              setDropdownOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100/70 rounded-lg transition-colors text-left cursor-pointer"
          >
            <CloudUpload className="w-4 h-4 text-blue-600" />
            <span>Sync Plan to Cloud Now</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900 rounded-lg transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-zinc-500" />
            <span>Sign Out (Switch to Guest)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDeleteError('');
              setDeletePassword('');
              setDeleteOpen(true);
              setDropdownOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>Delete Account</span>
          </button>
        </div>
      )}

      {/* Delete account confirmation */}
      {deleteOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-zinc-900">Delete your account?</h3>
            <p className="mt-2 text-sm text-zinc-600">
              This permanently deletes your EqualiF.I. account and your cloud-saved plan
              data. This cannot be undone.
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Deleting your account does <strong>not</strong> cancel a Google Play
              subscription. To stop future charges, cancel it in{' '}
              <a
                href="https://play.google.com/store/account/subscriptions"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-700 underline"
              >
                Google Play &gt; Subscriptions
              </a>{' '}
              before deleting.
            </p>

            {needsPassword && (
              <div className="mt-4">
                <label htmlFor="delete-account-password" className="text-xs font-semibold text-zinc-700">
                  Confirm your password
                </label>
                <input
                  id="delete-account-password"
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  placeholder="Password"
                />
              </div>
            )}

            {deleteError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
              >
                Keep account
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || (needsPassword && !deletePassword)}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Deleting…' : 'Delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
