import React, { useState } from "react";
import { Image as ImageIcon, Check, X, Loader, ChevronDown, ChevronUp, Edit, Save, Square, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Result = {
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
    creator: "",
    date_created: "",
    location: "",
    event: "",
    category: "",
    description: ""
  });
  const [batchFieldsToUpdate, setBatchFieldsToUpdate] = useState<Record<string, boolean>>({
    subject: false,
    creator: false,
    date_created: false,
    location: false,
    event: false,
    category: false,
    description: false
  });

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
      creator: "",
      date_created: "",
      location: "",
      event: "",
      category: "",
      description: ""
    });
    setBatchFieldsToUpdate({
      subject: false,
      creator: false,
      date_created: false,
      location: false,
      event: false,
      category: false,
      description: false
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
          updatedMetadata[field as keyof Result['metadata']] = batchEditValues[field as keyof Result['metadata']] as string;
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
    <div className="w-full animate-in">
      {/* Batch edit controls */}
      {selectedCount > 0 && !batchEditing && (
        <div className="mb-4 p-3 bg-muted rounded-lg flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{selectedCount} item{selectedCount !== 1 ? 's' : ''} selected</span>
            <Button 
              onClick={() => setSelectedRows({})} 
              variant="link"
              className="text-xs h-auto p-0"
            >
              Clear
            </Button>
          </div>
          <Button
            onClick={startBatchEdit}
            size="sm"
          >
            Edit Selected
          </Button>
        </div>
      )}

      {/* Batch edit form */}
      {batchEditing && (
        <div className="mb-4 p-4 border border-border rounded-lg bg-card shadow-sm animate-in fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Batch Edit {selectedCount} item{selectedCount !== 1 ? 's' : ''}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="batch-subject" 
                  checked={batchFieldsToUpdate.subject} 
                  onCheckedChange={() => toggleBatchField('subject')}
                />
                <Label htmlFor="batch-subject" className="text-sm font-medium">Subject</Label>
              </div>
              <Input
                type="text"
                disabled={!batchFieldsToUpdate.subject}
                value={batchEditValues.subject}
                onChange={(e) => handleBatchEditChange('subject', e.target.value)}
                placeholder="Subject"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="batch-creator" 
                  checked={batchFieldsToUpdate.creator} 
                  onCheckedChange={() => toggleBatchField('creator')}
                />
                <Label htmlFor="batch-creator" className="text-sm font-medium">Creator</Label>
              </div>
              <Input
                type="text"
                disabled={!batchFieldsToUpdate.creator}
                value={batchEditValues.creator}
                onChange={(e) => handleBatchEditChange('creator', e.target.value)}
                placeholder="Creator"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="batch-date" 
                  checked={batchFieldsToUpdate.date_created} 
                  onCheckedChange={() => toggleBatchField('date_created')}
                />
                <Label htmlFor="batch-date" className="text-sm font-medium">Date</Label>
              </div>
              <Input
                type="text"
                disabled={!batchFieldsToUpdate.date_created}
                value={batchEditValues.date_created}
                onChange={(e) => handleBatchEditChange('date_created', e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="batch-location" 
                  checked={batchFieldsToUpdate.location} 
                  onCheckedChange={() => toggleBatchField('location')}
                />
                <Label htmlFor="batch-location" className="text-sm font-medium">Location</Label>
              </div>
              <Input
                type="text"
                disabled={!batchFieldsToUpdate.location}
                value={batchEditValues.location}
                onChange={(e) => handleBatchEditChange('location', e.target.value)}
                placeholder="Location"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="batch-event" 
                  checked={batchFieldsToUpdate.event} 
                  onCheckedChange={() => toggleBatchField('event')}
                />
                <Label htmlFor="batch-event" className="text-sm font-medium">Event</Label>
              </div>
              <Input
                type="text"
                disabled={!batchFieldsToUpdate.event}
                value={batchEditValues.event}
                onChange={(e) => handleBatchEditChange('event', e.target.value)}
                placeholder="Event"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="batch-category"
                  checked={batchFieldsToUpdate.category}
                  onCheckedChange={() => toggleBatchField('category')}
                />
                <Label htmlFor="batch-category" className="text-sm font-medium">Category</Label>
              </div>
              <Input
                type="text"
                disabled={!batchFieldsToUpdate.category}
                value={batchEditValues.category}
                onChange={(e) => handleBatchEditChange('category', e.target.value)}
                placeholder="Category"
              />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="batch-description" 
                checked={batchFieldsToUpdate.description} 
                onCheckedChange={() => toggleBatchField('description')}
              />
              <Label htmlFor="batch-description" className="text-sm font-medium">Description</Label>
            </div>
            <Textarea
              disabled={!batchFieldsToUpdate.description}
              value={batchEditValues.description}
              onChange={(e) => handleBatchEditChange('description', e.target.value)}
              placeholder="Description"
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={cancelBatchEdit}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={saveBatchEdit}
              disabled={!Object.values(batchFieldsToUpdate).some(Boolean)}
            >
              Apply to Selected
            </Button>
          </div>
        </div>
      )}

      {/* Desktop view - traditional table with description column */}
      <div className="hidden lg:block w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    aria-label="Select all rows"
                    checked={allSelected} 
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Image</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">File</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Subject</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Creator</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Date</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Location</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Event</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Category</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-left w-1/4">Description</th>
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
                      <Checkbox
                        aria-label={`Select row ${fileName}`}
                        checked={selectedRows[fileId]} 
                        onCheckedChange={(e) => toggleSelect(fileId, e as unknown as React.MouseEvent)}
                      />
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
                        {fileName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fileName.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingRow === fileId ? (
                      <Input
                        type="text"
                        value={editValues[fileId]?.subject || ""}
                        onChange={(e) => handleEditChange(fileId, 'subject', e.target.value)}
                        className="h-8"
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
                      <Input
                        type="text"
                        value={editValues[fileId]?.creator || ""}
                        onChange={(e) => handleEditChange(fileId, 'creator', e.target.value)}
                        className="h-8"
                      />
                    ) : metadata?.creator || (
                      status === "analyzing" ? (
                        <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                      ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingRow === fileId ? (
                      <Input
                        type="text"
                        value={editValues[fileId]?.date_created || ""}
                        onChange={(e) => handleEditChange(fileId, 'date_created', e.target.value)}
                        className="h-8"
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
                      <Input
                        type="text"
                        value={editValues[fileId]?.location || ""}
                        onChange={(e) => handleEditChange(fileId, 'location', e.target.value)}
                        className="h-8"
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
                      <Input
                        type="text"
                        value={editValues[fileId]?.event || ""}
                        onChange={(e) => handleEditChange(fileId, 'event', e.target.value)}
                        className="h-8"
                      />
                    ) : metadata?.event || (
                      status === "analyzing" ? (
                        <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                      ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingRow === fileId ? (
                      <Input
                        type="text"
                        value={editValues[fileId]?.category || ""}
                        onChange={(e) => handleEditChange(fileId, 'category', e.target.value)}
                        className="h-8"
                      />
                    ) : metadata?.category || (
                      status === "analyzing" ? (
                        <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                      ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingRow === fileId ? (
                      <Textarea
                        value={editValues[fileId]?.description || ""}
                        onChange={(e) => handleEditChange(fileId, 'description', e.target.value)}
                        rows={2}
                        className="min-w-[200px]"
                      />
                    ) : metadata?.description ? (
                      <div className="text-sm font-medium" title={metadata.description}>
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
                            <Button
                              onClick={(e) => saveEdit(fileId, e)}
                              variant="ghost"
                              size="icon"
                              title="Save"
                            >
                              <Save className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button
                              onClick={cancelEdit}
                              variant="ghost"
                              size="icon"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={(e) => startEdit(fileId, e)}
                            variant="ghost"
                            size="icon"
                            title="Edit metadata"
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
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

      {/* Mobile/Tablet view - card-based layout with prominent description */}
      <div className="lg:hidden space-y-3">
        {results.map(({ fileId, fileName, fileDataUrl, metadata, status }) => (
          <div 
            key={fileId}
            className={cn(
              "border border-border rounded-lg overflow-hidden bg-card shadow-sm transition-all",
              expandedRows[fileId] ? "card-hover" : "",
              status === "analyzing" && "bg-secondary/5",
              selectedRows[fileId] && "bg-green-50/5"
            )}
          >
            <div className="flex items-center gap-3 p-3">
              {status === "done" && (
                <Checkbox
                  aria-label={`Select card ${fileName}`}
                  checked={selectedRows[fileId]} 
                  onCheckedChange={(e) => toggleSelect(fileId, e as unknown as React.MouseEvent)}
                  className="mr-1"
                />
              )}
              
              <div 
                className="flex-1 flex items-center gap-3 cursor-pointer"
                onClick={() => toggleRow(fileId)}
              >
                <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-muted/30 border border-muted flex items-center justify-center">
                  {fileDataUrl ? (
                    <img src={fileDataUrl} alt={fileName} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-muted-foreground/60" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-foreground truncate max-w-[180px]">{fileName}</p>
                    {status === "done" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : status === "analyzing" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                        <Loader className="w-3 h-3 animate-spin" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                        <X className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {status === "done" 
                      ? `${metadata?.subject || 'Untitled'} • ${metadata?.creator || 'Unknown'} • ${metadata?.category || 'N/A'}`
                      : status === "analyzing" 
                        ? "Analyzing metadata..."
                        : "Analysis failed"
                    }
                  </p>

                  {/* Preview description even when collapsed */}
                  {status === "done" && metadata?.description && (
                    <p className="text-xs mt-1 line-clamp-1 text-foreground/80 italic">
                      "{metadata.description}"
                    </p>
                  )}
                </div>
                
                {expandedRows[fileId] ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              
              {/* Edit button for mobile */}
              {status === "done" && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editingRow === fileId) {
                      saveEdit(fileId, e);
                    } else {
                      startEdit(fileId, e);
                    }
                  }}
                  variant="ghost"
                  size="icon"
                  title={editingRow === fileId ? "Save" : "Edit metadata"}
                  className="ml-auto flex-shrink-0"
                >
                  {editingRow === fileId ? (
                    <Save className="w-4 h-4 text-green-500" />
                  ) : (
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              )}
            </div>
            
            {/* Expandable content with prominent description */}
            {expandedRows[fileId] && (
              <div className="border-t border-border px-3 py-3 bg-muted/10 animate-slide-down">
                {editingRow === fileId ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                      <Textarea
                        value={editValues[fileId]?.description || ""}
                        onChange={(e) => handleEditChange(fileId, 'description', e.target.value)}
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Subject</Label>
                        <Input
                          type="text"
                          value={editValues[fileId]?.subject || ""}
                          onChange={(e) => handleEditChange(fileId, 'subject', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Creator</Label>
                        <Input
                          type="text"
                          value={editValues[fileId]?.creator || ""}
                          onChange={(e) => handleEditChange(fileId, 'creator', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Date</Label>
                        <Input
                          type="text"
                          value={editValues[fileId]?.date_created || ""}
                          onChange={(e) => handleEditChange(fileId, 'date_created', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Location</Label>
                        <Input
                          type="text"
                          value={editValues[fileId]?.location || ""}
                          onChange={(e) => handleEditChange(fileId, 'location', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Event</Label>
                        <Input
                          type="text"
                          value={editValues[fileId]?.event || ""}
                          onChange={(e) => handleEditChange(fileId, 'event', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                        <Input
                          type="text"
                          value={editValues[fileId]?.category || ""}
                          onChange={(e) => handleEditChange(fileId, 'category', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        onClick={cancelEdit}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={(e) => saveEdit(fileId, e)}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Description first - full width and prominent */}
                    {metadata?.description && (
                      <div className="mb-4 pb-3 border-b border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                        <p className="text-sm leading-relaxed font-medium">"{metadata.description}"</p>
                      </div>
                    )}
                    
                    {/* Other metadata in grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Subject</p>
                        <p className="text-sm">{metadata?.subject || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Creator</p>
                        <p className="text-sm">{metadata?.creator || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Date</p>
                        <p className="text-sm">{metadata?.date_created || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Location</p>
                        <p className="text-sm">{metadata?.location || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Event</p>
                        <p className="text-sm">{metadata?.event || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Category</p>
                        <p className="text-sm">{metadata?.category || "N/A"}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultTable;
