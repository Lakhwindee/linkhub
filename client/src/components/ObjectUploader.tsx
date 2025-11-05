import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onComplete?: (result: any) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleButtonClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
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
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      // Read file as base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadProgress(50);

      // Upload file to server
      const uploadResponse = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: fileBase64,
          contentType: file.type,
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const { objectPath } = await uploadResponse.json();
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Small delay to show 100%
      await new Promise(resolve => setTimeout(resolve, 300));

      // Convert object path to full URL
      const fullURL = `${window.location.origin}${objectPath}`;
      console.log('✅ File uploaded:', { objectPath, fullURL });

      // Call onComplete with successful result
      const result = {
        successful: [
          {
            id: file.name,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadURL: fullURL, // Use full URL instead of path
            objectPath: objectPath, // Keep original path for reference
          }
        ],
        failed: [],
      };

      onComplete?.(result);
      setUploading(false);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Upload failed! Please try again.');
      setUploading(false);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative">
      <Button 
        onClick={handleButtonClick} 
        className={buttonClassName} 
        type="button"
        disabled={uploading}
      >
        {uploading ? (
          <div className="flex items-center">
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            {uploadProgress}%
          </div>
        ) : children}
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
