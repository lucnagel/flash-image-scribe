/**
 * Utility to send an image to Gemini Flash for metadata extraction.
 * Uses Gemini 1.5 Flash API.
 */
type MetadataResponse = {
  subject: string;
  author: string;
  date_created: string;
  location: string;
  event: string;
  category: string;
  description: string;
  tags: string; // Comma-separated tags
};

const GEMINI_API_KEY = "AIzaSyBBStBdtFIqw5fWGcChsCuwWEOI-qR-J2M";
// Updated API endpoint to use gemini-1.5-flash model which is the current version
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;

/**
 * Analyze one image file using Gemini Flash and return metadata.
 */
export async function analyzeImage(file: File, prefillData?: Partial<MetadataResponse>): Promise<MetadataResponse | null> {
  // Convert file to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = (reader.result as string).split(",")[1]; // remove data:...;base64,
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Get filename for additional context
  const fileName = file.name || "";

  // Format pre-filled metadata for prompt context
  const prefillContext = prefillData ? Object.entries(prefillData)
    .filter(([_, value]) => value && value.trim() !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n') : '';

// Prompt for metadata extraction
const prompt = `
You are a digital archivist for Dekmantel. Extract metadata from this image as a JSON object with these keys:
"subject", "author", "date_created", "location", "event", "category", "description", "tags"

Filename context: "${fileName}" - use for event names or artist information.
Common events: Dekmantel Festival, Lente Kabinet Festival (Amsterdam), Selectors Festival (Croatia).

${prefillContext ? `Pre-filled metadata (use this exact information):\n${prefillContext}\n` : ''}

Guidelines:
- subject: Main person/object in image, max 4 words.
- author: Photographer/artist name
- date_created: YYYY-MM-DD format
- location: Where image was taken
- event: Event name if applicable
- category: Short descriptor (e.g., "Event Photography", "Portrait", "DJ Set")
- description: Concise sentence describing the image
- tags: Comma-separated keywords (people, mood, colors, effects etc.)

When in doubt, use empty string ("") for unknown fields. Keep subject and description specific but concise. Avoid repeating information in tags. Do not use any dates if its not clear from the image or filename, sometimes numbers might be unrelated to date but used for versioning.

Example:
{"subject":"Jeff Mills","author":"","date_created":"2023-05-06","location":"Croatia","event":"Selectors Festival","category":"Event Photography","description":"Jeff Mills stands behind two turntables inside a booth surrounded by trees and dancers.","tags":"DJ, vinyl, woods, Croatia, Event Photography"}

Return ONLY valid compact JSON with no explanations or commentary.
`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: file.type,
              data: base64,
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024
    }
  };
  
  console.log("Sending request to Gemini API...");
  
  // Call Gemini Flash for vision
  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      console.error("Gemini API error:", res.status, await res.text());
      throw new Error(`Gemini API error: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("Gemini API response:", data);
    
    // Extract JSON object from Gemini's text reply
    try {
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      console.log("Raw text from Gemini:", text);
      const jsonText = text.match(/\{[\s\S]*\}/)?.[0]; // Find first {...}
      if (!jsonText) return null;
      // Remove any trailing commas, just in case
      const clean = jsonText.replace(/,\s*\}/g, "}").replace(/,\s*\]/g, "]");
      return JSON.parse(clean) as MetadataResponse;
    } catch (e) {
      console.error("Error parsing Gemini response:", e);
      return null;
    }
  } catch (e) {
    console.error("Error calling Gemini API:", e);
    return null;
  }
}
