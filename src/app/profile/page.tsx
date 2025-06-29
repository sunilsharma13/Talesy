// src/app/profile/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { CameraIcon, PhotoIcon } from '@heroicons/react/24/outline';

// Import the ImageCropper component
import ImageCropper from '@/components/ImageCropper'; // Adjust path if different

// Define your default images (make sure these paths exist in your /public folder)
const DEFAULT_AVATAR = "/default-avatar.png";
const DEFAULT_COVER_IMAGE = "/default-cover-image.png";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(""); // Current saved avatar URL
  const [coverImage, setCoverImage] = useState(""); // Current saved cover image URL
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Cropper State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'avatar' | 'cover' | null>(null);

  // States for Avatar Upload
  const [croppedAvatarFile, setCroppedAvatarFile] = useState<File | null>(null); // Cropped file
  const [avatarPreview, setAvatarPreview] = useState(""); // Preview URL (from cropped or existing)
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // States for Cover Image Upload
  const [croppedCoverFile, setCroppedCoverFile] = useState<File | null>(null); // Cropped file
  const [coverPreview, setCoverPreview] = useState(""); // Preview URL (from cropped or existing)
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // --- Theme State ---
  const [theme, setTheme] = useState<string>('dark'); // Default theme

  // Helper to get theme-dependent CSS variables
  const getDynamicThemeClass = useCallback((prop: string) => `var(--${prop})`, []);

  // Effect to manage theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Effect to fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError("");

        const res = await fetch("/api/users/profile"); // Use the consistent endpoint

        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }

        const data = await res.json();
        if (data.user) {
          setName(data.user.name || "");
          setBio(data.user.bio || "");
          setAvatar(data.user.avatar || "");
          setCoverImage(data.user.coverImage || "");

          if (data.user.avatar) setAvatarPreview(data.user.avatar);
          if (data.user.coverImage) setCoverPreview(data.user.coverImage);
        } else {
          setName(session.user.name || "");
          if (session.user.image) {
            setAvatar(session.user.image);
            setAvatarPreview(session.user.image);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setError("Failed to load profile. Please try again later.");
        if (session?.user?.name) setName(session.user.name);
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

  // --- Handlers for File Input Changes (Now opens Cropper) ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      toast.error('Only image files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image size should be less than 5MB.');
      toast.error('Image is too large (max 5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
      setCropType(type);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // --- Callback from ImageCropper when cropping is complete ---
  // Renamed to match expected prop name `onCroppedImage` if that's what ImageCropper expects
  const onCroppedImage = useCallback((croppedFile: File, dataUrl: string) => {
    if (cropType === 'avatar') {
      setCroppedAvatarFile(croppedFile);
      setAvatarPreview(dataUrl);
    } else if (cropType === 'cover') {
      setCroppedCoverFile(croppedFile);
      setCoverPreview(dataUrl);
    }
    setCropperOpen(false); // Close the cropper modal
    setImageToCrop(null);
    setCropType(null);
  }, [cropType]);

  const onCropperClose = useCallback(() => {
    setCropperOpen(false);
    setImageToCrop(null);
    setCropType(null);
  }, []);

  // --- Upload Function for Files ---
  const uploadFile = useCallback(async (file: File | null, setProgress: (p: number) => void, setIsUploading: (b: boolean) => void, currentUrl: string): Promise<string> => {
    if (!file) return currentUrl;

    setIsUploading(true);
    setProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      setProgress(50);

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(errorText || 'File upload failed');
      }

      const uploadData = await uploadRes.json();
      setProgress(100);

      const imageUrl = uploadData.url || uploadData.fileUrl;

      if (!imageUrl) {
        throw new Error("No image URL returned from server");
      }

      console.log("Upload successful, URL:", imageUrl);
      return imageUrl;
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Failed to upload file: ${err instanceof Error ? err.message : String(err)}`);
      toast.error(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return currentUrl;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, []);

  // --- Form Submission Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSaving || isUploadingAvatar || isUploadingCover) return;

    setIsSaving(true);
    let finalAvatarUrl = avatar;
    let finalCoverUrl = coverImage;

    try {
      if (croppedAvatarFile) { // Use cropped file
        finalAvatarUrl = await uploadFile(croppedAvatarFile, setAvatarUploadProgress, setIsUploadingAvatar, avatar);
        // Only reset file if upload was successful. If not, it means `finalAvatarUrl` is still `avatar`
        if (finalAvatarUrl !== avatar) setCroppedAvatarFile(null);
      }

      if (croppedCoverFile) { // Use cropped file
        finalCoverUrl = await uploadFile(croppedCoverFile, setCoverUploadProgress, setIsUploadingCover, coverImage);
        if (finalCoverUrl !== coverImage) setCroppedCoverFile(null);
      }

      const res = await fetch("/api/users/profile/update", {
        method: "PUT", // <--- Make sure your backend route is also PUT
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          avatar: finalAvatarUrl,
          coverImage: finalCoverUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unexpected server response' })); // Handle non-JSON error
        throw new Error(errorData.message || `Error: ${res.status}`);
      }

      const data = await res.json();
      console.log("Profile update response:", data);

      window.dispatchEvent(new CustomEvent("profileUpdated", {
        detail: {
          name: data.user.name,
          avatar: data.user.avatar,
          coverImage: data.user.coverImage,
        },
      }));

      toast.success("Profile updated successfully!");

      setAvatar(data.user.avatar);
      setAvatarPreview(data.user.avatar);
      setCoverImage(data.user.coverImage);
      setCoverPreview(data.user.coverImage);

    } catch (err) {
      console.error("Profile update error:", err);
      setError(`Failed to update profile: ${err instanceof Error ? err.message : String(err)}`);
      toast.error(`Profile update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Conditional rendering for loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          backgroundColor: getDynamicThemeClass('background-primary'),
          color: getDynamicThemeClass('text-primary'),
        }}
      >
        <div className="max-w-xl mx-auto p-6 text-center">
          <div className="animate-pulse">
            <div className="h-48 w-full rounded-lg mb-6" style={{ backgroundColor: getDynamicThemeClass('hover-bg') }}></div>
            <div className="flex justify-center -mt-16 mb-6">
              <div className="rounded-full h-24 w-24 border-4" style={{ backgroundColor: getDynamicThemeClass('hover-bg'), borderColor: getDynamicThemeClass('background-primary') }}></div>
            </div>
            <div className="h-8 rounded w-48 mx-auto mb-4" style={{ backgroundColor: getDynamicThemeClass('hover-bg') }}></div>
            <div className="h-32 rounded w-full mb-6" style={{ backgroundColor: getDynamicThemeClass('hover-bg') }}></div>
            <div className="h-10 rounded w-40 mx-auto" style={{ backgroundColor: getDynamicThemeClass('hover-bg') }}></div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Profile Edit Form ---
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundColor: getDynamicThemeClass('background-primary'),
        color: getDynamicThemeClass('text-primary'),
      }}
    >
      <div
        className="max-w-2xl w-full p-0 border rounded-xl shadow-md overflow-hidden relative"
        style={{
          backgroundColor: getDynamicThemeClass('background-secondary'),
          borderColor: getDynamicThemeClass('border-color'),
        }}
      >
        {/* Cover Image Section */}
        <div className="relative h-48 w-full group">
          {coverPreview ? (
            <Image
              src={coverPreview}
              alt="Cover"
              layout="fill"
              objectFit="cover"
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = DEFAULT_COVER_IMAGE;
                setCoverPreview(DEFAULT_COVER_IMAGE);
              }}
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center text-center p-4"
              style={{ backgroundColor: getDynamicThemeClass('border-color') }}
            >
              <Image
                src={DEFAULT_COVER_IMAGE}
                alt="Default Cover"
                width={80}
                height={80}
                className="opacity-50 mb-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_COVER_IMAGE;
                }}
              />
              <p className="text-sm italic" style={{ color: getDynamicThemeClass('text-secondary') }}>
                Add a cover image
              </p>
            </div>
          )}

          {/* Cover Image Upload Overlay */}
          <label
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer z-10"
            style={{
              backgroundColor: isUploadingCover ? getDynamicThemeClass('text-secondary') : 'rgba(0, 0, 0, 0.5)',
              color: 'white',
            }}
          >
            {isUploadingCover ? (
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-6 w-6 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">{coverUploadProgress}%</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <PhotoIcon className="w-6 h-6" />
                <span>Change Cover</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'cover')}
              disabled={isSaving || isUploadingCover}
            />
          </label>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Avatar upload section */}
          <div className="flex flex-col items-center -mt-20 z-20 relative">
            <div
              className="w-28 h-28 rounded-full overflow-hidden border-4 mb-3 relative group"
              style={{ borderColor: getDynamicThemeClass('background-secondary') }}
            >
              {avatarUploadProgress > 0 && avatarUploadProgress < 100 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                  <div className="text-white font-bold">{avatarUploadProgress}%</div>
                </div>
              )}
              <Image
                src={avatarPreview || avatar || session?.user?.image || DEFAULT_AVATAR}
                alt="Profile"
                layout="fill"
                objectFit="cover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_AVATAR;
                  setAvatarPreview(DEFAULT_AVATAR);
                }}
              />
              {/* Avatar Upload Overlay */}
              <label
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer z-10"
                style={{
                  backgroundColor: isUploadingAvatar ? getDynamicThemeClass('text-secondary') : 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                }}
              >
                {isUploadingAvatar ? (
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin h-5 w-5 text-white mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs">{avatarUploadProgress}%</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <CameraIcon className="w-5 h-5" />
                    <span>Change</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'avatar')}
                  disabled={isSaving || isUploadingAvatar}
                />
              </label>
            </div>
            {(croppedAvatarFile) && ( // Show name if cropped file is selected
              <p className="text-sm mt-1" style={{ color: getDynamicThemeClass('text-secondary') }}>
                Selected: {croppedAvatarFile.name}
              </p>
            )}
            {(croppedCoverFile) && ( // Show name if cropped file is selected
              <p className="text-sm mt-1" style={{ color: getDynamicThemeClass('text-secondary') }}>
                Selected: {croppedCoverFile.name}
              </p>
            )}
          </div>

          <h1 className="text-center text-3xl font-bold -mt-8 mb-4" style={{ color: getDynamicThemeClass('text-primary') }}>
            Edit Profile
          </h1>

          {error && (
            <div
              className="border p-3 rounded-lg mb-4 text-center"
              style={{
                backgroundColor: getDynamicThemeClass('error-background'),
                borderColor: getDynamicThemeClass('error-border'),
                color: getDynamicThemeClass('error-text'),
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: getDynamicThemeClass('text-primary') }}>Name</label>
            <input
              type="text"
              className="w-full border p-2 rounded focus:outline-none focus:ring-2"
              style={{
                borderColor: getDynamicThemeClass('border-color'),
                backgroundColor: getDynamicThemeClass('input-background'),
                color: getDynamicThemeClass('text-primary'),
                '--tw-ring-color': getDynamicThemeClass('accent-color'),
              } as React.CSSProperties}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: getDynamicThemeClass('text-primary') }}>Bio</label>
            <textarea
              className="w-full border p-2 rounded resize-y focus:outline-none focus:ring-2"
              rows={3}
              style={{
                borderColor: getDynamicThemeClass('border-color'),
                backgroundColor: getDynamicThemeClass('input-background'),
                color: getDynamicThemeClass('text-primary'),
                '--tw-ring-color': getDynamicThemeClass('accent-color'),
              } as React.CSSProperties}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself in a few words..."
              disabled={isSaving}
            />
          </div>

          <button
            type="submit"
            disabled={isSaving || isUploadingAvatar || isUploadingCover}
            className={`px-4 py-2 rounded w-full transition ${
              isSaving || isUploadingAvatar || isUploadingCover
                ? "opacity-70 cursor-not-allowed"
                : "hover:opacity-85"
            }`}
            style={{
              backgroundColor: getDynamicThemeClass('accent-color'),
              color: getDynamicThemeClass('active-text'),
            }}
          >
            {isSaving ? "Saving..." : (isUploadingAvatar || isUploadingCover ? "Uploading..." : "Save Profile")}
          </button>
        </form>
      </div>

      {/* Image Cropper Modal */}
      {cropperOpen && imageToCrop && (
        <ImageCropper
          imageUrl={imageToCrop}
          onCroppedImage={onCroppedImage}
          onCancel={onCropperClose}
          aspectRatio={cropType === 'avatar' ? 1 / 1 : 16 / 9}
          cropShape={cropType === 'avatar' ? 'round' : 'rect'}
        />
      )}
    </div>
  );
}