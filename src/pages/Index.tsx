
import React from "react";
import ImageUploader from "@/components/ImageUploader";
import ResultTable from "@/components/ResultTable";
import { analyzeImage } from "@/lib/gemini";
import { toast } from "sonner";

type BatchResult = {
  fileId: string;
  fileName: string;
  metadata: {
    subject: string;
    creator: string;
    date_created: string;
    location: string;
    event: string;
    category: string;
    description: string;
  } | null;
};

const Index = () => {
  const [results, setResults] = React.useState<BatchResult[]>([]);
  const [loading, setLoading] = React.useState(false);

  // When user selects files
  const onFilesSelected = async (files: File[]) => {
    setLoading(true);
    setResults(
      files.map((file) => ({
        fileId: file.name + "_" + file.size,
        fileName: file.name,
        metadata: null,
      }))
    );
    // Process images in parallel, but show metadata as they complete
    await Promise.all(
      files.map(async (file, idx) => {
        try {
          const metadata = await analyzeImage(file);
          setResults((prev) =>
            prev.map((r, i) =>
              i === idx ? { ...r, metadata } : r
            )
          );
        } catch (e: any) {
          setResults((prev) =>
            prev.map((r, i) =>
              i === idx ? { ...r, metadata: null } : r
            )
          );
        }
      })
    );
    setLoading(false);
    toast.success("Batch analysis complete!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-cyan-100 flex flex-col items-center justify-start pt-12 px-2">
      <div className="max-w-2xl w-full mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2 text-center">Gemini Flash Image Batch Analyzer</h1>
        <p className="text-md text-gray-700 mb-8 text-center">
          Upload images to automatically extract digital archive metadata.<br />
          Each file will be analyzed and displayed below.
        </p>
        <ImageUploader onFilesSelected={onFilesSelected} loading={loading} />
        <ResultTable results={results} isLoading={loading} />
        <div className="text-xs text-gray-500 mt-6 text-center">
          Output fields: subject, creator, date_created, location, event, category, description.<br />
          <span className="font-mono bg-gray-100 px-2 rounded">file_metadata</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
