from app.services.ocr_service import extract_text_from_image

text=extract_text_from_image("test.png")
print("Extracted text: ")
print(text)
