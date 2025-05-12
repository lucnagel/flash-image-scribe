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

    // Clean up previous object URLs before setting new ones
    previewFiles.forEach(item => URL.revokeObjectURL(item.preview));
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
          "w-full rounded-lg border-2 border-dashed transition-all duration-200", // Standardized border radius
          "bg-muted/20 hover:bg-muted/30", // Adjusted background opacity
          "flex flex-col items-center justify-center gap-3 py-8 px-4", // Adjusted padding and gap
          dragActive ? "border-primary/50 bg-primary/10" : "border-muted", // Enhanced drag active state
          loading && "opacity-60 pointer-events-none" // Adjusted loading opacity
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
            <div className="flex flex-wrap gap-2 justify-center items-center mb-3">
              {previewFiles.slice(0, 5).map((item, i) => (
                <div key={i} className="relative w-14 h-14 rounded border border-muted/50 overflow-hidden"> {/* Adjusted size and border */}
                  <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
                </div>
              ))}
              {previewFiles.length > 5 && (
                <div className="w-14 h-14 rounded bg-muted/40 flex items-center justify-center text-xs font-medium text-muted-foreground"> {/* Adjusted size and text */}
                  +{previewFiles.length - 5}
                </div>
              )}
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center mb-2"> {/* Adjusted size and margin */}
              <Upload className="w-7 h-7 text-muted-foreground" /> {/* Adjusted icon size */}
            </div>
          )}

          <h3 className="text-base font-semibold text-foreground"> {/* Adjusted text size */}
            {loading ? "Analyzing Images..." : "Drop images here or click to upload"}
          </h3>

          <p className="text-muted-foreground text-xs max-w-xs text-center mt-0.5"> {/* Adjusted text size and margin */}
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
          
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className={cn("mt-3", loading && "animate-pulse")} // Adjusted margin
            variant="default"
            size="sm" // Standardized button size
          >
            {loading ? "Processing..." : "Select Images"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
