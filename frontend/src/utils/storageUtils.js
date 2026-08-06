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
 * @param {File} file - The file to upload
 * @param {string} path - The path in Firebase Storage (e.g., 'profiles/userid/photo.jpg')
 * @param {function} onProgress - Optional callback for upload progress (0-100)
 * @returns {Promise<string>} The download URL of the uploaded file
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
 * Convenience method for profile photos with automatic server-side CORS fallback
 */
export const uploadProfilePhoto = async (file, userId, onProgress) => {
  try {
    const fileName = file?.name || 'photo.jpg';
    const extension = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
    const path = `profiles/${userId}/avatar_${Date.now()}.${extension}`;
    return await uploadFileToStorage(file, path, onProgress);
  } catch (err) {
    console.warn("⚠️ Client Firebase Storage upload failed/CORS blocked, executing server-side avatar upload fallback:", err.message);
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
