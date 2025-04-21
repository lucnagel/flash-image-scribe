
import React from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onFilesSelected: (files: File[]) => void;
  loading: boolean;
};

const ImageUploader: React.FC<Props> = ({ onFilesSelected, loading }) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).filter(
      (f) => f.type.startsWith("image/")
    );
    onFilesSelected(files);
    // Reset input so re-uploading same file works
    e.target.value = "";
  };

  return (
    <div className={cn("rounded-lg border border-muted bg-white shadow-sm p-6 flex flex-col items-center gap-4", loading && "opacity-70 pointer-events-none")}>
      <ImageIcon className="w-10 h-10 text-blue-500 mb-2" />
      <p className="font-medium text-lg text-gray-800">Batch Analyze Images</p>
      <input
        type="file"
        accept="image/*"
        multiple
        disabled={loading}
        ref={inputRef}
        onChange={handleFiles}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white mt-2 shadow transition"
      >
        {loading ? "Analyzing..." : "Select images"}
      </button>
    </div>
  );
};
export default ImageUploader;
