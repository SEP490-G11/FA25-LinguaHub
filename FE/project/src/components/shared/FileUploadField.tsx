import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, RefreshCw, Loader2, FileText, File } from 'lucide-react';
import { uploadFileToBackend } from '@/utils/fileUpload';
import { validateFile } from '@/utils/fileValidation';

interface FileUploadFieldProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    error?: string;
    disabled?: boolean;
    maxSizeMB?: number;
    allowedTypes?: string[]; // e.g., ['image/', 'application/pdf']
    accept?: string; // HTML input accept attribute, e.g., "image/*,.pdf"
}

export function FileUploadField({
    value,
    onChange,
    label,
    error,
    disabled = false,
    maxSizeMB = 5,
    allowedTypes = ['image/', 'application/pdf'],
    accept = "image/*,.pdf"
}: FileUploadFieldProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [localError, setLocalError] = useState<string | undefined>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Combine external and local errors
    const displayError = error || localError;

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file using utility
        const validation = validateFile(file, maxSizeMB, allowedTypes);
        if (!validation.isValid) {
            setLocalError(validation.error);
            return;
        }

        try {
            setIsUploading(true);
            setLocalError(undefined);

            const response = await uploadFileToBackend(file);
            onChange(response.viewUrl);

        } catch (err: any) {
            setLocalError(err.message || 'Lỗi khi tải file lên');
        } finally {
            setIsUploading(false);
            // Reset input value to allow selecting same file again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleUploadClick = () => {
        if (disabled) return;
        fileInputRef.current?.click();
    };

    const removeFile = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        onChange('');
    };

    const isImage = (url: string) => {
        return /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.startsWith('data:image');
    };

    const getFileName = (url: string) => {
        try {
            // Handle Google Docs Viewer URLs
            if (url.includes('docs.google.com/gview') || url.includes('docs.google.com/viewer')) {
                const urlParams = new URLSearchParams(new URL(url).search);
                const innerUrl = urlParams.get('url');
                if (innerUrl) {
                    return decodeURIComponent(innerUrl).split('/').pop()?.split('?')[0] || 'Document.pdf';
                }
            }

            return url.split('/').pop()?.split('?')[0] || 'File';
        } catch {
            return 'File';
        }
    };

    return (
        <div>
            {label && (
                <Label className="text-base font-semibold mb-2">
                    {label} <span className="text-red-500">*</span>
                </Label>
            )}

            <div className="mt-2 space-y-4">
                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={accept}
                    onChange={handleFileSelect}
                    disabled={disabled}
                />

                {/* Upload Button or Preview */}
                {!value ? (
                    <div
                        onClick={handleUploadClick}
                        className={`
                border-2 border-dashed border-gray-300 rounded-lg p-6 
                flex flex-col items-center justify-center cursor-pointer
                hover:border-primary hover:bg-gray-50 transition-colors
                ${displayError ? 'border-red-500 bg-red-50' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                    >
                        {isUploading ? (
                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                        ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                <FileText className="w-6 h-6 text-gray-500" />
                            </div>
                        )}
                        <p className="text-sm font-medium text-gray-700">
                            {isUploading ? 'Đang tải lên...' : 'Nhấn để tải file lên'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Hỗ trợ: {allowedTypes.join(', ').replace(/application\//g, '.').replace(/image\//g, 'Image ')} (Tối đa {maxSizeMB}MB)
                        </p>
                    </div>
                ) : (
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 group bg-gray-50">
                        {isImage(value) ? (
                            <img
                                src={value}
                                alt="Preview"
                                className="w-full h-48 object-cover"
                            />
                        ) : (
                            <div className="w-full h-24 flex items-center justify-center gap-3 p-4">
                                <File className="w-8 h-8 text-blue-500" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {getFileName(value)}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleUploadClick}
                                disabled={disabled}
                                className="flex items-center gap-1"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Thay đổi
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={removeFile}
                                disabled={disabled}
                                className="flex items-center gap-1"
                            >
                                <X className="w-4 h-4" />
                                Xóa
                            </Button>
                        </div>
                    </div>
                )}

                {displayError && (
                    <p className="text-red-500 text-sm mt-1">{displayError}</p>
                )}
            </div>
        </div>
    );
}
