
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
    e.target.value = "";
  };

  return (
    <div
      className={cn(
        "mx-auto max-w-xl w-full bg-[#2A2A2E] border border-[#403E43] rounded-xl shadow-md flex flex-col items-center gap-3 py-12 px-6",
        loading && "opacity-60 pointer-events-none"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <ImageIcon className="w-9 h-9 text-gray-300" />
        <span className="font-bold text-xl text-gray-100">Batch Analyze Images</span>
      </div>
      <p className="text-gray-400 text-sm">Select multiple images to extract archival metadata.</p>
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
        className="px-5 py-2 rounded-md font-semibold bg-[#403E43] hover:bg-[#221F26] text-white mt-3 shadow transition-all"
      >
        {loading ? "Analyzing..." : "Select Images"}
      </button>
    </div>
  );
};
export default ImageUploader;
