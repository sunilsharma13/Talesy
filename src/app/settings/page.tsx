// app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from 'react-hot-toast';

// Types for email preferences
interface EmailPreferences {
  newFollower: boolean;
  newComment: boolean;
  newLike: boolean;
  weeklyDigest: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  // Email notification preferences
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences>({
    newFollower: true,
    newComment: true,
    newLike: true,
    weeklyDigest: true,
  });
  
  // Active tab
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "notifications">("profile");

  // Fetch user data
  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // First, try to get profile data
        const res = await fetch("/api/profile");
        console.log("Profile API Response:", res.status);
        
        if (!res.ok) {
          // If profile API fails, try users/profile API
          console.log("Trying alternative API endpoint");
          const altRes = await fetch("/api/users/profile");
          
          if (!altRes.ok) {
            throw new Error(`Failed to fetch profile: ${altRes.status}`);
          }
          
          const data = await altRes.json();
          
          if (data.user) {
            setName(data.user.name || "");
            setBio(data.user.bio || "");
            setAvatar(data.user.avatar || "");
          }
        } else {
          // Use the original API response if successful
          const data = await res.json();
          
          if (data.user) {
            setName(data.user.name || "");
            setBio(data.user.bio || "");
            setAvatar(data.user.avatar || "");
          }
        }
        
