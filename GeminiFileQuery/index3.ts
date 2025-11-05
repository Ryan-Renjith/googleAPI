import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
const MODEL_NAME = 'gemini-2.5-flash';
const PORT = 3000;

const app = express();

const GEMINI_API_KEY = "";

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

interface AnalysisResult {
  success: boolean;
  summary?: string;
  tokenUsage?: number;
  filesAnalyzed?: number;
  error?: string;
}

/**
 * Uploads all PDFs, generates content, and cleans up the files.
 */
async function analyzeMultiplePdfs(pdfPaths: string[], prompt: string): Promise<AnalysisResult> {
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
      return {
        success: false,
        error: `Failed to upload file: ${errorMessage}`
      };
    }
  }
  
  if (uploadedFiles.length === 0) {
    console.log('\nNo files were successfully uploaded. Exiting.');
    return {
      success: false,
      error: 'No files were successfully uploaded'
    };
  }
  
  // --- Step 2: Construct Contents Array ---
  const fileParts: FileDataPart[] = uploadedFiles.map(file => ({
    fileData: {
      fileUri: file.uri,
      mimeType: file.mimeType,
    },
  }));
  
  const contents: ContentPart[] = [...fileParts, { text: prompt }];
  
  // --- Step 3: Generate Content ---
  console.log('\n--- 2. Generating Content with Multi-PDF Prompt ---');
  let responseText: string | undefined = '';
  let tokenUsage: number = 0;
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
    });
    
    responseText = response.text;
    tokenUsage = response.usageMetadata?.promptTokenCount || 0;
    
    console.log('\n--- Model Response Generated ---');
    console.log(`Token Usage: ${tokenUsage} input tokens`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('\n❌ ERROR during content generation:', errorMessage);
    
    // Clean up files even on error
    await cleanupFiles(uploadedFiles);
    
    return {
      success: false,
      error: `Content generation failed: ${errorMessage}`
    };
  }
  
  // --- Step 4: Clean Up Uploaded Files ---
  await cleanupFiles(uploadedFiles);
  
  return {
    success: true,
    summary: responseText,
    tokenUsage: tokenUsage,
    filesAnalyzed: uploadedFiles.length
  };
}

/**
 * Helper function to clean up uploaded files
 */
async function cleanupFiles(uploadedFiles: UploadedFile[]): Promise<void> {
  console.log(`\n--- 3. Cleaning Up ${uploadedFiles.length} Uploaded Files ---`);
  for (const file of uploadedFiles) {
    try {
      await ai.files.delete({ name: file.name });
      console.log(`🗑️ Deleted: ${file.displayName}`);
    } catch (error) {
      console.warn(`⚠️ Warning: Failed to delete file ${file.name}`);
    }
  }
}

// --- API Endpoints ---

/**
 * GET /analyze
 * Query params:
 *   - files: comma-separated list of PDF file paths (optional, uses default if not provided)
 *   - prompt: custom prompt text (optional, uses default if not provided)
 */
app.get('/analyze', async (req: Request, res: Response) => {
  try {
    // Parse file paths from query string
    const filesParam = req.query.files as string | undefined;
    const pdfPaths = filesParam 
      ? filesParam.split(',').map(f => f.trim())
      : [
          './MarketsTaxation.pdf',
        ];
    
    // Use custom prompt or default
    const customPrompt = req.query.prompt as string | undefined;
    const prompt = customPrompt || `
You have been provided with ${pdfPaths.length} different documents.
Please analyze all of them and provide a unified, structured summary in markdown format.
The summary must include:
1. A **Consolidated Executive Summary** of the overall findings.
2. A **Comparative Analysis** section highlighting the key differences and similarities across the reports.
3. A list of **5 Actionable Recommendations** based on the collective data.
`;
    
    console.log(`\n📊 API Request received to analyze ${pdfPaths.length} files`);
    
    const result = await analyzeMultiplePdfs(pdfPaths, prompt);
    
    if (result.success) {
      console.log(result);        
      res.json(result);
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ API Error:', errorMessage);
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * GET /health
 * Simple health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /
 * API documentation
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Multi-PDF Analyzer API',
    endpoints: {
      'GET /analyze': {
        description: 'Analyze multiple PDF files using Gemini AI',
        queryParams: {
          files: 'Comma-separated list of PDF file paths (optional)',
          prompt: 'Custom prompt for analysis (optional)'
        },
        example: '/analyze?files=./data/file1.pdf,./data/file2.pdf'
      },
      'GET /health': {
        description: 'Health check endpoint'
      }
    }
  });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`\n🚀 Multi-PDF Analyzer API running on http://localhost:${PORT}`);
  console.log(`📖 Visit http://localhost:${PORT} for API documentation`);
  console.log(`🔍 Example: http://localhost:${PORT}/analyze\n`);
});