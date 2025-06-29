// app/settings/page.tsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext'; // Ensure this import is correct
import axios from 'axios';
import toast from 'react-hot-toast';

// --- Type Definitions ---
interface LoginSession {
  id: string;
  device: string;
  location: string;
  lastLogin: string;
}

// --- NEW: Notification Settings Interface ---
interface NotificationSettings {
  comments: boolean;
  follows: boolean;
  likes: boolean;
  messages: boolean;
}

// --- NEW: Notifications Settings Component ---
const NotificationsSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    comments: true,
    follows: true,
    likes: true,
    messages: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { data: session } = useSession();
  const { getDynamicThemeClass } = useTheme(); // Use getDynamicThemeClass from context

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session) return;
      try {
        setLoading(true);
        // CALL THE UNIFIED USER SETTINGS API
        const response = await axios.get('/api/user/settings');
        // Extract only notificationSettings from the response
        setSettings(response.data.notificationSettings || { comments: true, follows: true, likes: true, messages: true });
      } catch (error) {
        console.error('Failed to fetch notification settings:', error);
        toast.error('Failed to load notification settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [session]);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    
    // Optimistically update UI
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: checked,
    }));

    try {
      setSaving(true);
      // CALL THE UNIFIED USER SETTINGS API WITH ONLY THE NOTIFICATION SETTINGS
      await axios.put('/api/user/settings', {
        notificationSettings: {
          ...settings, // Current state of all notification settings
          [name]: checked, // Override the one that changed
        }
      });
      toast.success('Notification settings updated!');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      toast.error('Failed to save settings. Please try again.');
      // Revert UI on error
      setSettings(prevSettings => ({
        ...prevSettings,
        [name]: !checked,
      }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-xl`} style={{ backgroundColor: getDynamicThemeClass('background-secondary'), border: `1px solid ${getDynamicThemeClass('border-color')}` }}>
        <p style={{ color: getDynamicThemeClass('text-primary') }}>Loading notification settings...</p>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl`} style={{ backgroundColor: getDynamicThemeClass('background-secondary'), border: `1px solid ${getDynamicThemeClass('border-color')}` }}>
      <h2 className="text-lg font-medium mb-6" style={{ color: getDynamicThemeClass('text-primary') }}>Notification Preferences</h2>

      <div className="space-y-6">
        {/* Comment Notifications */}
        <div className="flex items-center justify-between">
          <label htmlFor="comments" className="text-base font-medium cursor-pointer" style={{ color: getDynamicThemeClass('text-secondary') }}>
            Comments on my posts
          </label>
          <input
            type="checkbox"
            id="comments"
            name="comments"
            checked={settings.comments}
            onChange={handleChange}
            disabled={saving}
            className="h-5 w-5 rounded focus:ring-2"
            style={{
              backgroundColor: getDynamicThemeClass('input-background'),
              border: `1px solid ${getDynamicThemeClass('input-border')}`,
              accentColor: getDynamicThemeClass('accent-color'),
            } as React.CSSProperties}
          />
        </div>

        {/* Follow Notifications */}
        <div className="flex items-center justify-between">
          <label htmlFor="follows" className="text-base font-medium cursor-pointer" style={{ color: getDynamicThemeClass('text-secondary') }}>
            New followers
          </label>
          <input
            type="checkbox"
            id="follows"
            name="follows"
            checked={settings.follows}
            onChange={handleChange}
            disabled={saving}
            className="h-5 w-5 rounded focus:ring-2"
            style={{
              backgroundColor: getDynamicThemeClass('input-background'),
              border: `1px solid ${getDynamicThemeClass('input-border')}`,
              accentColor: getDynamicThemeClass('accent-color'),
            } as React.CSSProperties}
          />
        </div>

        {/* Like Notifications */}
        <div className="flex items-center justify-between">
          <label htmlFor="likes" className="text-base font-medium cursor-pointer" style={{ color: getDynamicThemeClass('text-secondary') }}>
            Likes on my content
          </label>
          <input
            type="checkbox"
            id="likes"
            name="likes"
            checked={settings.likes}
            onChange={handleChange}
            disabled={saving}
            className="h-5 w-5 rounded focus:ring-2"
            style={{
              backgroundColor: getDynamicThemeClass('input-background'),
              border: `1px solid ${getDynamicThemeClass('input-border')}`,
              accentColor: getDynamicThemeClass('accent-color'),
            } as React.CSSProperties}
          />
        </div>

        {/* Messages Notifications */}
        <div className="flex items-center justify-between">
          <label htmlFor="messages" className="text-base font-medium cursor-pointer" style={{ color: getDynamicThemeClass('text-secondary') }}>
            Direct messages
          </label>
          <input
            type="checkbox"
            id="messages"
            name="messages"
            checked={settings.messages}
            onChange={handleChange}
            disabled={saving}
            className="h-5 w-5 rounded focus:ring-2"
            style={{
              backgroundColor: getDynamicThemeClass('input-background'),
              border: `1px solid ${getDynamicThemeClass('input-border')}`,
              accentColor: getDynamicThemeClass('accent-color'),
            } as React.CSSProperties}
          />
        </div>

        <p className="text-sm mt-8" style={{ color: getDynamicThemeClass('text-secondary-faded') }}>
          Changes are saved automatically.
          {saving && <span className="ml-2 text-[var(--accent-color)]">Saving...</span>}
        </p>
      </div>
    </div>
  );
};


