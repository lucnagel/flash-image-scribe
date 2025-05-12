import React, { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import ResultTable from "@/components/ResultTable";
import { analyzeImage } from "@/lib/gemini";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDown, Image, ArrowRight, Github } from "lucide-react";
import { exportMetadataAsJson } from "@/lib/exportUtils";
import { Badge } from "@/components/ui/badge"; // Added import for Badge

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
    <div className="min-h-screen flex flex-col bg-background"> {/* Subtle gradient removed */}
      {/* Fixed header with progress information */}
      <header className={`sticky top-0 z-10 transition-all backdrop-blur-md ${hasResults ? 'border-b border-border/40' : ''}`}> {/* Enhanced glass effect */}
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8"> {/* Adjusted padding */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 p-1.5 rounded-md">
                <Image className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Flash Image Scribe
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

      <main className="container mx-auto flex-1 py-8 flex flex-col px-4 sm:px-6 lg:px-8"> {/* Adjusted padding */}
        {!hasResults ? (
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center items-center text-center"> {/* Centered and constrained width */}
            <div className="w-full space-y-10 animate-in fade-in-50 duration-500"> {/* Adjusted spacing and animation */}
              <div className="space-y-3">
                <h2 className="text-2xl font-bold tracking-tight text-gradient sm:text-3xl"> {/* Enhanced title - adjusted size */}
                  Automated Image Metadata Assistance
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-base"> {/* Adjusted text size */}
                  Upload your images. AI will help extract 'Category' and 'Description'.
                  You can manually edit these and add other details like 'Subject', 'Creator', 'Date', 'Location', and 'Event'.
                </p>
              </div>
              
              <ImageUploader onFilesSelected={onFilesSelected} loading={loading} />
              
              <div className="pt-4"> {/* Adjusted padding */}
                <h3 className="font-medium mb-3 text-sm text-muted-foreground">Available metadata fields:</h3> {/* Subtle heading */}
                <div className="flex flex-wrap justify-center gap-2">
                  {["Subject", "Creator", "Date", "Location", "Event", "Category", "Description"].map((field) => (
                    <Badge key={field} variant="secondary" className="text-xs"> {/* Used Badge component */}
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8"> {/* Increased spacing */}
            <div className="grid gap-4 md:gap-6 grid-cols-1"> {/* Simplified grid for results header */}
              <div className="space-y-1.5"> {/* Adjusted spacing */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight"> {/* Enhanced title */}
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
              
              {/* Secondary uploader when results are already shown */}
              {!loading && (
                <div>
                  <Button
                    onClick={() => inputRef.current?.click()}
                    variant="outline" // Kept outline for secondary action
                    size="sm" // Standardized button size
                    className="w-full md:w-auto flex items-center justify-center gap-2" // Responsive width, removed h-10
                  >
                    <Image className="w-4 h-4" />
                    Select More Images
                    {/* <ArrowRight className="w-3.5 h-3.5 ml-auto md:ml-2" /> Removed arrow for cleaner look */}
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
      
      <footer className="border-t border-border/40 py-5"> {/* Adjusted padding and border */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8"> {/* Consistent padding */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2"> {/* Adjusted gap */}
            <p className="text-xs text-muted-foreground"> {/* Adjusted text size */}
              Flash Image Scribe by Luc Nagel &copy; {new Date().getFullYear()}
            </p>
            {/* Optional: Add Github link or other links here if desired */}
            {/* <Button variant="ghost" size="icon" asChild>
              <a href="YOUR_GITHUB_REPO_LINK_HERE" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
              </a>
            </Button> */}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
