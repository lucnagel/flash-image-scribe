import React from "react";
import ImageUploader from "@/components/ImageUploader";
import ResultTable from "@/components/ResultTable";
import { analyzeImage } from "@/lib/gemini";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { exportMetadataAsJson } from "@/lib/exportUtils";

type BatchResult = {
  fileId: string;
  fileName: string;
  fileDataUrl: string | null; // store DataURL for thumbnail
  metadata: {
    subject: string;
    creator: string;
    date_created: string;
    location: string;
    event: string;
    category: string;
    description: string;
  } | null;
  status: "analyzing" | "done" | "failed";
};

const Index = () => {
  const [results, setResults] = React.useState<BatchResult[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const onFilesSelected = async (files: File[]) => {
    setLoading(true);

    const dataUrls = await Promise.all(files.map((f) => fileToDataUrl(f)));

    setResults(
      files.map((file, i) => ({
        fileId: file.name + "_" + file.size,
        fileName: file.name,
        fileDataUrl: dataUrls[i],
        metadata: null,
        status: "analyzing" as const,
      }))
    );

    await Promise.all(
      files.map(async (file, idx) => {
        try {
          const metadata = await analyzeImage(file);
          setResults((prev) =>
            prev.map((r, i) =>
              i === idx ? { ...r, metadata, status: "done" } : r
            )
          );
        } catch (e: any) {
          setResults((prev) =>
            prev.map((r, i) =>
              i === idx ? { ...r, metadata: null, status: "failed" } : r
            )
          );
        }
      })
    );
    setLoading(false);
    toast.success("Batch analysis complete!");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#403E43] to-[#222222] flex flex-col items-center justify-center px-0 py-0 overflow-auto">
      <div className="flex flex-col w-full max-w-6xl mx-auto min-h-screen px-0">
        <header className="flex flex-col items-center py-10">
          <h1 className="text-4xl font-extrabold text-gray-100 mb-2 text-center tracking-tight">Gemini Flash Image Batch Analyzer</h1>
          <p className="text-base text-gray-400 mb-6 text-center max-w-2xl">
            Upload images to automatically extract digital archive metadata.<br />
            Each file will be analyzed and displayed below.
          </p>
          {results.length > 0 && (
            <Button
              onClick={() => {
                exportMetadataAsJson(results);
                toast.success("Metadata exported successfully!");
              }}
              variant="outline"
              className="mt-2 bg-[#2A2A2E] text-gray-200 border-[#403E43] hover:bg-[#403E43] hover:text-white"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export Metadata
            </Button>
          )}
        </header>
        <main className="flex flex-col gap-8 flex-1 px-2 pb-8">
          <ImageUploader onFilesSelected={onFilesSelected} loading={loading} />
          <ResultTable results={results} isLoading={loading} />
          <div className="text-xs text-gray-500 mt-8 text-center select-none">
            Output fields: subject, creator, date_created, location, event, category, description.<br />
            <span className="font-mono bg-gray-900 text-gray-200 px-2 rounded">file_metadata</span>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
