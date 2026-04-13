from fastapi import APIRouter,UploadFile,File
from pathlib import Path
from pypdf import PdfReader
from app.services.document_processor import chunk_text
from app.services.vector_store import store_chunks

router=APIRouter()

#Absolute project path
BASE_DIR=Path(__file__).resolve().parents[2]
UPLOAD_FOLDER=BASE_DIR/"data"/"uploads"

#Ensure Folder Exists
UPLOAD_FOLDER.mkdir(parents=True,exist_ok=True)

@router.post("/upload")
async def upload_file(file:UploadFile=File(...)):

    filename=str(file.filename)
    file_path=UPLOAD_FOLDER/filename

    #Save Uploaded File
    with open(file_path,"wb") as f:
        contents=await file.read()
        f.write(contents)
    #Extract Text
    reader=PdfReader(str(file_path))
    text=""

    for page in reader.pages:
        extracted=page.extract_text()
        if extracted:
            text += extracted
    chunks=chunk_text(text)
    store_chunks(chunks,filename)

    return{
        "filename":filename,
        "text_length":len(text),
        "chunks_created":len(chunks),
        "preview":text[:500]
    }

