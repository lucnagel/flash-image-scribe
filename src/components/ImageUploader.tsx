import React from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // Added Button import

type Props = {
  onFilesSelected: (files: File[]) => void;
  loading: boolean;
};

const ImageUploader: React.FC<Props> = ({ onFilesSelected, loading }) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [previewFiles, setPreviewFiles] = React.useState<{ file: File, preview: string }[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    
    // Limit to 15 files per batch
    const limitedFiles = imageFiles.slice(0, 15);
    
    // Create preview URLs for drag-and-drop preview
    const newPreviews = limitedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setPreviewFiles(newPreviews);
    
    if (limitedFiles.length > 0) {
      onFilesSelected(limitedFiles);
    }
    
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

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
    
    handleFiles(e.dataTransfer.files);
  };

  // Clear object URLs on unmount to prevent memory leaks
  React.useEffect(() => {
    return () => {
      previewFiles.forEach(item => URL.revokeObjectURL(item.preview));
    };
  }, [previewFiles]);

  // Clear previews when analysis starts
  React.useEffect(() => {
    if (loading) {
      previewFiles.forEach(item => URL.revokeObjectURL(item.preview));
      setPreviewFiles([]);
    }
  }, [loading]);

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        className={cn(
          "w-full rounded-xl border-2 border-dashed transition-all duration-200",
          "bg-muted/30 hover:bg-muted/40",
          "flex flex-col items-center justify-center gap-4 py-10 px-4",
          dragActive ? "border-gray-400 bg-gray-800/5" : "border-muted",
          loading && "opacity-50 pointer-events-none"
        )}
      >
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className="w-full h-full flex flex-col items-center"
        >
          {previewFiles.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center items-center mb-4">
              {previewFiles.slice(0, 5).map((item, i) => (
                <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border border-muted">
                  <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
                </div>
              ))}
              {previewFiles.length > 5 && (
                <div className="w-16 h-16 rounded-md bg-muted/50 flex items-center justify-center text-sm font-medium">
                  +{previewFiles.length - 5}
                </div>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          
          <h3 className="text-lg font-semibold text-foreground">
            {loading ? "Analyzing Images..." : "Drop images here or click to upload"}
          </h3>
          
          <p className="text-muted-foreground text-sm max-w-xs text-center mt-1"> {/* Simplified text and reduced margin */}
            Upload images for AI-powered metadata extraction. (Max 15 per batch)
          </p>
          
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={loading}
            ref={inputRef}
            onChange={handleInputChange}
            className="hidden"
          />
          
          <Button // Changed to Button component
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className={cn("mt-4", loading && "animate-pulse")}
            variant="default" // Using default variant
          >
            {loading ? "Processing..." : "Select Images"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
