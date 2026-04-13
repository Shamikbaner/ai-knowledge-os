from fastapi import APIRouter
from pydantic import BaseModel
from app.services.vector_store import search_chunks
from app.services.llm_services import generate_answer


router=APIRouter()

class QueryRequest(BaseModel):
    query:str

@router.post("/search")
def search_docs(request:QueryRequest):
    query=request.query
    chunks,sources=search_chunks(query)

    clean_chunks=[]
    for chunk in chunks:
        if isinstance(chunk,str) and len(chunk.strip()) > 30:
            clean_chunks.append(chunk.strip())
    clean_chunks=clean_chunks[:10]

    query_lower=query.lower()
    boosted_chunks=[]

    for chunk in clean_chunks:
        if any(word in chunk.lower() for word in query_lower.split()):
            boosted_chunks.append(chunk)

    final_chunks=boosted_chunks if boosted_chunks else clean_chunks
    final_chunks=final_chunks[:3]

    context=" ".join(final_chunks)

    print("QUERY:", query)
    print("FINAL CHUNKS: ",final_chunks[:2])


    if not context:
        context=" ".join(clean_chunks[:3])

    answer=generate_answer(query,context)

    sources=list(set(sources))[:3]

    return{
        "answer":answer,
        "sources":sources
    }