        // Fetch notification preferences
        try {
          const prefRes = await fetch("/api/user/settings");
          
          if (prefRes.ok) {
            const prefData = await prefRes.json();
            if (prefData.emailPreferences) {
              setEmailPreferences(prefData.emailPreferences);
            }
          }
        } catch (prefError) {
          console.error("Error fetching preferences:", prefError);
          // Continue with default preferences if this fails
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        
        // If the API calls fail, initialize with session data
        if (session.user?.name) {
          setName(session.user.name);
        }
        if (session.user?.image) {
          setAvatar(session.user.image);
        }
        
        toast.error("Failed to load your settings");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [session, router]);
  
  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image is too large. Maximum size is 2MB");
      return;
    }
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      setImageUploading(true);
      
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      
      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(errorText || "Failed to upload image");
      }
      
      const uploadData = await uploadRes.json();
      
      // Accept either url or fileUrl from the response
      const imageUrl = uploadData.url || uploadData.fileUrl;
      
      if (!imageUrl) {
        throw new Error("No image URL returned from server");
      }
      
      setAvatar(imageUrl);
      toast.success("Avatar uploaded successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setImageUploading(false);
    }
  };
  
  // Save profile information
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Try both endpoints for compatibility
      let saveSuccess = false;
      
      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            bio,
            avatar
          })
        });
        
        if (res.ok) {
          saveSuccess = true;
        }
      } catch (error) {
        console.error("Error with first profile endpoint:", error);
      }
      
      // If the first endpoint failed, try the alternative
      if (!saveSuccess) {
        const altRes = await fetch("/api/users/profile/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            bio,
            avatar
          })
        });
        
        if (!altRes.ok) {
          throw new Error("Failed to update profile");
        }
        
        saveSuccess = true;
      }
      
      if (saveSuccess) {
        // Notify UI of profile update
        window.dispatchEvent(
          new CustomEvent("profileUpdated", { detail: { name, avatar } })
        );
        
        toast.success("Profile updated successfully");
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };
  
  // Change password
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    
    try {
      setSaving(true);
      
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to change password");
      }
      
      // Reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast.success("Password changed successfully");
    } catch (error: any) {
      console.error("Error changing password:", error);
      setPasswordError(error.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };
  
  // Save notification preferences
  const handleNotificationSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          emailPreferences
        })
      });
      
      if (!res.ok) {
        throw new Error("Failed to update notification preferences");
      }
      
      toast.success("Notification settings updated successfully");
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update notification settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
        <div className="h-10 bg-gray-700 rounded w-full mb-6"></div>
        <div className="h-32 bg-gray-700 rounded w-full mb-6"></div>
        <div className="h-12 bg-gray-700 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
      
      {/* Tabs */}
      <div className="mb-8 border-b border-gray-700">
        <div className="flex flex-wrap -mb-px">
          <button
            onClick={() => setActiveTab("profile")}
            className={`mr-4 py-2 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "profile"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
            }`}
          >
            Profile
          </button>
          
          <button
            onClick={() => setActiveTab("account")}
            className={`mr-4 py-2 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "account"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
            }`}
          >
            Account
          </button>
          
          <button
            onClick={() => setActiveTab("notifications")}
            className={`py-2 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "notifications"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
            }`}
          >
            Notifications
          </button>
        </div>
      </div>
      
      {/* Profile Settings Tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSave}>
          {/* Avatar */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={avatar || "/default-avatar.png"}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border border-gray-700"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/default-avatar.png";
                  }}
                />
                {imageUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={imageUploading}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  JPEG, PNG or GIF. Max 2MB.
                </p>
              </div>
            </div>
          </div>
          
          {/* Name */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
              Display Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          {/* Bio */}
          <div className="mb-6">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-400 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
              maxLength={250}
            ></textarea>
            <p className="text-xs text-gray-500 text-right mt-1">
              {bio.length}/250 characters
            </p>
          </div>
          
          {/* Save Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-300 disabled:bg-indigo-800 disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}
      
      {/* The rest of the component remains unchanged */}
      {/* Account Settings Tab */}
      {activeTab === "account" && (
        <div>
          <div className="p-6 bg-gray-800 border border-gray-700 rounded-xl mb-8">
            <h2 className="text-lg font-medium text-white mb-6">Change Password</h2>
            
            <form onSubmit={handlePasswordChange}>
              {/* Current Password */}
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-400 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              {/* New Password */}
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-400 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters
                </p>
              </div>
              
              {/* Confirm New Password */}
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              {/* Error Message */}
              {passwordError && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                  {passwordError}
                </div>
              )}
              
              {/* Save Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-300 disabled:bg-indigo-800 disabled:opacity-70"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="p-6 bg-gray-800 border border-gray-700 rounded-xl">
            <h2 className="text-lg font-medium text-white">Account Information</h2>
            
            <div className="mt-4">
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white mt-1">{session?.user?.email || 'No email'}</p>
            </div>
            
            <div className="mt-8">
              <h3 className="text-red-500 text-sm font-medium mb-4">Danger Zone</h3>
              <button
                type="button"
                className="px-4 py-2 bg-gray-700 border border-red-500 text-red-500 font-medium rounded-lg hover:bg-red-900/20 transition-colors duration-300"
                onClick={() => {
                  if (confirm('Are you sure you want to deactivate your account? This cannot be undone.')) {
                    toast.error('Account deactivation is not implemented yet');
                  }
                }}
              >
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification Settings Tab */}
      {activeTab === "notifications" && (
        <form onSubmit={handleNotificationSave}>
          <div className="p-6 bg-gray-800 border border-gray-700 rounded-xl">
            <h2 className="text-lg font-medium text-white mb-6">Email Notifications</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">New Followers</h3>
                  <p className="text-sm text-gray-400">
                    Receive an email when someone follows you
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailPreferences.newFollower}
                    onChange={() => setEmailPreferences({ 
                      ...emailPreferences, 
                      newFollower: !emailPreferences.newFollower 
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer 
                    peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] 
                    after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                    after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                    peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">New Comments</h3>
                  <p className="text-sm text-gray-400">
                    Receive an email when someone comments on your story
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailPreferences.newComment}
                    onChange={() => setEmailPreferences({ 
                      ...emailPreferences, 
                      newComment: !emailPreferences.newComment 
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer 
                    peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] 
                    after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                    after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                    peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">New Likes</h3>
                  <p className="text-sm text-gray-400">
                    Receive an email when someone likes your story
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailPreferences.newLike}
                    onChange={() => setEmailPreferences({ 
                      ...emailPreferences, 
                      newLike: !emailPreferences.newLike 
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer 
                    peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] 
                    after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                    after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                    peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Weekly Digest</h3>
                  <p className="text-sm text-gray-400">
                    Receive a weekly summary of your story interactions
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailPreferences.weeklyDigest}
                    onChange={() => setEmailPreferences({ 
                      ...emailPreferences, 
                      weeklyDigest: !emailPreferences.weeklyDigest 
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer 
                    peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] 
                    after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                    after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                    peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
            
            <div className="mt-8">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-300 disabled:bg-indigo-800 disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}