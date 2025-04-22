import React, { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import ResultTable from "@/components/ResultTable";
import { analyzeImage } from "@/lib/gemini";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDown, Image, ArrowRight, Github } from "lucide-react";
import { exportMetadataAsJson } from "@/lib/exportUtils";

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
  const [analysisStart, setAnalysisStart] = useState<number | null>(null);
  const [analysisEnd, setAnalysisEnd] = useState<number | null>(null);
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
    setAnalysisStart(Date.now());
    setAnalysisEnd(null);

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
    setAnalysisEnd(Date.now());
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

    // Show a success toast
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      {/* Fixed header with progress information */}
      <header className={`sticky top-0 z-10 transition-all ${hasResults ? 'glass-effect' : 'bg-transparent'}`}>
        <div className="container py-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-700/20 p-2 rounded-lg">
                <Image className="w-7 h-7 text-gray-300" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                  Image Analysis
                </h1>
                <p className="text-muted-foreground text-sm">
                  AI-powered batch image metadata extraction
                </p>
              </div>
            </div>
            
            {hasResults && (
              <div className="flex flex-wrap gap-3 justify-end items-center">
                {loading && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500" 
                        style={{ width: `${completionPercentage}%` }} 
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{completionPercentage}%</span>
                  </div>
                )}
                
                <Button
                  onClick={handleExport}
                  disabled={loading || results.every(r => r.status !== "done")}
                  className="h-9"
                  variant="outline"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Export Metadata
                </Button>
              </div>
            )}
          </div>
          
          {hasResults && loading && (
            <div className="h-1 w-full bg-muted mt-5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500" 
                style={{ width: `${completionPercentage}%` }} 
              />
            </div>
          )}
        </div>
      </header>

      <main className="container flex-1 py-6 flex flex-col">
        {!hasResults ? (
          <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center items-center">
            <div className="w-full space-y-8 animate-in">
              <div className="space-y-4 text-center">
                <h2 className="text-xl font-bold tracking-tighter text-gradient">
                  Automated Image Metadata Extraction
                </h2>
                <p className="text-muted-foreground max-w-4xl mx-auto">
                  Upload your images to automatically extract comprehensive metadata using AI.
                </p>
              </div>
              
              <ImageUploader onFilesSelected={onFilesSelected} loading={loading} />
              
              <div className="text-center pt-6">
                <h3 className="font-medium mb-2">Extraction fields include:</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {["Subject", "Creator", "Date", "Location", "Event", "Category", "Description"].map((field) => (
                    <span key={field} className="px-2 py-1 bg-muted text-xs rounded-md">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`grid gap-6 ${hasResults ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {loading ? "Analyzing Images..." : "Analysis Results"}
                  </h2>
                  
                  {!loading && (
                    <div className="text-sm">
                      <span className="text-green-500">{successCount}</span>
                      <span className="text-muted-foreground"> successful</span>
                      {failedCount > 0 && (
                        <>
                          <span className="mx-1 text-muted-foreground">•</span>
                          <span className="text-destructive">{failedCount}</span>
                          <span className="text-muted-foreground"> failed</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {!loading && (
                  <p className="text-sm text-muted-foreground">
                    {results.length} image{results.length !== 1 ? 's' : ''} processed. 
                    {analysisStart && analysisEnd && (
                      <span className="ml-2 text-green-600 font-semibold">
                        (Completed in {((analysisEnd - analysisStart) / 1000).toFixed(2)}s)
                      </span>
                    )}
                    Click to analyze more images.
                  </p>
                )}
              </div>
              
              {/* Secondary uploader when results are already shown */}
              {!loading && (
                <div>
                  <Button
                    onClick={() => inputRef.current?.click()}
                    variant="outline"
                    className="w-full h-10 flex items-center justify-center gap-2"
                  >
                    <Image className="w-4 h-4" />
                    Select More Images
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
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
      
      <footer className="border-t border-border py-4">
        <div className="container">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Flash Image Scribe by Luc Nagel &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
