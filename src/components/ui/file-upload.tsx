
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onChange: (file: File | null) => void;
  value?: string | null;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUpload({
  onChange,
  value,
  className,
  accept = "image/*",
  maxSize = 5, // Default 5MB
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleFile = (file: File) => {
    setError(null);
    
    // Check file type
    if (!file.type.match(accept.replace('*', '.*'))) {
      setError(`Tipo de arquivo inválido. Por favor, envie ${accept.includes('image') ? 'uma imagem' : 'um arquivo válido'}.`);
      return;
    }
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`O arquivo é muito grande. O tamanho máximo é ${maxSize}MB.`);
      return;
    }
    
    onChange(file);
  };
  
  const handleRemove = () => {
    onChange(null);
  };
  
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-all text-center",
          dragActive ? "border-primary bg-muted/20" : "border-muted-foreground/20",
          value ? "border-primary/50" : "",
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {value ? (
          <div className="relative w-full aspect-video flex items-center justify-center bg-muted/20 rounded-md overflow-hidden">
            {value.includes('image') || value.endsWith('.jpg') || value.endsWith('.jpeg') || value.endsWith('.png') || value.endsWith('.webp') || value.endsWith('.gif') ? (
              <img 
                src={value} 
                alt="Preview" 
                className="max-h-full max-w-full object-contain" 
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-10 h-10 mb-2" />
                <span>Arquivo selecionado</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full hover:bg-destructive/80"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-1">
              Arraste e solte sua imagem aqui ou
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              Selecionar Arquivo
            </Button>
          </div>
        )}
        <input
          id="fileInput"
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
