from fastapi import APIRouter,UploadFile,File
from sympy import im
from app.services.ocr_service import extract_text_from_image

router=APIRouter()

@router.post("/ocr")
async def ocr_image(file:UploadFile=File(...)):
    contents=await file.read()
    with open("temp.png","wb") as f:
        f.write(contents)
    text=extract_text_from_image("temp.png")
    return{"text":text}
