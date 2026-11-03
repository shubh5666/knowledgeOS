const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const ai = require("../config/gemini");

/**
 * Resolves a file path across multiple possible working directories.
 */
const resolveFilePath = (filePath) => {
    if (fs.existsSync(filePath)) return filePath;

    const fromCwd = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(fromCwd)) return fromCwd;

    const fromBackend = path.resolve(__dirname, "../../", filePath);
    if (fs.existsSync(fromBackend)) return fromBackend;

    const uploadsDir = path.resolve(__dirname, "../uploads", path.basename(filePath));
    if (fs.existsSync(uploadsDir)) return uploadsDir;

    return filePath;
};

/**
 * Multimodal OCR using Gemini to transcribe scanned documents, images, and marksheets.
 */
const extractTextWithGemini = async (filePath, mimeType = "application/pdf") => {
    const resolvedPath = resolveFilePath(filePath);
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Document file not found at path: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(resolvedPath);
    const base64Data = fileBuffer.toString("base64");

    const prompt = `You are an expert document OCR and transcription assistant.
Extract and transcribe ALL information from this document accurately and completely:
1. Candidate/person details: Name, Roll Number, Registration/Certificate Number, Mother's Name, Father's Name, Institution/School, Dates, and Addresses.
2. Academic/Financial tables: Subject names, subject codes, theory/practical/internal marks, totals, grades, and overall status/result.
3. Keep the transcription structured with clear headings and readable formatting.
4. Do not omit any numbers, codes, or text present in the document.`;

    const candidateModels = [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-flash-latest",
    ];

    let lastError = null;
    for (const model of candidateModels) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                inlineData: {
                                    data: base64Data,
                                    mimeType: mimeType || "application/pdf",
                                },
                            },
                            { text: prompt },
                        ],
                    },
                ],
            });

            if (response && response.text && response.text.trim().length > 0) {
                return response.text.trim();
            }
        } catch (err) {
            lastError = err;
            console.warn(`[OCR] Model ${model} unavailable: ${err.message}. Retrying fallback...`);
        }
    }

    throw lastError || new Error("Failed to extract text from document using OCR");
};

/**
 * Universal text extractor:
 * Attempts fast native PDF parsing first. If the file is scanned/image-based or text is negligible,
 * falls back to Gemini Multimodal OCR.
 */
const extractText = async (filePath, mimeType = "application/pdf") => {
    const resolvedPath = resolveFilePath(filePath);
    let parsedText = "";

    const isPdf = !mimeType || mimeType === "application/pdf" || resolvedPath.toLowerCase().endsWith(".pdf");
    if (isPdf && fs.existsSync(resolvedPath)) {
        try {
            const buffer = fs.readFileSync(resolvedPath);
            const data = await pdf(buffer);
            parsedText = data.text ? data.text.trim() : "";
        } catch (pdfErr) {
            console.warn("[PDF Parser] Native stream extraction skipped, using OCR:", pdfErr.message);
        }
    }

    // If substantial alphanumeric text exists (> 40 chars), use it directly
    const validCharacters = parsedText.replace(/\s+/g, "").length;
    if (validCharacters >= 40) {
        return parsedText;
    }

    // Scanned PDF, image, or minimal text document -> Fall back to Gemini Multimodal OCR
    return await extractTextWithGemini(resolvedPath, mimeType);
};

module.exports = {
    extractText,
    extractTextWithGemini,
    resolveFilePath,
};
