import React from "react";
import { Image as ImageIcon, Upload, FileImage, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onFilesSelected: (files: File[], originalFilenames?: Record<string, string>) => void;
  loading: boolean;
};

const ImageUploader: React.FC<Props> = ({ onFilesSelected, loading }) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [previewFiles, setPreviewFiles] = React.useState<{ file: File, preview: string }[]>([]);
  const dropAreaRef = React.useRef<HTMLDivElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || loading) return;
    
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
      // Create a mapping of file IDs to original filenames
      const originalFilenames: Record<string, string> = {};
      limitedFiles.forEach(file => {
        // Using a random ID as a temporary fileId until it's processed
        const tempId = Math.random().toString(36).substring(2, 15);
        originalFilenames[tempId] = file.name;
      });
      
      onFilesSelected(limitedFiles, originalFilenames);
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
    
    if (loading) return;
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      // Check if the mouse is leaving the drop area or just entering a child element
      const rect = dropAreaRef.current?.getBoundingClientRect();
      if (rect) {
        const { clientX, clientY } = e;
        if (
          clientX < rect.left ||
          clientX >= rect.right ||
          clientY < rect.top ||
          clientY >= rect.bottom
        ) {
          setDragActive(false);
        }
      } else {
        setDragActive(false);
      }
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

  return (
    <div className="w-full">
      <div
        ref={dropAreaRef}
        onDragEnter={handleDrag}
        className={cn(
          "w-full rounded-xl border-2 border-dashed transition-all duration-200",
          "flex flex-col items-center justify-center gap-4 py-10 px-4",
          dragActive 
            ? "border-primary bg-primary/5 shadow-lg scale-[1.01]" 
            : "border-muted bg-muted/30 hover:bg-muted/40",
          loading && "opacity-50 pointer-events-none saturate-50"
        )}
      >
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className="w-full h-full flex flex-col items-center relative"
        >
          {dragActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/80 backdrop-blur-sm rounded-lg animate-in fade-in zoom-in duration-200">
              <FileImage className="w-16 h-16 text-primary animate-pulse mb-3" />
              <h3 className="text-xl font-bold text-primary">Drop images here</h3>
              <p className="text-sm text-muted-foreground mt-1">Release to analyze with AI</p>
            </div>
          )}
          
          {previewFiles.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center items-center mb-4">
              {previewFiles.slice(0, 5).map((item, i) => (
                <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border border-muted group">
                  <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-white font-medium truncate max-w-[90%] px-1">
                      {item.file.name}
                    </span>
                  </div>
                </div>
              ))}
              {previewFiles.length > 5 && (
                <div className="w-16 h-16 rounded-md bg-muted/50 flex items-center justify-center text-sm font-medium">
                  +{previewFiles.length - 5}
                </div>
              )}
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4 transition-all">
              <Upload className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          
          <h3 className="text-xl font-semibold text-foreground">
            {loading ? "Analyzing Images..." : "Drop images here"}
          </h3>
          
          <p className="text-muted-foreground text-sm max-w-sm text-center mt-2">
            Selected images will be analyzed to extract metadata for archival purposes
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
          
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className={cn(
              "mt-4 px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2",
              "bg-gray-600 text-gray-50 shadow hover:bg-gray-700 active:bg-gray-800",
              loading && "bg-gray-500"
            )}
          >
            <ImageIcon className="w-4 h-4" />
            {loading ? "Processing..." : "Select Images"}
          </button>
          
          <p className="text-xs text-muted-foreground mt-3">
            or drag & drop image files
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
