import api from "@/config/axiosConfig";

/**
 * Response from backend /api/files/upload
 */
export interface FileUploadResponse {
  viewUrl: string;
  downloadUrl: string;
}

/**
 * Upload file to backend API (uses Cloudinary)
 * Supports: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, images, videos, etc.
 * 
 * Backend returns:
 * - viewUrl: URL for preview (Google Docs Viewer for documents, direct URL for images/videos)
 * - downloadUrl: URL for downloading with correct filename and extension
 */
export async function uploadFileToBackend(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = response.data;
    
    if (data.code === 0 && data.result) {
      return {
        viewUrl: data.result.viewUrl,
        downloadUrl: data.result.downloadUrl,
      };
    }
    
    throw new Error(data.message || 'Upload failed');
  } catch (error: any) {
    console.error('Backend upload error:', error);
    throw new Error(error.response?.data?.message || 'Không thể tải file lên. Vui lòng thử lại sau.');
  }
}

/**
 * Main upload function - uses backend API
 * @deprecated Use uploadFileToBackend instead
 */
export async function uploadFile(file: File): Promise<string> {
  const result = await uploadFileToBackend(file);
  return result.downloadUrl; // Return download URL for backward compatibility
}
