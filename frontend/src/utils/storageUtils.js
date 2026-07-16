import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

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
 * Convenience method for profile photos
 */
export const uploadProfilePhoto = async (file, userId, onProgress) => {
  const extension = file.name.split('.').pop() || 'jpg';
  const path = `profiles/${userId}/photo_${Date.now()}.${extension}`;
  return uploadFileToStorage(file, path, onProgress);
};

/**
 * Convenience method for resumes
 */
export const uploadResume = async (file, userId, onProgress) => {
  const extension = file.name.split('.').pop() || 'pdf';
  const path = `resumes/${userId}/resume_${Date.now()}.${extension}`;
  return uploadFileToStorage(file, path, onProgress);
};
