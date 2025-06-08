"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  
  // For file upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/profile");
        
        if (!res.ok) {
          console.log("Trying alternative API endpoint");
          // Try fallback endpoint
          const altRes = await fetch("/api/users/profile");
          
          if (!altRes.ok) {
            throw new Error(`Error: ${res.status}`);
          }
          
          const altData = await altRes.json();
          if (altData.user) {
            setName(altData.user.name || "");
            setBio(altData.user.bio || "");
            setAvatar(altData.user.avatar || "");
            if (altData.user.avatar) {
              setAvatarPreview(altData.user.avatar);
            }
          }
        } else {
          const data = await res.json();
          if (data.user) {
            setName(data.user.name || "");
            setBio(data.user.bio || "");
            setAvatar(data.user.avatar || "");
            if (data.user.avatar) {
              setAvatarPreview(data.user.avatar);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setError("Failed to load profile. Please try again later.");
        
        // Fallback to session data
        if (session?.user?.name) {
          setName(session.user.name);
        }
        if (session?.user?.image) {
          setAvatar(session.user.image);
          setAvatarPreview(session.user.image);
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchProfile();
    }
  }, [session]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setAvatarFile(file);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (): Promise<string> => {
    if (!avatarFile) return avatar;

    const formData = new FormData();
    formData.append('file', avatarFile);

    setUploadProgress(10);

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(50);

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(errorText || 'Avatar upload failed');
      }

      const uploadData = await uploadRes.json();
      
      setUploadProgress(100);
      
      // Accept either url or fileUrl from response
      const imageUrl = uploadData.url || uploadData.fileUrl;
      
      if (!imageUrl) {
        throw new Error("No image URL returned from server");
      }
      
      console.log("Upload successful, URL:", imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      setError('Failed to upload avatar. Please try again.');
      return avatar;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      setIsSaving(true);
      let avatarUrl = avatar;
      
      // Upload avatar if there's a new file
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      console.log("Updating profile with avatar:", avatarUrl);

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          bio, 
          avatar: avatarUrl 
        }),
      });

      if (!res.ok) {
        // Try alternative endpoint
        const altRes = await fetch("/api/users/profile/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name, 
            bio, 
            avatar: avatarUrl 
          }),
        });
        
        if (!altRes.ok) {
          throw new Error(`Error: ${res.status}`);
        }
        
        // Process successful update from alternate endpoint
        const altData = await altRes.json();
        console.log("Profile update response (alt):", altData);
      } else {
        // Process successful update
        const data = await res.json();
        console.log("Profile update response:", data);
      }

      // Update global state with a custom event
      const updateEvent = new CustomEvent("profileUpdated", {
        detail: { 
          name,
          avatar: avatarUrl
        },
      });
      
      console.log("Dispatching profileUpdated event");
      window.dispatchEvent(updateEvent);

      toast.success("Profile updated successfully");
      
      // Reset file state
      setAvatarFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Profile update error:", error);
      setError("Failed to update profile. Please try again.");
      toast.error("Profile update failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !error) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 text-center">
        <div className="animate-pulse">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-gray-700 h-24 w-24"></div>
          </div>
          <div className="h-8 bg-gray-700 rounded w-48 mx-auto mb-4"></div>
          <div className="h-32 bg-gray-700 rounded w-full mb-6"></div>
          <div className="h-10 bg-gray-700 rounded w-40 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-transparent border border-gray-500 rounded-xl shadow-md space-y-4 text-white">
      <h1 className="text-2xl font-bold">Edit Profile</h1>
      
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar upload section */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-600 mb-3 relative">
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                <div className="text-white font-bold">{uploadProgress}%</div>
              </div>
            )}
            <img 
              src={avatarPreview || avatar || session?.user?.image || "/default-avatar.png"} 
              alt="Profile" 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/default-avatar.png";
              }}
            />
          </div>
          
          <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition">
            Change Avatar
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={isSaving}
            />
          </label>
          
          {avatarFile && (
            <p className="text-sm mt-1">Selected: {avatarFile.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            className="w-full border border-gray-600 p-2 rounded bg-gray-800/50 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            className="w-full border border-gray-600 p-2 rounded bg-gray-800/50 text-white resize-y"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself in a few words..."
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className={`bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition w-full ${
            isSaving ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}