// --- Main Settings Page Component ---
export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, getDynamicThemeClass } = useTheme(); // Make sure useTheme is correctly returning getDynamicThemeClass

  const [activeTab, setActiveTab] = useState("account");

  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [showDeactivationConfirm, setShowDeactivationConfirm] = useState(false);
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push('/login');
    } else {
      setProfileName(session.user.name || '');
      setProfileBio(session.user.bio || '');
      setProfileAvatar(session.user.image || session.user.avatar || '');
    }
    setLoginSessions([
      { id: '1', device: 'Chrome on Windows', location: 'Jaipur, India', lastLogin: new Date().toISOString() },
      { id: '2', device: 'Safari on iPhone', location: 'Delhi, India', lastLogin: new Date(Date.now() - 86400000).toISOString() },
    ]);

  }, [session, status, router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setSaving(true);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      setSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-current-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: currentPassword, newPassword: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error during password change:', response.status, data.message);
        toast.error(data.message || 'Failed to change password. Please try again.');
        setPasswordError(data.message || 'Failed to change password. Please try again.');
      } else {
        console.log('Password updated successfully:', data.message);
        toast.success('Password updated successfully!');
        setPasswordError('Password updated successfully!'); // Optional: Display success message in error div
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error('Client-side network error changing password:', error);
      toast.error('An unexpected error occurred. Please try again later.');
      setPasswordError('An unexpected error occurred. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  const handleForgotPassword = useCallback(() => {
    toast('Forgot password functionality will be implemented soon!');
  }, []);

  const handleDeactivateAccount = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/deactivate', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Deactivation API Error:', data.message);
        toast.error(`Failed to deactivate account: ${data.message}`);
      } else {
        console.log('Account deactivated successfully:', data.message);
        toast.success(data.message);
        await signOut({ callbackUrl: '/' });
      }
    } catch (error) {
      console.error('Client-side error during deactivation:', error);
      toast.error('An unexpected error occurred during deactivation. Please try again.');
    } finally {
      setSaving(false);
      setShowDeactivationConfirm(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Logout All API Error:', data.message);
        toast.error(`Failed to log out from all devices: ${data.message}`);
      } else {
        console.log('Logged out from all devices successfully:', data.message);
        toast.success(data.message);
        await signOut({ callbackUrl: '/' });
      }
    } catch (error) {
      console.error('Client-side error during logout-all:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="lg:col-span-1">
              <div className={`p-6 rounded-xl mb-8`} style={{ backgroundColor: getDynamicThemeClass('background-secondary'), border: `1px solid ${getDynamicThemeClass('border-color')}` }}>
                <h2 className="text-lg font-medium mb-6" style={{ color: getDynamicThemeClass('text-primary') }}>Change Password</h2>
                <form onSubmit={handlePasswordChange}>
                  <div className="mb-4">
                    <label htmlFor="currentPassword" className="block text-sm font-medium mb-2" style={{ color: getDynamicThemeClass('text-secondary') }}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: getDynamicThemeClass('input-background'),
                        border: `1px solid ${getDynamicThemeClass('input-border')}`,
                        color: getDynamicThemeClass('text-primary'),
                        '--tw-ring-color': getDynamicThemeClass('accent-color'),
                      } as React.CSSProperties}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="newPassword" className="block text-sm font-medium mb-2" style={{ color: getDynamicThemeClass('text-secondary') }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: getDynamicThemeClass('input-background'),
                        border: `1px solid ${getDynamicThemeClass('input-border')}`,
                        color: getDynamicThemeClass('text-primary'),
                        '--tw-ring-color': getDynamicThemeClass('accent-color'),
                      } as React.CSSProperties}
                      required
                      minLength={8}
                    />
                    <p className="text-xs mt-1" style={{ color: getDynamicThemeClass('text-secondary-faded') }}>
                      Password must be at least 8 characters
                    </p>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: getDynamicThemeClass('text-secondary') }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: getDynamicThemeClass('input-background'),
                        border: `1px solid ${getDynamicThemeClass('input-border')}`,
                        color: getDynamicThemeClass('text-primary'),
                        '--tw-ring-color': getDynamicThemeClass('accent-color'),
                      } as React.CSSProperties}
                      required
                    />
                  </div>
                  <AnimatePresence>
                    {passwordError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4 p-3 rounded-lg text-sm"
                        style={{ backgroundColor: getDynamicThemeClass('error-background'), color: getDynamicThemeClass('error-color'), border: `1px solid ${getDynamicThemeClass('error-border')}` }}
                      >
                        {passwordError}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="mt-6 flex flex-col sm:flex-row justify-between items-center">
                    {/* Update Password Button */}
                    <motion.button
                      type="submit"
                      disabled={saving}
                      // Updated className for consistent button size and appearance
                      className="px-5 py-2.5 font-medium rounded-lg shadow-lg transition-all transform duration-300 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
                      style={{
                        backgroundColor: getDynamicThemeClass('accent-color'),
                        color: 'white',
                        border: `2px solid ${getDynamicThemeClass('accent-color')}`,
                        boxShadow: `0 4px 10px ${getDynamicThemeClass('shadow-color-subtle') || 'rgba(0,0,0,0.1)'}`
                      }}
                      onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg');
                          e.currentTarget.style.color = getDynamicThemeClass('text-primary');
                          e.currentTarget.style.borderColor = getDynamicThemeClass('active-bg');
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color');
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.borderColor = getDynamicThemeClass('accent-color');
                        }
                      }}
                      whileHover={!saving ? { scale: 1.02, boxShadow: `0 8px 20px ${getDynamicThemeClass('shadow-color-subtle') || 'rgba(0,0,0,0.2)'}` } : {}}
                      whileTap={!saving ? { scale: 0.98 } : {}}
                    >
                      {saving ? 'Updating...' : 'Update Password'}
                    </motion.button>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="mt-4 sm:mt-0 text-sm font-medium transition-colors duration-200 underline
                      text-[color:var(--accent-color)] hover:text-[color:var(--accent-color-hover)]"
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>
              </div>

              <div className={`p-6 rounded-xl`} style={{ backgroundColor: getDynamicThemeClass('background-secondary'), border: `1px solid ${getDynamicThemeClass('border-color')}` }}>
                <h2 className="text-lg font-medium mb-4" style={{ color: getDynamicThemeClass('text-primary') }}>Account Information</h2>
                <div className="mt-4">
                  <p className="text-sm mb-1" style={{ color: getDynamicThemeClass('text-secondary') }}>Email</p>
                  <p className="font-medium" style={{ color: getDynamicThemeClass('text-primary') }}>{session?.user?.email || 'N/A'}</p>
                </div>
                <div className="mt-8">
                  <h3 className="text-sm font-medium mb-4" style={{ color: getDynamicThemeClass('error-color') }}>Danger Zone</h3>
                  {/* Deactivate Account Button */}
                  <motion.button
                    type="button"
                    onClick={() => setShowDeactivationConfirm(true)}
                    disabled={saving}
                    // Updated className for consistent button size and appearance
                    className="px-5 py-2.5 font-medium rounded-lg shadow-lg transition-all transform duration-300 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
                    style={{
                      backgroundColor: getDynamicThemeClass('danger-button-bg'),
                      color: getDynamicThemeClass('danger-button-text'),
                      border: `2px solid ${getDynamicThemeClass('danger-button-bg')}`,
                      boxShadow: `0 4px 10px ${getDynamicThemeClass('shadow-color-subtle') || 'rgba(0,0,0,0.1)'}`
                    }}
                    onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = getDynamicThemeClass('danger-button-hover-bg');
                          e.currentTarget.style.color = getDynamicThemeClass('danger-button-hover-text') || 'white';
                          e.currentTarget.style.borderColor = getDynamicThemeClass('danger-button-hover-bg');
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = getDynamicThemeClass('danger-button-bg');
                          e.currentTarget.style.color = getDynamicThemeClass('danger-button-text');
                          e.currentTarget.style.borderColor = getDynamicThemeClass('danger-button-bg');
                        }
                    }}
                    whileHover={!saving ? { scale: 1.02, boxShadow: `0 8px 20px ${getDynamicThemeClass('shadow-color-subtle') || 'rgba(0,0,0,0.2)'}` } : {}}
                    whileTap={!saving ? { scale: 0.98 } : {}}
                  >
                    Deactivate Account
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className={`p-6 rounded-xl`} style={{ backgroundColor: getDynamicThemeClass('background-secondary'), border: `1px solid ${getDynamicThemeClass('border-color')}` }}>
                <h2 className="text-lg font-medium mb-6" style={{ color: getDynamicThemeClass('text-primary') }}>Login Activity</h2>
                {loginSessions.length > 0 ? (
                  <div className="space-y-4">
                    {loginSessions.map((sessionItem) => (
                      <div key={sessionItem.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg"
                        style={{ backgroundColor: getDynamicThemeClass('input-background'), border: `1px solid ${getDynamicThemeClass('input-border')}` }}>
                        <div>
                          <p className="font-medium" style={{ color: getDynamicThemeClass('text-primary') }}>{sessionItem.device}</p>
                          <p className="text-sm" style={{ color: getDynamicThemeClass('text-secondary') }}>
                            {new Date(sessionItem.lastLogin).toLocaleString()} &bull; {sessionItem.location}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: getDynamicThemeClass('text-secondary') }}>No active login sessions found.</p>
                )}
                <div className="mt-8">
                  {/* Log out from all devices Button */}
                  <motion.button
                    type="button"
                    onClick={handleLogoutAllDevices}
                    disabled={saving}
                    // Updated className for consistent button size and appearance
                    className="px-5 py-2.5 font-medium rounded-lg shadow-lg transition-all transform duration-300 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
                    style={{
                      backgroundColor: getDynamicThemeClass('button-secondary-bg'),
                      color: getDynamicThemeClass('button-secondary-text'),
                      border: `2px solid ${getDynamicThemeClass('button-secondary-border')}`,
                      boxShadow: `0 4px 10px ${getDynamicThemeClass('shadow-color-subtle') || 'rgba(0,0,0,0.1)'}`
                    }}
                    onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = getDynamicThemeClass('button-secondary-hover-bg');
                          e.currentTarget.style.color = getDynamicThemeClass('button-secondary-hover-text') || getDynamicThemeClass('button-secondary-text');
                          e.currentTarget.style.borderColor = getDynamicThemeClass('button-secondary-hover-bg');
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = getDynamicThemeClass('button-secondary-bg');
                          e.currentTarget.style.color = getDynamicThemeClass('button-secondary-text');
                          e.currentTarget.style.borderColor = getDynamicThemeClass('button-secondary-border');
                        }
                    }}
                    whileHover={!saving ? { scale: 1.02, boxShadow: `0 8px 20px ${getDynamicThemeClass('shadow-color-subtle') || 'rgba(0,0,0,0.2)'}` } : {}}
                    whileTap={!saving ? { scale: 0.98 } : {}}
                  >
                    {saving ? 'Logging out...' : 'Log out from all devices'}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return <NotificationsSettings />;

      default:
        return null;
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen" style={{ backgroundColor: getDynamicThemeClass('background-primary'), color: getDynamicThemeClass('text-primary') }}>
        Loading settings...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen" style={{ backgroundColor: getDynamicThemeClass('background-primary'), color: getDynamicThemeClass('text-primary') }}>
        Redirecting to login...
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8`} style={{ backgroundColor: getDynamicThemeClass('background-primary'), color: getDynamicThemeClass('text-primary') }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <nav className="mb-8 border-b" style={{ borderColor: getDynamicThemeClass('border-color') }}>
          <button
            onClick={() => setActiveTab("account")}
            className={`py-3 px-6 text-sm font-medium transition-colors duration-200 border-b-2
              ${activeTab === "account" ? 'font-semibold' : 'hover:border-[var(--accent-color-faded)]'}`}
            style={{
              color: activeTab === "account" ? getDynamicThemeClass('accent-color') : getDynamicThemeClass('text-secondary'),
              borderColor: activeTab === "account" ? getDynamicThemeClass('accent-color') : 'transparent',
            }}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`py-3 px-6 text-sm font-medium transition-colors duration-200 border-b-2
              ${activeTab === "notifications" ? 'font-semibold' : 'hover:border-[var(--accent-color-faded)]'}`}
            style={{
              color: activeTab === "notifications" ? getDynamicThemeClass('accent-color') : getDynamicThemeClass('text-secondary'),
              borderColor: activeTab === "notifications" ? getDynamicThemeClass('accent-color') : 'transparent',
            }}
          >
            Notifications
          </button>
        </nav>

        {renderTabContent()}

        <AnimatePresence>
          {showDeactivationConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeactivationConfirm(false)}
            >
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-[var(--background-secondary)] rounded-lg p-6 shadow-xl max-w-sm w-full relative"
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: getDynamicThemeClass('background-secondary'),
                  color: getDynamicThemeClass('text-primary'),
                }}
              >
                <h3 className="text-xl font-semibold mb-4">Deactivate Account</h3>
                <p className="text-[var(--text-secondary)] mb-6">
                  Are you sure you want to deactivate your account? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeactivationConfirm(false)}
                    disabled={saving}
                    className="px-4 py-2 font-medium rounded-lg transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed
                                bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] border-[1px] border-[var(--button-secondary-border)]
                                hover:bg-[var(--button-secondary-hover-bg)]"
                    style={{
                      backgroundColor: getDynamicThemeClass('button-secondary-bg'),
                      color: getDynamicThemeClass('button-secondary-text'),
                      border: `1px solid ${getDynamicThemeClass('button-secondary-border')}`,
                    }}
                  >
                    Cancel
                  </button>
                  {/* Deactivate Button in Confirmation Modal */}
                  <motion.button
                    onClick={handleDeactivateAccount}
                    disabled={saving}
                    // Updated className for consistent button size and appearance
                    className="px-5 py-2.5 font-medium rounded-lg shadow-lg transition-all transform duration-300 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
                    style={{
                      backgroundColor: getDynamicThemeClass('danger-button-bg'),
                      color: getDynamicThemeClass('danger-button-text'),
                      border: `2px solid ${getDynamicThemeClass('danger-button-bg')}`,
                      boxShadow: `0 4px 10px ${getDynamicThemeClass('shadow-color-subtle') || 'rgba(0,0,0,0.1)'}`
                    }}
                    onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = getDynamicThemeClass('danger-button-hover-bg');
                          e.currentTarget.style.color = getDynamicThemeClass('danger-button-hover-text') || 'white';
                          e.currentTarget.style.borderColor = getDynamicThemeClass('danger-button-hover-bg');
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = getDynamicThemeClass('danger-button-bg');
                          e.currentTarget.style.color = getDynamicThemeClass('danger-button-text');
                          e.currentTarget.style.borderColor = getDynamicThemeClass('danger-button-bg');
                        }
                    }}
                    whileHover={!saving ? { scale: 1.02, boxShadow: `0 8px 20px ${getDynamicThemeClass('shadow-color-subtle') || 'rgba(0,0,0,0.2)'}` } : {}}
                    whileTap={!saving ? { scale: 0.98 } : {}}
                  >
                    {saving ? 'Deactivating...' : 'Deactivate'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}