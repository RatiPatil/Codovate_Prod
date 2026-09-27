import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import api from '../api/axios';

/**
 * Converts a Blob or File to a Base64 data URL string
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Uploads a file to Firebase Storage and returns the download URL
 */
export const uploadFileToStorage = async (file, path, onProgress = null) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        }
      },
      (error) => {
        console.error("Storage upload error:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

/**
 * Uploads to Cloudinary. Requires VITE_CLOUDINARY_CLOUD_NAME and
 * VITE_CLOUDINARY_UPLOAD_PRESET env vars — no hardcoded fallbacks.
 */
export const uploadToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary is not configured: VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET env vars are required."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Cloudinary upload failed");
  }

  const data = await response.json();
  return data.secure_url;
};

/** Returns true only when both Cloudinary env vars are explicitly set. */
const isCloudinaryConfigured = () =>
  Boolean(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

/**
 * Uploads a profile photo.
 * Tier 1: Cloudinary (only when VITE_CLOUDINARY_* env vars are configured)
 * Tier 2: Firebase Storage direct from client
 * Tier 3: Server-side base64 upload fallback
 */
export const uploadProfilePhoto = async (file, userId, onProgress) => {
  // Tier 1: Cloudinary — only if configured via env vars, no hardcoded fallback
  if (isCloudinaryConfigured()) {
    try {
      const cloudinaryUrl = await uploadToCloudinary(file);
      if (cloudinaryUrl) {
        return cloudinaryUrl;
      }
    } catch (cloudinaryErr) {
      console.warn("Warning: Cloudinary upload failed, falling back to Firebase Storage:", cloudinaryErr.message);
    }
  }

  // Tier 2: Firebase Storage Direct
  try {
    const fileName = file?.name || 'photo.jpg';
    const extension = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
    const path = `profiles/${userId}/avatar_${Date.now()}.${extension}`;
    return await uploadFileToStorage(file, path, onProgress);
  } catch (err) {
    console.warn("Warning: Client Firebase Storage upload failed, trying server fallback:", err.message);
    try {
      let base64String = file.dataUrl;
      if (!base64String) {
        base64String = await blobToBase64(file);
      }
      const res = await api.post('/students/upload-avatar-base64', { imageBase64: base64String, userId });
      if (res.data && res.data.avatar_url) {
        return res.data.avatar_url;
      }
      throw new Error(res.data?.message || "Failed to upload avatar via server fallback.");
    } catch (fallbackErr) {
      console.error("Server-side avatar upload fallback error:", fallbackErr);
      throw err;
    }
  }
};

/**
 * Convenience method for resumes
 */
export const uploadResume = async (file, userId, onProgress) => {
  const fileName = file?.name || 'resume.pdf';
  const extension = fileName.includes('.') ? fileName.split('.').pop() : 'pdf';
  const path = `resumes/${userId}/resume_${Date.now()}.${extension}`;
  return uploadFileToStorage(file, path, onProgress);
};
