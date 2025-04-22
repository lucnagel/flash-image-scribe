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
"subject", "creator", "date_created", "location", "event", "category", "description".

The file name is: "${fileName}" - use this for additional context if it contains information like event name, artist/DJ, photographer name, or year. Yearly events include Dekmantel Festival, Lente Kabinet Festival (both in Amsterdam), and Selectors Festival (Croatia).
The subject is the main person or object in the image. The creator is the photographer or artist who created the image. The date_created is the date when the image was taken, in YYYY-MM-DD format. The location is where the image was taken. The event is the name of the event where the image was taken, if applicable. 
The category is a short description of what the image depicts, such as "Event Photography", "Portrait", "DJ Set", etc. The description should be a short sentence describing what is happening in the image.

If any field is unknown, use an empty string. Keep the subject and description short and concise yet specific.

Example:
{"subject":"Jeff Mills","creator":"","date_created":"2023-05-06","location":"Croatia","event":"Selectors Festival","category":"Event Photography","description":"Jeff Mills stands behind two turntables inside a booth surrounded by trees and dancers."}

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
