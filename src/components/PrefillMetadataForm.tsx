import React from "react";
import { ChevronDown } from "lucide-react";

type MetadataFields = {
  subject: string;
  author: string;
  date_created: string;
  location: string;
  event: string;
  category: string;
  description: string;
  tags: string;
  use_ai_analysis: boolean;
};

interface PrefillMetadataFormProps {
  prefillData: Partial<MetadataFields>;
  setPrefillData: React.Dispatch<React.SetStateAction<Partial<MetadataFields>>>;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

const PrefillMetadataForm: React.FC<PrefillMetadataFormProps> = ({
  prefillData,
  setPrefillData,
  expanded,
  setExpanded,
}) => {
  const handleChange = (field: keyof MetadataFields, value: string | boolean) => {
    setPrefillData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="w-full mb-6">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex justify-between items-center cursor-pointer p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          <h3 className="font-medium">Pre-fill Metadata</h3>
        </div>
        <div className="text-sm text-muted-foreground">
          {Object.values(prefillData).filter(Boolean).length > 0
            ? `${Object.values(prefillData).filter(Boolean).length} fields filled`
            : "No fields filled"}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200 p-4 border border-border rounded-lg">
          {/* AI analysis toggle */}
          <div className="bg-amber-100/20 border border-amber-200/30 p-3 rounded-md mb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-medium">AI Analysis</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  AI will analyze images and extract subject, description, and tags.
                  {prefillData.use_ai_analysis === false ? 
                    " Currently disabled." : 
                    " Pre-filled values will be used when provided."}
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="use_ai_analysis"
                  className="mr-2 h-4 w-4"
                  checked={prefillData.use_ai_analysis !== false}
                  onChange={(e) => handleChange("use_ai_analysis", e.target.checked)}
                />
                <label htmlFor="use_ai_analysis" className="text-sm font-medium">
                  Enable AI
                </label>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Pre-fill common metadata fields before batch uploading images. These values will be automatically applied to all images.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600"
                value={prefillData.subject || ""}
                onChange={(e) => handleChange("subject", e.target.value)}
                placeholder="Main subject of images"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="author" className="text-sm font-medium">
                Author
              </label>
              <input
                type="text"
                id="author"
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600"
                value={prefillData.author || ""}
                onChange={(e) => handleChange("author", e.target.value)}
                placeholder="Photographer/Designer/Artist"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="date_created" className="text-sm font-medium">
                Date Created
              </label>
              <input
                type="date"
                id="date_created"
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600"
                value={prefillData.date_created || ""}
                onChange={(e) => handleChange("date_created", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location
              </label>
              <input
                type="text"
                id="location"
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600"
                value={prefillData.location || ""}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Where images were taken"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="event" className="text-sm font-medium">
                Event
              </label>
              <input
                type="text"
                id="event"
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600"
                value={prefillData.event || ""}
                onChange={(e) => handleChange("event", e.target.value)}
                placeholder="Event name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <input
                type="text"
                id="category"
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600"
                value={prefillData.category || ""}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="e.g., Event Photography"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="tags" className="text-sm font-medium">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600"
                value={prefillData.tags || ""}
                onChange={(e) => handleChange("tags", e.target.value)}
                placeholder="Comma-separated keywords"
              />
            </div>
          </div>

          <div className="col-span-full space-y-2 mt-4">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-green-600 min-h-[80px]"
              value={prefillData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="General description for all images"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PrefillMetadataForm;