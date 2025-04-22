import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a filename based on a pattern and metadata
 * @param pattern Pattern string with placeholders like {subject}_{event}
 * @param metadata Object containing values to replace placeholders
 * @returns Generated filename string
 */
export function generateFilename(pattern: string, metadata: Record<string, any>): string {
  let filename = pattern;
  
  // Replace placeholders with metadata values
  Object.entries(metadata).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      filename = filename.replace(`{${key}}`, value.trim());
    }
  });
  
  // Clean up the filename
  filename = filename
    .replace(/\s+/g, '_')         // Replace spaces with underscores
    .replace(/_{2,}/g, '_')       // Replace multiple underscores with single
    .replace(/^_|_$/g, '')        // Remove leading/trailing underscores
    .replace(/[^\w\-\.]/g, '_');  // Replace any other invalid filename chars
  
  return filename || 'file';
}
