import pytesseract
from PIL import Image
import re
import cv2
import numpy as np

pytesseract.pytesseract.tesseract_cmd=r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def clean_text(text):
    import re

    lines = text.split("\n")
    cleaned = []

    for line in lines:
        line = line.strip()

        # ❌ empty
        if not line:
            continue

        # ❌ remove line numbers
        line = re.sub(r"^\d+\s*", "", line)

        # ❌ remove x(6) type junk
        if re.match(r"^[a-zA-Z]?\(\d+\)$", line):
            continue

        # ❌ remove time / %
        if "%" in line or re.search(r"\d{1,2}:\d{2}", line):
            continue

        # ❌ remove weird chars
        line = re.sub(r"[^a-zA-Z0-9_().:=\s]", "", line)

        # ❌ REMOVE SMALL JUNK (THIS WAS MISSING 🔥)
        if len(line) < 5:
            continue

        cleaned.append(line)

    text = "\n".join(cleaned)

    #merge broken lines
    text=text.replace("def\n","def")
    text=text.replace("class\n","class")
    text=text.replace("print\n","print")

    # 🔥 spacing fixes
    text = text.replace("def", "\ndef ")
    text = text.replace("class", "\nclass ")
    text = text.replace("print", "\n    print")

    return text.strip()



def extract_text_from_image(image_path):
    try:
        img = cv2.imread(image_path)

        # ❌ check
        if img is None:
            return "Image not found or path wrong"

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

        text = pytesseract.image_to_string(
            thresh,
            config="--oem 3 --psm 6"
        )

        text = clean_text(text)

        return text.strip()

    except Exception as e:
        return f"OCR Error: {str(e)}"

