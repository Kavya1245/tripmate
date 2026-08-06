import chromadb
import os
from app.core.config import settings

# Create a persistent client so data is saved in a folder called 'chroma_data'
chroma_client = chromadb.PersistentClient(path="chroma_data")

class RagService:
    def __init__(self):
        # Get or create a collection for our travel documents
        self.collection = chroma_client.get_or_create_collection(name="travel_docs")

    def add_document(self, doc_id: str, text: str, metadata: dict = None):
        """Adds a text document to the vector database."""
        # ChromaDB automatically handles the embedding generation for us
        self.collection.add(
            documents=[text],
            ids=[doc_id],
            metadatas=[metadata] if metadata else [{}]
        )

    def search_context(self, query: str, n_results: int = 1) -> str:
        """Searches the database for text most relevant to the user's query."""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        # Extract the retrieved documents
        if results and results['documents']:
            retrieved_docs = results['documents'][0]
            return "\n".join(retrieved_docs)
        return ""
