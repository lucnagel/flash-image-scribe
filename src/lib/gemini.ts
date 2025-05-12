/**
 * Utility to send an image to Gemini Flash for metadata extraction.
 * Uses Gemini 1.5 Flash API.
 */
type MetadataResponse = {
  subject: string;
  creator: string;
  date_created: string;
  location: string;
  event: string;
  category: string;
  description: string;
};

const GEMINI_API_KEY = "AIzaSyBBStBdtFIqw5fWGcChsCuwWEOI-qR-J2M";
// Updated API endpoint to use gemini-1.5-flash model which is the current version
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;

/**
 * Analyze one image file using Gemini Flash and return metadata.
 */
export async function analyzeImage(file: File): Promise<MetadataResponse | null> {
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

  // Prompt Gemini for metadata extraction
  const prompt = `
You are a digital archivist working for Dekmantel. Analyze the attached image file and extract the following metadata as accurately as possible. Output your answer ONLY as a JSON object with these keys:
"category", "description".

The file name is: "${fileName}" - use this for additional context if it contains information like event name, artist/DJ, photographer name, or date.

If any field is unknown, use an empty string. Keep the description short and concise yet specific.

Example:
{"category":"Event Photography","description":"Jeff Mills stands behind two turntables inside a booth surrounded by trees and dancers."}

Give no explanation or commentary, ONLY valid compact JSON.
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
      const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      console.log("Raw text from Gemini:", textResponse);

      let jsonString = null;
      // Try to extract JSON from markdown code block first
      const markdownMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (markdownMatch && markdownMatch[1]) {
        jsonString = markdownMatch[1];
      } else {
        // Fallback to finding the first occurrence of a JSON object
        const plainJsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (plainJsonMatch && plainJsonMatch[0]) {
          jsonString = plainJsonMatch[0];
        }
      }

      if (!jsonString) {
        console.error("No JSON object found in Gemini response text.");
        return null;
      }

      // Clean the extracted JSON string (trim whitespace)
      const cleanedJsonString = jsonString.trim();
      
      let parsedObject: any;
      try {
        parsedObject = JSON.parse(cleanedJsonString);
      } catch (parseError) {
        console.error("Error parsing JSON from Gemini:", parseError, "Attempted to parse:", cleanedJsonString);
        return null;
      }

      // Ensure the parsed object is a valid object and not an array or primitive
      if (typeof parsedObject !== 'object' || parsedObject === null || Array.isArray(parsedObject)) {
        console.error("Parsed JSON is not a valid object for metadata. Parsed value:", parsedObject);
        return null;
      }

      const metadataKeys: (keyof MetadataResponse)[] = [
        "subject", "creator", "date_created", "location", 
        "event", "category", "description"
      ];
      const sanitizedMetadata: Partial<MetadataResponse> = {};

      for (const key of metadataKeys) {
        const value = parsedObject[key];
        if (typeof value === 'string') {
          sanitizedMetadata[key] = value;
        } else if (value === null || value === undefined) {
          // Adhere to prompt's request for empty string for unknowns
          sanitizedMetadata[key] = ""; 
        } else {
          // If Gemini returned a non-string/non-null type, convert to string and log
          console.warn(`Gemini returned a non-string value for '${key}': ${JSON.stringify(value)}. Converting to string.`);
          sanitizedMetadata[key] = String(value);
        }
      }
      
      return sanitizedMetadata as MetadataResponse;

    } catch (e) { // This outer catch is for unexpected errors during the processing logic itself
      console.error("Error processing Gemini response structure:", e);
      return null;
    }
  } catch (e) {
    console.error("Error calling Gemini API:", e);
    return null;
  }
}
