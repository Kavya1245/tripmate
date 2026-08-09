class RagService:
    def __init__(self):
        # LAZY LOAD: Only import chromadb when this service is instantiated
        import chromadb
        self.chroma_client = chromadb.PersistentClient(path="chroma_data")
        self.collection = self.chroma_client.get_or_create_collection(name="travel_docs")

    def add_document(self, doc_id: str, text: str, metadata: dict = None):
        self.collection.add(documents=[text], ids=[doc_id], metadatas=[metadata] if metadata else [{}])

    def search_context(self, query: str, n_results: int = 1) -> str:
        results = self.collection.query(query_texts=[query], n_results=n_results)
        if results and results['documents']:
            return "\n".join(results['documents'][0])
        return ""
