from sentence_transformers import SentenceTransformer
import chromadb

model = SentenceTransformer("all-MiniLM-L6-v2")

client = chromadb.Client()
collection = client.get_or_create_collection(name="documents")


def store_chunks(chunks, filename):
    for i, chunk in enumerate(chunks):
        embedding = model.encode(chunk).tolist()

        collection.add(
            documents=[chunk],
            embeddings=[embedding],
            ids=[f"{filename}_{i}"],
            metadatas=[{"source": filename}]
        )


def search_chunks(query,top_k=10):
    query_embedding=model.encode(query).tolist()

    results=collection.query(query_embeddings=[query_embedding],n_results=top_k)

    docs=[]
    sources=[]

    if not results:
        print("❌No results from DB")
        return[],[]

    if "documents" in results and results["documents"]:
        if results["documents"][0]:
            docs=results["documents"][0]

    if "metadatas" in results and results["metadatas"]:
        if results["metadatas"][0]:
            metadata_list=results["metadatas"][0]

            for m in metadata_list:
                if m and "source" in m:
                    sources.append(m["source"])
    print("FOUND DOCS:",len(docs))

    return docs,sources



