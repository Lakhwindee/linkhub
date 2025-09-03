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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check file size
    if (file.size > maxFileSize) {
      alert(`File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`);
      return;
    }

    setUploading(true);

    // Demo upload - simulate successful upload after 1 second
    setTimeout(() => {
      // Create a demo image URL using the selected file
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        // Simulate successful upload result
        const result = {
          successful: [
            {
              id: file.name,
              name: file.name,
              type: file.type,
              size: file.size,
              uploadURL: imageUrl, // Use the file data URL for demo
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
      };
      
      reader.readAsDataURL(file);
    }, 1000);
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
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
