import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Upload, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string | File;
  onChange: (file: File | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({ 
  value, 
  onChange, 
  placeholder = "Upload profile image",
  className,
  disabled = false 
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  React.useEffect(() => {
    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (typeof value === 'string' && value) {
      setPreview(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      onChange(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20 cursor-pointer" onClick={triggerFileSelect}>
          {preview ? (
            <AvatarImage src={preview} alt="Profile" />
          ) : (
            <AvatarFallback className="bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="flex flex-col space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerFileSelect}
            disabled={disabled}
            className="w-fit"
          >
            <Upload className="h-4 w-4 mr-2" />
            {value ? 'Change Image' : 'Upload Image'}
          </Button>
          
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="w-fit text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      
      <p className="text-sm text-muted-foreground">
        Upload a profile image. JPG, PNG or GIF (max 5MB)
      </p>
    </div>
  );
}