from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
import uvicorn
from typing import Optional

app = FastAPI(
    title="SIH25240 Text Translation API",
    description="Offline / Internal Network API for OCR and Translation (Nepalese & Sinhalese -> English)",
    version="1.0.0"
)

class TranslationRequest(BaseModel):
    text: str
    source_language: str
    target_language: str = "en"

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    confidence: float

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "SIH25240 Backend"}

@app.post("/api/ocr")
async def extract_text(file: UploadFile = File(...), language: Optional[str] = Form(None)):
    # TODO: Integrate PaddleOCR/EasyOCR here
    return {
        "filename": file.filename,
        "extracted_text": "Sample extracted text stub",
        "detected_language": language or "auto"
    }

@app.post("/api/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    # TODO: Integrate HuggingFace/Transformer model here
    return TranslationResponse(
        original_text=request.text,
        translated_text=f"Translated ({request.source_language} to {request.target_language}): {request.text}",
        source_language=request.source_language,
        confidence=0.99
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
