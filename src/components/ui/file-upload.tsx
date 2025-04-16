
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onChange: (file: File | null) => void;
  value?: string | null;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
  isLoading?: boolean;
  onDelete?: () => Promise<void>;
}

export function FileUpload({
  onChange,
  value,
  className,
  accept = "image/*",
  maxSize = 5, // Default 5MB
  isLoading = false,
  onDelete
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
    
    // Check file type based on the accept attribute
    const fileType = file.type.toLowerCase();
    const acceptTypes = accept.split(',').map(type => type.trim().toLowerCase());
    
    console.log('Checking file:', file.name, 'Type:', fileType);
    console.log('Accepted types:', acceptTypes);
    
    // Special handling for PDFs
    const isPdf = fileType === 'application/pdf';
    const isPdfAccepted = acceptTypes.some(type => 
      type === 'application/pdf' || type === '.pdf' || type === 'pdf'
    );
    
    if (isPdf && !isPdfAccepted) {
      setError(`Tipo de arquivo inválido. Por favor, envie ${accept.includes('image') ? 'uma imagem' : 'um arquivo válido'}.`);
      return;
    }
    
    if (!isPdf && !acceptTypes.some(type => {
      if (type.startsWith('.')) {
        // Handle extension format like .jpg
        return file.name.toLowerCase().endsWith(type);
      } else if (type.includes('*')) {
        // Handle wildcard format like image/*
        const [category] = type.split('/');
        return fileType.startsWith(category);
      } else {
        // Handle exact match like image/jpeg
        return fileType === type;
      }
    })) {
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
  
  const handleRemove = async () => {
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete();
      } catch (error) {
        console.error('Error during file deletion:', error);
        setError('Erro ao excluir o arquivo. Tente novamente.');
      } finally {
        setIsDeleting(false);
      }
    } else {
      onChange(null);
    }
  };
  
  // Determine if we have a valid file URL to display
  const hasValidUrl = Boolean(value && typeof value === 'string' && value.trim().length > 0);
  
  // Check if the URL is an image or PDF
  const isPdfUrl = hasValidUrl && (
    value?.toLowerCase().includes('.pdf') ||
    value?.toLowerCase().includes('pdf')
  );
  
  const isImageUrl = hasValidUrl && !isPdfUrl && (
    value?.includes('image') || 
    value?.endsWith('.jpg') || 
    value?.endsWith('.jpeg') || 
    value?.endsWith('.png') || 
    value?.endsWith('.webp') || 
    value?.endsWith('.gif') ||
    value?.startsWith('blob:') ||
    value?.startsWith('data:image/')
  );
  
  // Show the appropriate preview
  const showImagePreview = hasValidUrl && isImageUrl;
  const showPdfPreview = hasValidUrl && isPdfUrl;
  
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-all text-center",
          dragActive ? "border-primary bg-muted/20" : "border-muted-foreground/20",
          (showImagePreview || showPdfPreview) ? "border-primary/50" : "",
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {showImagePreview ? (
          <div className="relative w-full aspect-video flex items-center justify-center bg-muted/20 rounded-md overflow-hidden">
            <img 
              src={value!} 
              alt="Preview" 
              className="max-h-full max-w-full object-contain" 
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={isDeleting || isLoading}
              className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full hover:bg-destructive/80 disabled:opacity-50"
              aria-label="Remove image"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </button>
          </div>
        ) : showPdfPreview ? (
          <div className="relative w-full flex items-center justify-center bg-muted/20 rounded-md overflow-hidden p-4">
            <div className="flex items-center">
              <FileText className="h-12 w-12 text-red-500 mr-3" />
              <div className="text-left">
                <p className="font-medium">Arquivo PDF</p>
                <p className="text-sm text-muted-foreground">
                  <a href={value!} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Visualizar PDF
                  </a>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isDeleting || isLoading}
              className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full hover:bg-destructive/80 disabled:opacity-50"
              aria-label="Remove PDF"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            {isLoading ? (
              <Loader2 className="h-10 w-10 text-muted-foreground mb-2 animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            )}
            <p className="text-sm text-muted-foreground mb-1">
              {isLoading ? 
                'Processando...' : 
                `Arraste e solte seu ${accept.includes('pdf') ? 'PDF' : 'arquivo'} aqui ou`
              }
            </p>
            {!isLoading && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                Selecionar Arquivo
              </Button>
            )}
          </div>
        )}
        <input
          id="fileInput"
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={isLoading || isDeleting}
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
