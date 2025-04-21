
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

  // Prompt Gemini for metadata extraction
  const prompt = `
You are a digital archivist. Analyze the attached image file and extract the following metadata as accurately as possible. Output your answer ONLY as a JSON object with these keys:
"subject", "creator", "date_created", "location", "event", "category", "description".

If any field is unknown, use an empty string.

Example:
{"subject":"dog","creator":"","date_created":"2023-05-06","location":"New York","event":"","category":"animal","description":"A brown dog lies on a blue sofa."}

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
