from fastapi import FastAPI
from app.routes import document_routes
from app.routes import search_routes
from fastapi.middleware.cors import CORSMiddleware
from app.routes import ocr

app=FastAPI(title="AI Knowledge OS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(document_routes.router)
app.include_router(search_routes.router)
app.include_router(ocr.router)
@app.get("/")
def home():
    return {"message":"AI Knowledge OS Running"}
