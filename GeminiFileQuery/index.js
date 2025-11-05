import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

const GEMINI_API_KEY = "";

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

/**
 * Uploads a PDF and asks Gemini 2.5 Flash to summarize it.
 * @param {string} filePath The local path to the PDF files.
 */
async function summarizePdf(filePath) {
  // 1. --- Upload the File to the Gemini API ---
  console.log(`Uploading file: ${filePath}...`);
  const uploadedFile = await ai.files.upload({
    file: filePath,
    config: {
      mimeType: 'application/pdf',
      // Optional: Set a display name for the file
      displayName: path.basename(filePath), 
    },
  });

  console.log(`File uploaded successfully! File Name: ${uploadedFile.name}`);
  console.log(`File URI: ${uploadedFile.uri}`);
  
  // 2. --- Generate Content with the File Reference and Prompt ---
  const promptText = "You are a professional summarization specialist. Please provide a concise executive summary of this document, including 3-5 key takeaways. Response should be in key value pairs that is Point 1, Point 2. etc as the keys.";

  const contents = [
    // Part 1: The uploaded file reference
    {
      fileData: {
        fileUri: uploadedFile.uri,
        mimeType: uploadedFile.mimeType,
      },
    },
    // Part 2: The text prompt
    {
      text: promptText,
    },
  ];

  console.log('Generating summary...');
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
  });

  // 3. --- Output the Summary and Clean Up ---
  console.log('\n--- Summary ---');
  console.log(response);

  // Clean up: Delete the file from the service after use
  console.log(`\nDeleting file ${uploadedFile.name}...`);
  await ai.files.delete({ name: uploadedFile.name });
  console.log('File deleted.');
}

// --- Execution ---
const pdfPath = './MarketsTaxation.pdf'; 

if (!fs.existsSync(pdfPath)) {
  console.error(`ERROR: PDF file not found at ${pdfPath}. Please update the path.`);
} else {
  summarizePdf(pdfPath).catch(error => {
    console.error('An error occurred during the API call:', error);
  });
}