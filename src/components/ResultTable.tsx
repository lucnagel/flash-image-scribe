import React, { useState } from "react";
import { Image as ImageIcon, Check, X, Loader, Edit, Save, Square, CheckSquare } from "lucide-react";
import { cn, generateFilename } from "@/lib/utils";

type Result = {
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

type Props = {
  results: Result[];
  isLoading: boolean;
  onUpdateMetadata?: (updates: { fileId: string; metadata: Result['metadata'] }[]) => void;
};

const ResultTable: React.FC<Props> = ({ results, isLoading, onUpdateMetadata }) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [batchEditing, setBatchEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, Result['metadata']>>({});
  const [batchEditValues, setBatchEditValues] = useState<Partial<Result['metadata']>>({
    subject: "",
    author: "",
    date_created: "",
    location: "",
    event: "",
    category: "",
    description: "",
    tags: "",
    use_ai_analysis: true
  });
  const [batchFieldsToUpdate, setBatchFieldsToUpdate] = useState<Record<string, boolean>>({
    subject: false,
    author: false,
    date_created: false,
    location: false,
    event: false,
    category: false,
    description: false,
    tags: false,
    use_ai_analysis: false
  });
  
  // Function to generate filename preview based on metadata
  const getGeneratedFilename = (metadata: Result['metadata']) => {
    if (!metadata) return "file.jpg";
    
    const pattern = metadata.filename_pattern || "{subject}_{event}";
    return generateFilename(pattern, metadata) + ".jpg";
  };

  if (!results.length) return null;

  const toggleRow = (fileId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  const toggleSelect = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRows(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  const toggleSelectAll = () => {
    if (Object.values(selectedRows).filter(Boolean).length === results.filter(r => r.status === "done").length) {
      // If all are selected, deselect all
      setSelectedRows({});
    } else {
      // Select all done items
      const newSelected: Record<string, boolean> = {};
      results.forEach(result => {
        if (result.status === "done") {
          newSelected[result.fileId] = true;
        }
      });
      setSelectedRows(newSelected);
    }
  };

  const startEdit = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = results.find(r => r.fileId === fileId);
    if (result && result.metadata) {
      setEditValues({
        ...editValues,
        [fileId]: { ...result.metadata }
      });
      setEditingRow(fileId);
    }
  };

  const cancelEdit = () => {
    setEditingRow(null);
  };

  const startBatchEdit = () => {
    setBatchEditing(true);
  };

  const cancelBatchEdit = () => {
    setBatchEditing(false);
    setBatchEditValues({
      subject: "",
      author: "",
      date_created: "",
      location: "",
      event: "",
      category: "",
      description: "",
      tags: "",
      use_ai_analysis: true
    });
    setBatchFieldsToUpdate({
      subject: false,
      author: false,
      date_created: false,
      location: false,
      event: false,
      category: false,
      description: false,
      tags: false,
      use_ai_analysis: false
    });
  };

  const handleEditChange = (fileId: string, field: keyof Result['metadata'], value: string) => {
    setEditValues(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        [field]: value
      }
    }));
  };

  const handleBatchEditChange = (field: keyof Result['metadata'], value: string) => {
    setBatchEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleBatchEditBooleanChange = (field: keyof Result['metadata'], value: boolean) => {
    setBatchEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleBatchField = (field: keyof Result['metadata']) => {
    setBatchFieldsToUpdate(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const saveEdit = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateMetadata && editValues[fileId]) {
      onUpdateMetadata([{ fileId, metadata: editValues[fileId] }]);
    }
    setEditingRow(null);
  };

  const saveBatchEdit = () => {
    if (!onUpdateMetadata) return;

    const selectedFileIds = Object.entries(selectedRows)
      .filter(([_, isSelected]) => isSelected)
      .map(([fileId]) => fileId);
    
    const updates = selectedFileIds.map(fileId => {
      const result = results.find(r => r.fileId === fileId);
      if (!result || !result.metadata) return null;

      const updatedMetadata = { ...result.metadata };
      
      // Only update fields that are checked
      Object.entries(batchFieldsToUpdate).forEach(([field, shouldUpdate]) => {
        if (shouldUpdate && batchEditValues[field as keyof Result['metadata']] !== undefined) {
          const key = field as keyof Result['metadata'];
          // Safe type assertion based on field type
          if (key === 'use_ai_analysis') {
            (updatedMetadata as any)[key] = batchEditValues[key];
          } else {
            (updatedMetadata as any)[key] = batchEditValues[key];
          }
        }
      });

      return { fileId, metadata: updatedMetadata };
    }).filter(Boolean) as { fileId: string; metadata: Result['metadata'] }[];

    if (updates.length > 0) {
      onUpdateMetadata(updates);
    }
    
    setBatchEditing(false);
    cancelBatchEdit();
  };

  const selectedCount = Object.values(selectedRows).filter(Boolean).length;
  const completedResults = results.filter(r => r.status === "done");
  const allSelected = selectedCount === completedResults.length && completedResults.length > 0;

  return (
    <div className="animate-in container-fluid">
      {/* Header with actions */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <h2 className="text-xl font-bold text-foreground">
          Results 
          {results.length > 0 && <span className="text-sm font-normal text-muted-foreground ml-2">({results.length} items)</span>}
        </h2>
        
        <div className="flex items-center space-x-3">
          {selectedCount > 0 && !batchEditing && (
            <button
              onClick={startBatchEdit}
              className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              Edit {selectedCount} selected
            </button>
          )}
        </div>
      </div>

      {/* Batch selection info banner */}
      {selectedCount > 0 && !batchEditing && (
        <div className="mb-4 p-3 bg-muted rounded-lg flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{selectedCount} item{selectedCount !== 1 ? 's' : ''} selected</span>
            <button 
              onClick={() => setSelectedRows({})} 
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear
            </button>
          </div>
          <button
            onClick={startBatchEdit}
            className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Edit Selected
          </button>
        </div>
      )}

      {/* Batch edit form */}
      {batchEditing && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-card shadow-sm animate-in fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Batch Edit {selectedCount} item{selectedCount !== 1 ? 's' : ''}</h3>
            <div className="text-sm text-muted-foreground">
              Select fields to update
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="batch-subject" 
                  checked={batchFieldsToUpdate.subject} 
                  onChange={() => toggleBatchField('subject')}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="batch-subject" className="text-sm font-medium">Subject</label>
              </div>
              <input
                type="text"
                disabled={!batchFieldsToUpdate.subject}
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600 disabled:opacity-50"
                value={batchEditValues.subject}
                onChange={(e) => handleBatchEditChange('subject', e.target.value)}
                placeholder="Subject"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="batch-author" 
                  checked={batchFieldsToUpdate.author} 
                  onChange={() => toggleBatchField('author')}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="batch-author" className="text-sm font-medium">author</label>
              </div>
              <input
                type="text"
                disabled={!batchFieldsToUpdate.author}
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600 disabled:opacity-50"
                value={batchEditValues.author}
                onChange={(e) => handleBatchEditChange('author', e.target.value)}
                placeholder="author"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="batch-date" 
                  checked={batchFieldsToUpdate.date_created} 
                  onChange={() => toggleBatchField('date_created')}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="batch-date" className="text-sm font-medium">Date</label>
              </div>
              <input
                type="text"
                disabled={!batchFieldsToUpdate.date_created}
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600 disabled:opacity-50"
                value={batchEditValues.date_created}
                onChange={(e) => handleBatchEditChange('date_created', e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="batch-location" 
                  checked={batchFieldsToUpdate.location} 
                  onChange={() => toggleBatchField('location')}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="batch-location" className="text-sm font-medium">Location</label>
              </div>
              <input
                type="text"
                disabled={!batchFieldsToUpdate.location}
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600 disabled:opacity-50"
                value={batchEditValues.location}
                onChange={(e) => handleBatchEditChange('location', e.target.value)}
                placeholder="Location"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="batch-event" 
                  checked={batchFieldsToUpdate.event} 
                  onChange={() => toggleBatchField('event')}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="batch-event" className="text-sm font-medium">Event</label>
              </div>
              <input
                type="text"
                disabled={!batchFieldsToUpdate.event}
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600 disabled:opacity-50"
                value={batchEditValues.event}
                onChange={(e) => handleBatchEditChange('event', e.target.value)}
                placeholder="Event"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="batch-category" 
                  checked={batchFieldsToUpdate.category} 
                  onChange={() => toggleBatchField('category')}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="batch-category" className="text-sm font-medium">Category</label>
              </div>
              <input
                type="text"
                disabled={!batchFieldsToUpdate.category}
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600 disabled:opacity-50"
                value={batchEditValues.category}
                onChange={(e) => handleBatchEditChange('category', e.target.value)}
                placeholder="Category"
              />
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="batch-tags" 
                  checked={batchFieldsToUpdate.tags} 
                  onChange={() => toggleBatchField('tags')}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="batch-tags" className="text-sm font-medium">Tags</label>
              </div>
              <input
                type="text"
                disabled={!batchFieldsToUpdate.tags}
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600 disabled:opacity-50"
                value={batchEditValues.tags}
                onChange={(e) => handleBatchEditChange('tags', e.target.value)}
                placeholder="Comma-separated tags"
              />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="batch-description" 
                checked={batchFieldsToUpdate.description} 
                onChange={() => toggleBatchField('description')}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="batch-description" className="text-sm font-medium">Description</label>
            </div>
            <textarea
              disabled={!batchFieldsToUpdate.description}
              className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600 disabled:opacity-50 min-h-[80px]"
              value={batchEditValues.description}
              onChange={(e) => handleBatchEditChange('description', e.target.value)}
              placeholder="Description"
            />
          </div>

          {/* AI Analysis toggle */}
          <div className="border-t border-border pt-4 mb-6">
            <h4 className="text-sm font-medium mb-3">AI Analysis</h4>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="batch-use-ai-analysis" 
                  checked={batchFieldsToUpdate.use_ai_analysis}
                  onChange={() => toggleBatchField('use_ai_analysis')}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor="batch-use-ai-analysis" className="text-sm">
                  Use AI Analysis
                </label>
              </div>
              
              {batchFieldsToUpdate.use_ai_analysis && (
                <div className="pl-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="batch-ai-enabled"
                      checked={batchEditValues.use_ai_analysis === true}
                      onChange={(e) => handleBatchEditBooleanChange('use_ai_analysis', e.target.checked)}
                      className="mr-2 h-4 w-4"
                    />
                    <label htmlFor="batch-ai-enabled" className="text-sm">
                      Enable AI analysis for selected images
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI will analyze images and extract subject, description, and tags.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={cancelBatchEdit}
              className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveBatchEdit}
              disabled={!Object.values(batchFieldsToUpdate).some(Boolean)}
              className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              Apply to Selected
            </button>
          </div>
        </div>
      )}

      {/* Table view - now the only view option */}
      <div className="table-container">
        <div className="table-responsive">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/80 backdrop-blur-sm backdrop-filter border-b border-border">
                <th className="w-10 px-4 py-3">
                  <div 
                    className="cursor-pointer flex items-center justify-center"
                    onClick={toggleSelectAll}
                  >
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-green-500" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Image</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">File</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Subject</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">author</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Date</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Location</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Tags</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left w-1/4 xl:w-1/3 2xl:w-1/4 3xl:w-1/5">Description</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.map(({ fileId, fileName, fileDataUrl, metadata, status }) => (
                <tr 
                  key={fileId} 
                  className={cn(
                    "transition-colors hover:bg-muted/30",
                    status === "analyzing" && "bg-secondary/5",
                    selectedRows[fileId] && "bg-green-50/5"
                  )}
                >
                  <td className="w-10 px-4 py-3">
                    {status === "done" && (
                      <div 
                        className="cursor-pointer flex items-center justify-center"
                        onClick={(e) => toggleSelect(fileId, e)}
                      >
                        {selectedRows[fileId] ? (
                          <CheckSquare className="w-4 h-4 text-green-500" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-14 h-14 rounded-md overflow-hidden bg-muted/30 border border-muted flex items-center justify-center">
                      {fileDataUrl ? (
                        <img 
                          src={fileDataUrl} 
                          alt={fileName} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-muted-foreground/60" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                        {metadata?.original_filename || fileName}
                      </span>
                      {metadata && metadata.subject && (
                        <span className="text-xs text-blue-600 truncate max-w-[180px] mt-0.5">
                          → {getGeneratedFilename(metadata)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingRow === fileId ? (
                      <input
                        type="text"
                        className="w-full px-2 py-1 rounded border border-primary/30 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        value={editValues[fileId]?.subject || ""}
                        onChange={(e) => handleEditChange(fileId, 'subject', e.target.value)}
                      />
                    ) : metadata?.subject || (
                      status === "analyzing" ? (
                        <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                      ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingRow === fileId ? (
                      <input
                        type="text"
                        className="w-full px-2 py-1 rounded border border-primary/30 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        value={editValues[fileId]?.author || ""}
                        onChange={(e) => handleEditChange(fileId, 'author', e.target.value)}
                      />
                    ) : metadata?.author || (
                      status === "analyzing" ? (
                        <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                      ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingRow === fileId ? (
                      <input
                        type="text"
                        className="w-full px-2 py-1 rounded border border-primary/30 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        value={editValues[fileId]?.date_created || ""}
                        onChange={(e) => handleEditChange(fileId, 'date_created', e.target.value)}
                      />
                    ) : metadata?.date_created || (
                      status === "analyzing" ? (
                        <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                      ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingRow === fileId ? (
                      <input
                        type="text"
                        className="w-full px-2 py-1 rounded border border-primary/30 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        value={editValues[fileId]?.location || ""}
                        onChange={(e) => handleEditChange(fileId, 'location', e.target.value)}
                      />
                    ) : metadata?.location || (
                      status === "analyzing" ? (
                        <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                      ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingRow === fileId ? (
                      <input
                        type="text"
                        className="w-full px-2 py-1 rounded border border-primary/30 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        value={editValues[fileId]?.tags || ""}
                        onChange={(e) => handleEditChange(fileId, 'tags', e.target.value)}
                      />
                    ) : metadata?.tags ? (
                      <div className="flex flex-wrap gap-1">
                        {metadata.tags.split(',').map((tag, i) => (
                          tag.trim() && (
                            <span key={i} className="px-1.5 py-0.5 bg-accent/20 text-xs rounded">
                              {tag.trim()}
                            </span>
                          )
                        ))}
                      </div>
                    ) : status === "analyzing" ? (
                      <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                    ) : (
                      <span className="text-muted-foreground italic">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs">
                    {editingRow === fileId ? (
                      <textarea
                        className="w-full px-2 py-1 rounded border border-primary/30 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        value={editValues[fileId]?.description || ""}
                        onChange={(e) => handleEditChange(fileId, 'description', e.target.value)}
                        rows={2}
                      />
                    ) : metadata?.description ? (
                      <div className="line-clamp-3 text-sm font-medium" title={metadata.description}>
                        {metadata.description}
                      </div>
                    ) : status === "analyzing" ? (
                      <div className="h-8 w-full bg-muted/50 rounded animate-pulse" />
                    ) : (
                      <span className="text-muted-foreground italic">No description available</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {status === "done" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                        <Check className="w-3.5 h-3.5" /> Analyzed
                      </span>
                    ) : status === "analyzing" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                        <Loader className="w-3.5 h-3.5 animate-spin" /> Analyzing
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                        <X className="w-3.5 h-3.5" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {status === "done" && (
                      <>
                        {editingRow === fileId ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => saveEdit(fileId, e)}
                              className="p-1.5 rounded-md bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                              title="Save"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={cancelEdit}
                              className="p-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => startEdit(fileId, e)}
                            className="p-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                            title="Edit metadata"
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Empty state */}
      {results.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No images to analyze</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Upload images to extract metadata using AI
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultTable;
