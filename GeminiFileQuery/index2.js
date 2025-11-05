"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var genai_1 = require("@google/genai");
var fs = require("fs");
var path = require("path");
// --- Configuration ---
var MODEL_NAME = 'gemini-2.5-flash';
var PDF_PATHS = [
    './MarketsTaxation.pdf', // <-- REPLACE with your actual file paths
    // './data/report_q2_2024.pdf',
    // './data/report_q3_2024.pdf',
    // './data/marketing_plan.pdf',
    // './data/budget_summary.pdf',
    // './data/competitor_analysis.pdf', // 6th file
];
var PROMPT_TEXT = "\nYou have been provided with 6 different documents.\nPlease analyze all of them and provide a unified, structured summary in markdown format.\nThe summary must include:\n1. A **Consolidated Executive Summary** of the overall findings.\n2. A **Comparative Analysis** section highlighting the key differences and similarities across the reports.\n3. A list of **5 Actionable Recommendations** based on the collective data.\n";
// ---------------------
var GEMINI_API_KEY = "";
var ai = new genai_1.GoogleGenAI({ apiKey: GEMINI_API_KEY });
/**
 * Uploads all PDFs, generates content, and cleans up the files.
 */
function analyzeMultiplePdfs(pdfPaths, prompt) {
    return __awaiter(this, void 0, void 0, function () {
        var uploadedFiles, _i, pdfPaths_1, filePath, uploadedFile, error_1, errorMessage, fileParts, contents, response, error_2, errorMessage, _a, uploadedFiles_1, file, error_3;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    uploadedFiles = [];
                    // --- Step 1: Upload All Files ---
                    console.log("\n--- 1. Starting Upload of ".concat(pdfPaths.length, " Files ---"));
                    _i = 0, pdfPaths_1 = pdfPaths;
                    _c.label = 1;
                case 1:
                    if (!(_i < pdfPaths_1.length)) return [3 /*break*/, 6];
                    filePath = pdfPaths_1[_i];
                    if (!fs.existsSync(filePath)) {
                        console.error("\n\uD83D\uDEA8 ERROR: File not found at path: ".concat(filePath, ". Skipping..."));
                        return [3 /*break*/, 5];
                    }
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, ai.files.upload({
                            file: filePath,
                            config: {
                                mimeType: 'application/pdf',
                                displayName: path.basename(filePath),
                            },
                        })];
                case 3:
                    uploadedFile = _c.sent();
                    uploadedFiles.push(uploadedFile);
                    console.log("\u2705 Uploaded: ".concat(uploadedFile.displayName, " (Name: ").concat(uploadedFile.name, ")"));
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _c.sent();
                    errorMessage = error_1 instanceof Error ? error_1.message : 'Unknown error';
                    console.error("\n\u274C ERROR uploading ".concat(filePath, ":"), errorMessage);
                    // Stop if a critical upload fails
                    return [2 /*return*/];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    if (uploadedFiles.length === 0) {
                        console.log('\nNo files were successfully uploaded. Exiting.');
                        return [2 /*return*/];
                    }
                    fileParts = uploadedFiles.map(function (file) { return ({
                        fileData: {
                            fileUri: file.uri,
                            mimeType: file.mimeType,
                        },
                    }); });
                    contents = __spreadArray(__spreadArray([], fileParts, true), [{ text: prompt }], false);
                    // --- Step 3: Generate Content ---
                    console.log('\n--- 2. Generating Content with Multi-PDF Prompt ---');
                    _c.label = 7;
                case 7:
                    _c.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, ai.models.generateContent({
                            model: MODEL_NAME,
                            contents: contents,
                        })];
                case 8:
                    response = _c.sent();
                    console.log('\n--- Model Response Summary ---');
                    console.log(response.text);
                    // Optional: Log token usage to monitor limits
                    if ((_b = response.usageMetadata) === null || _b === void 0 ? void 0 : _b.promptTokenCount) {
                        console.log("\nToken Usage: ".concat(response.usageMetadata.promptTokenCount, " input tokens"));
                    }
                    return [3 /*break*/, 10];
                case 9:
                    error_2 = _c.sent();
                    errorMessage = error_2 instanceof Error ? error_2.message : 'Unknown error';
                    console.error('\n❌ ERROR during content generation:', errorMessage);
                    return [3 /*break*/, 10];
                case 10:
                    // --- Step 4: Clean Up Uploaded Files ---
                    console.log("\n--- 3. Cleaning Up ".concat(uploadedFiles.length, " Uploaded Files ---"));
                    _a = 0, uploadedFiles_1 = uploadedFiles;
                    _c.label = 11;
                case 11:
                    if (!(_a < uploadedFiles_1.length)) return [3 /*break*/, 16];
                    file = uploadedFiles_1[_a];
                    _c.label = 12;
                case 12:
                    _c.trys.push([12, 14, , 15]);
                    return [4 /*yield*/, ai.files.delete({ name: file.name })];
                case 13:
                    _c.sent();
                    console.log("\uD83D\uDDD1\uFE0F Deleted: ".concat(file.displayName));
                    return [3 /*break*/, 15];
                case 14:
                    error_3 = _c.sent();
                    console.warn("\u26A0\uFE0F Warning: Failed to delete file ".concat(file.name, ". You may need to delete it manually."));
                    return [3 /*break*/, 15];
                case 15:
                    _a++;
                    return [3 /*break*/, 11];
                case 16: return [2 /*return*/];
            }
        });
    });
}
// --- Execute ---
analyzeMultiplePdfs(PDF_PATHS, PROMPT_TEXT);
