import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: any) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const checkVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        resolve(duration <= 60); // 60 seconds = 1 minute
      };
      
      video.onerror = () => {
        resolve(false);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check file size
    if (file.size > maxFileSize) {
      alert(`File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`);
      return;
    }

    // Check file type (only video, image, PDF allowed)
    const allowedTypes = [
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm',
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('❌ केवल Video, Image, या PDF files allow हैं!\nSupported formats: MP4, AVI, MOV, PNG, JPG, GIF, PDF');
      return;
    }

    // Check video duration if it's a video file
    if (file.type.startsWith('video/')) {
      const isValidDuration = await checkVideoDuration(file);
      if (!isValidDuration) {
        alert('❌ Video duration 1 minute से ज्यादा नहीं हो सकती!\nMaximum allowed: 60 seconds');
        return;
      }
    }

    setUploading(true);

    try {
      // Get upload URL from server
      const { method, url: uploadURL } = await onGetUploadParameters();
      
      // Upload file to the URL
      const uploadResponse = await fetch(uploadURL, {
        method: method,
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Call onComplete with successful result
      const result = {
        successful: [
          {
            id: file.name,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadURL: uploadURL, // Return the actual upload URL
          }
        ],
        failed: [],
      };

      onComplete?.(result);
      setUploading(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Upload failed! Please try again.');
      setUploading(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <Button 
        onClick={handleButtonClick} 
        className={buttonClassName} 
        type="button"
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : children}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*,.pdf,application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
