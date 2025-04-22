import React, { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import ResultTable from "@/components/ResultTable";
import PrefillMetadataForm from "@/components/PrefillMetadataForm";
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
    author: string;
    date_created: string;
    location: string;
    event: string;
    category: string;
    description: string;
    tags: string; // Comma-separated tags
    original_filename?: string;
    keep_original_filename?: boolean;
    filename_pattern?: string;
    use_ai_analysis?: boolean;
  } | null;
  status: "analyzing" | "done" | "failed";
};

type PrefillMetadata = Partial<BatchResult['metadata']>;

const Index = () => {
  const [results, setResults] = useState<BatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [completedFiles, setCompletedFiles] = useState(0);
  const [analysisStart, setAnalysisStart] = useState<number | null>(null);
  const [analysisEnd, setAnalysisEnd] = useState<number | null>(null);
  const [prefillData, setPrefillData] = useState<PrefillMetadata>({
    use_ai_analysis: true
  });
  const [prefillExpanded, setPrefillExpanded] = useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleImagesSelected = async (files: File[], originalFilenames?: Record<string, string>) => {
    if (loading || files.length === 0) return;
    
    setLoading(true);
    setAnalysisStart(Date.now());
    setTotalFiles(files.length);
    setCompletedFiles(0);
    
    // Generate data URLs for previewing
    const dataUrls = await Promise.all(
      files.map(file => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl);
        };
        reader.readAsDataURL(file);
      }))
    );
    
    const newResults = files.map((file, i) => ({
      fileId: `${file.name}_${file.size}_${Date.now()}`,
      fileName: file.name,
      fileDataUrl: dataUrls[i],
      metadata: null,
      status: "analyzing" as const,
    }));

    // Append new results to existing ones instead of replacing them
    setResults(prevResults => [...prevResults, ...newResults]);

    // Process each new file
    await Promise.all(
      files.map(async (file, idx) => {
        try {
          // Merge prefill data with filename settings and always store original filename
          const enhancedPrefillData = {
            ...prefillData,
            original_filename: file.name,
            filename_pattern: "{subject}_{event}"
          };
          
          // If AI analysis is disabled, we'll skip the API call and use only prefill data
          let metadata;
          if (prefillData.use_ai_analysis === false) {
            metadata = {
              ...enhancedPrefillData,
              subject: enhancedPrefillData.subject || "",
              author: enhancedPrefillData.author || "",
              date_created: enhancedPrefillData.date_created || "",
              location: enhancedPrefillData.location || "",
              event: enhancedPrefillData.event || "",
              category: enhancedPrefillData.category || "",
              description: enhancedPrefillData.description || "",
              tags: enhancedPrefillData.tags || "",
              use_ai_analysis: false
            };
          } else {
            metadata = await analyzeImage(file, enhancedPrefillData);
            // Ensure we always store the original filename
            if (metadata) {
              metadata.original_filename = file.name;
              metadata.use_ai_analysis = true;
            }
          }
          
          setResults((prev) => {
            // Find the correct result to update (offset by the length of previous results)
            const resultIndex = prev.length - files.length + idx;
            return prev.map((r, i) =>
              i === resultIndex ? { ...r, metadata, status: "done" } : r
            );
          });
          setCompletedFiles(prev => prev + 1);
        } catch (e: any) {
          console.error(`Error analyzing ${file.name}:`, e);
          setResults((prev) => {
            // Find the correct result to update
            const resultIndex = prev.length - files.length + idx;
            return prev.map((r, i) =>
              i === resultIndex ? { ...r, metadata: null, status: "failed" } : r
            );
          });
          setCompletedFiles(prev => prev + 1);
          toast.error(`Failed to analyze ${file.name}`);
        }
      })
    );

    setLoading(false);
    setAnalysisEnd(Date.now());
    toast.success(`Completed analysis of ${files.length} image${files.length !== 1 ? 's' : ''}!`);
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
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col justify-center items-center">
            <div className="w-full space-y-8 animate-in">
              
              {/* Add PrefillMetadataForm component here */}
              <PrefillMetadataForm 
                prefillData={prefillData} 
                setPrefillData={setPrefillData}
                expanded={prefillExpanded}
                setExpanded={setPrefillExpanded}
              />
              
              <ImageUploader onFilesSelected={handleImagesSelected} loading={loading} />
              
              <div className="text-center pt-6">
                <h3 className="font-medium mb-2">Extraction fields include:</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {["Subject", "author", "Date", "Location", "Event", "Category", "Description", "Tags"].map((field) => (
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
            {/* Always display the uploader at the top when results are showing */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="mb-2">
                    <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                      <Image className="w-5 h-5 text-muted-foreground" />
                      Add more images
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Newly added images will be processed while preserving existing results
                    </p>
                  </div>
                  
                  {/* Add PrefillMetadataForm component here too */}
                  <PrefillMetadataForm 
                    prefillData={prefillData} 
                    setPrefillData={setPrefillData}
                    expanded={prefillExpanded}
                    setExpanded={setPrefillExpanded}
                  />
                  
                  {loading ? (
                    <div className="p-4 bg-muted/30 rounded-lg text-center">
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="h-2 w-32 bg-muted rounded-full mb-2"></div>
                        <span className="text-sm text-muted-foreground">
                          Processing {completedFiles} of {totalFiles} images...
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="flex-1 w-full">
                        <Button
                          onClick={() => inputRef.current?.click()}
                          variant="outline"
                          className="w-full h-10 flex items-center justify-center gap-2"
                        >
                          <Image className="w-4 h-4" />
                          Select Images
                          <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                        </Button>
                        <input 
                          ref={inputRef} 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={(e) => {
                            if (e.target.files?.length) {
                              handleImagesSelected(Array.from(e.target.files));
                            }
                          }}
                          className="hidden"
                        />
                      </div>
                      <div className="text-center sm:text-left flex items-center text-sm text-muted-foreground">
                        <span className="text-green-500 font-medium mr-1">{successCount}</span> successful
                        {failedCount > 0 && (
                          <>
                            <span className="mx-1 text-muted-foreground">•</span>
                            <span className="text-destructive font-medium mr-1">{failedCount}</span> failed
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <ResultTable results={results} isLoading={loading} onUpdateMetadata={handleUpdateMetadata} />
            </div>
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
