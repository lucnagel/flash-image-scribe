import React, { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import ResultTable from "@/components/ResultTable";
import { analyzeImage } from "@/lib/gemini";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDown, Image, ArrowRight, Github } from "lucide-react";
import { exportMetadataAsJson } from "@/lib/exportUtils";
import { Badge } from "@/components/ui/badge";

type BatchResult = {
  fileId: string;
  fileName: string;
  fileDataUrl: string | null;
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
  const [results, setResults] = useState<BatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [completedFiles, setCompletedFiles] = useState(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const onFilesSelected = async (files: File[]) => {
    if (!files.length) return;

    setLoading(true);
    setTotalFiles(files.length);
    setCompletedFiles(0);

    const dataUrls = await Promise.all(files.map((f) => fileToDataUrl(f)));

    setResults(
      files.map((file, i) => ({
        fileId: `${file.name}_${file.size}_${Date.now()}`,
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
          setCompletedFiles(prev => prev + 1);
        } catch (e: any) {
          console.error(`Error analyzing ${file.name}:`, e);
          setResults((prev) =>
            prev.map((r, i) =>
              i === idx ? { ...r, metadata: null, status: "failed" } : r
            )
          );
          setCompletedFiles(prev => prev + 1);
          toast.error(`Failed to analyze ${file.name}`);
        }
      })
    );

    setLoading(false);
    toast.success("Batch analysis complete!");
  };

  const handleUpdateMetadata = (updates: { fileId: string; metadata: BatchResult['metadata'] }[]) => {
    setResults(prevResults => {
      const updatedResults = [...prevResults];
      
      updates.forEach(update => {
        const resultIndex = updatedResults.findIndex(r => r.fileId === update.fileId);
        if (resultIndex !== -1 && update.metadata) {
          updatedResults[resultIndex] = {
            ...updatedResults[resultIndex],
            metadata: update.metadata
          };
        }
      });
      
      return updatedResults;
    });

    toast.success(`Updated metadata for ${updates.length} ${updates.length === 1 ? 'image' : 'images'}`);
  };
  
  const handleExport = () => {
    const exportableResults = results
      .filter(result => result.status === "done" && result.metadata)
      .map(result => ({
        fileName: result.fileName,
        ...result.metadata
      }));

    if (exportableResults.length > 0) {
      exportMetadataAsJson(exportableResults);
      toast.success(`Exported metadata for ${exportableResults.length} ${exportableResults.length === 1 ? 'image' : 'images'}`);
    } else {
      toast.error("No processed images to export");
    }
  };

  const hasResults = results.length > 0;
  const completionPercentage = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;
  const successCount = results.filter(r => r.status === "done").length;
  const failedCount = results.filter(r => r.status === "failed").length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className={`sticky top-0 z-10 transition-all backdrop-blur-md ${hasResults ? 'border-b border-border/40' : ''}`}>
        <div className="container mx-auto py-4 px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 p-1.5 rounded-md">
                <Image className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  AI Image Analysis
                </h1>
                <p className="text-xs text-muted-foreground">
                  AI-powered image metadata extraction
                </p>
              </div>
            </div>
            
            {hasResults && (
              <Button
                onClick={handleExport}
                disabled={loading || results.every(r => r.status !== "done")}
                variant="default"
                size="sm"
                className="w-full md:w-auto"
              >
                <FileDown className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
          </div>
          
          {hasResults && loading && (
            <div className="mt-2 h-1 w-full bg-muted/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary/70 transition-all duration-300 ease-out"
                style={{ width: `${completionPercentage}%` }} 
              />
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto flex-1 py-8 flex flex-col px-4">
        {!hasResults ? (
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-full space-y-10">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Automated Image Metadata Assistance
                </h2>
              </div>
              
              <ImageUploader onFilesSelected={onFilesSelected} loading={loading} />
              
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 grid-cols-1">
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {loading ? "Analyzing Images..." : "Analysis Results"}
                  </h2>
                  
                  {!loading && (
                    <div className="text-sm flex items-center gap-x-2">
                      <span className="text-green-600 font-medium">{successCount} successful</span>
                      {failedCount > 0 && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-destructive font-medium">{failedCount} failed</span>
                        </>
                      )}
                       <span className="text-muted-foreground">• {results.length} total</span>
                    </div>
                  )}
                </div>
                
                {!loading && (
                  <p className="text-sm text-muted-foreground">
                    {results.length} image{results.length !== 1 ? 's' : ''} processed.
                  </p>
                )}
              </div>
              
              {!loading && (
                <div>
                  <Button
                    onClick={() => inputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="w-full md:w-auto flex items-center justify-center gap-2"
                  >
                    <Image className="w-4 h-4" />
                    Select More Images
                  </Button>
                  <input 
                    ref={inputRef} 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        onFilesSelected(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                  />
                </div>
              )}
              
              {hasResults && loading && (
                <div className="text-sm text-muted-foreground animate-pulse">
                  Processing {completedFiles} of {totalFiles} images...
                </div>
              )}
            </div>
            
            <ResultTable results={results} isLoading={loading} onUpdateMetadata={handleUpdateMetadata} />
          </div>
        )}
      </main>
      
      <footer className="border-t border-border/40 py-5">
        <div className="container mx-auto px-4">
          <p className="text-xs text-muted-foreground">
            AI Image Analysis by Luc Nagel &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
