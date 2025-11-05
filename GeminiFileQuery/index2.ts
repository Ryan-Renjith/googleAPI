import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
const MODEL_NAME = 'gemini-2.5-flash';
const PDF_PATHS: string[] = [
  './MarketsTaxation.pdf',  // <-- REPLACE with your actual file paths
  // './data/report_q2_2024.pdf',
  // './data/report_q3_2024.pdf',
  // './data/marketing_plan.pdf',
  // './data/budget_summary.pdf',
  // './data/competitor_analysis.pdf', // 6th file
];

const PROMPT_TEXT = `
You have been provided with 6 different documents.
Please analyze all of them and provide a unified, structured summary in markdown format.
The summary must include:
1. A **Consolidated Executive Summary** of the overall findings.
2. A **Comparative Analysis** section highlighting the key differences and similarities across the reports.
3. A list of **5 Actionable Recommendations** based on the collective data.
`;

// ---------------------



const GEMINI_API_KEY = "AIzaSyBk0SDAl_Y8NWrWMTj1wjUc_OvFwuRqyZY";

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

interface UploadedFile {
  name: string;
  displayName: string;
  uri: string;
  mimeType: string;
}

interface FileDataPart {
  fileData: {
    fileUri: string;
    mimeType: string;
  };
}

interface TextPart {
  text: string;
}

type ContentPart = FileDataPart | TextPart;

/**
 * Uploads all PDFs, generates content, and cleans up the files.
 */
async function analyzeMultiplePdfs(pdfPaths: string[], prompt: string): Promise<void> {
  const uploadedFiles: UploadedFile[] = [];
  
  // --- Step 1: Upload All Files ---
  console.log(`\n--- 1. Starting Upload of ${pdfPaths.length} Files ---`);
  
  for (const filePath of pdfPaths) {
    if (!fs.existsSync(filePath)) {
      console.error(`\n🚨 ERROR: File not found at path: ${filePath}. Skipping...`);
      continue;
    }
    
    try {
      const uploadedFile = await ai.files.upload({
        file: filePath,
        config: {
          mimeType: 'application/pdf',
          displayName: path.basename(filePath),
        },
      }) as UploadedFile;
      
      uploadedFiles.push(uploadedFile);
      console.log(`✅ Uploaded: ${uploadedFile.displayName} (Name: ${uploadedFile.name})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\n❌ ERROR uploading ${filePath}:`, errorMessage);
      // Stop if a critical upload fails
      return; 
    }
  }
  
  if (uploadedFiles.length === 0) {
    console.log('\nNo files were successfully uploaded. Exiting.');
    return;
  }
  
  // --- Step 2: Construct Contents Array ---
  // The contents array starts with all the file references
  const fileParts: FileDataPart[] = uploadedFiles.map(file => ({
    fileData: {
      fileUri: file.uri,
      mimeType: file.mimeType,
    },
  }));
  
  // Append the text prompt as the last part
  const contents: ContentPart[] = [...fileParts, { text: prompt }];
  
  // --- Step 3: Generate Content ---
  console.log('\n--- 2. Generating Content with Multi-PDF Prompt ---');
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
    });
    
    console.log('\n--- Model Response Summary ---');
    console.log(response.text);
    
    // Optional: Log token usage to monitor limits
    if (response.usageMetadata?.promptTokenCount) {
      console.log(`\nToken Usage: ${response.usageMetadata.promptTokenCount} input tokens`);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('\n❌ ERROR during content generation:', errorMessage);
  }
  
  // --- Step 4: Clean Up Uploaded Files ---
  console.log(`\n--- 3. Cleaning Up ${uploadedFiles.length} Uploaded Files ---`);
  for (const file of uploadedFiles) {
    try {
      await ai.files.delete({ name: file.name });
      console.log(`🗑️ Deleted: ${file.displayName}`);
    } catch (error) {
      console.warn(`⚠️ Warning: Failed to delete file ${file.name}. You may need to delete it manually.`);
    }
  }
}

// --- Execute ---
analyzeMultiplePdfs(PDF_PATHS, PROMPT_TEXT);