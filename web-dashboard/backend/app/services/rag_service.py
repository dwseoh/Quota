"""RAG (Retrieval-Augmented Generation) service using LangChain and FAISS."""

import os
from typing import List, Optional
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.schema import Document
from app.config import settings


class RAGService:
    """Service for RAG functionality with vector search."""
    
    def __init__(self):
        """Initialize RAG service with knowledge base."""
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        # Initialize embeddings
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=settings.gemini_api_key
        )
        
        # Initialize vector store
        self.vector_store: Optional[FAISS] = None
        
        # Build knowledge base
        self._build_knowledge_base()
    
    def _build_knowledge_base(self):
        """Build the knowledge base from architecture documentation.
        
        Note: This uses embeddings API only during initialization (once).
        Per-request retrieval uses vector search only (no API calls).
        """
        documents = self._create_knowledge_documents()
        
        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        chunks = text_splitter.split_documents(documents)
        
        # Create vector store (uses embeddings API once during initialization)
        self.vector_store = FAISS.from_documents(chunks, self.embeddings)
    
    def _create_knowledge_documents(self) -> List[Document]:
        """Create knowledge base documents about architecture components and best practices."""
        docs = []
        
        # Component categories and use cases
        docs.append(Document(page_content="""
        Backend Frameworks:
        - FastAPI: Modern Python framework, great for APIs, fast performance
        - Express: Popular Node.js framework, flexible and lightweight
        - Django: Full-featured Python framework, great for complex applications
        - Flask: Lightweight Python framework, minimal and flexible
        - Spring Boot: Java framework, enterprise-grade, comprehensive
        - NestJS: TypeScript framework, scalable Node.js applications
        - Go/Gin: High performance, concurrent processing, microservices
        """))
        
        docs.append(Document(page_content="""
        Frontend Frameworks:
        - React: Component-based, large ecosystem, widely used
        - Next.js: React framework with SSR, great for production apps
        - Vue: Progressive framework, easy to learn, good performance
        - Svelte: Compile-time framework, small bundle size
        - Angular: Full-featured TypeScript framework, enterprise apps
        """))
        
        docs.append(Document(page_content="""
        Databases:
        - PostgreSQL: Relational, ACID compliant, complex queries, open source
        - MySQL: Relational, widely used, good performance
        - MongoDB: NoSQL, document-based, flexible schema
        - Supabase: PostgreSQL-based, includes auth and storage, great for startups
        - Firebase: Real-time database, serverless, Google ecosystem
        - Redis: In-memory, caching, pub/sub, fast performance
        - DynamoDB: NoSQL, AWS managed, auto-scaling
        """))
        
        docs.append(Document(page_content="""
        Hosting Platforms:
        - Vercel: Serverless, great for Next.js, auto-scaling, edge functions
        - Netlify: JAMstack hosting, continuous deployment, edge network
        - AWS EC2: Virtual servers, full control, scalable
        - GCP Compute: Google Cloud, flexible VM instances
        - Azure VM: Microsoft cloud, enterprise integration
        - Railway: Simple deployment, automatic scaling, good for small projects
        - Render: Managed hosting, easy setup, good documentation
        - Cloud Run: Serverless containers, pay per use, Google Cloud
        """))
        
        docs.append(Document(page_content="""
        Cost Optimization Guidelines:
        1. Use serverless hosting (Vercel, Netlify, Cloud Run) for small to medium apps - lower costs with auto-scaling
        2. Consider open-source databases (PostgreSQL, MySQL) over managed services for cost savings
        3. Use caching (Redis) to reduce database load and costs
        4. Start with free tiers (Supabase, Firebase) before scaling up
        5. Monitor costs with monitoring tools (Prometheus is free)
        6. Use CDN (Cloudflare) for static assets to reduce bandwidth costs
        7. Consider self-hosted solutions for high-traffic applications
        """))
        
        docs.append(Document(page_content="""
        Architecture Best Practices:
        1. Always separate frontend and backend for scalability
        2. Use a database for persistent data storage
        3. Add caching layer (Redis) for high-traffic applications
        4. Use authentication service for user management
        5. Add monitoring for production applications
        6. Implement CI/CD for automated deployments
        7. Use message queues for async processing
        8. Consider multi-region deployment for global apps
        """))
        
        docs.append(Document(page_content="""
        Common Architecture Patterns:
        - Simple Web App: Frontend + Backend + Database + Hosting
        - Full-Stack with Auth: Frontend + Backend + Database + Auth + Hosting
        - High-Performance: Frontend + Backend + Database + Cache + CDN + Hosting
        - ML/AI Application: Frontend + Backend + Database + ML Framework + Storage + Hosting
        - Microservices: Multiple Backends + Database + Message Queue + Hosting
        """))
        
        docs.append(Document(page_content="""
        Authentication Options:
        - Auth0: Comprehensive auth service, good for enterprise, paid
        - Clerk: Modern auth, great UX, good developer experience
        - Supabase Auth: Free tier, PostgreSQL integration, open source
        - Firebase Auth: Free tier, Google ecosystem, easy integration
        - Custom JWT: Full control, no cost, requires implementation
        - NextAuth.js: For Next.js apps, free, open source
        - AWS Cognito: AWS ecosystem integration, scalable
        """))
        
        docs.append(Document(page_content="""
        When to use which database:
        - PostgreSQL: Complex queries, relational data, ACID requirements
        - MySQL: Traditional relational needs, widely supported
        - MongoDB: Flexible schema, JSON documents, rapid development
        - Supabase: PostgreSQL with extras (auth, storage), startup-friendly
        - Firebase: Real-time sync, mobile apps, serverless
        - Redis: Caching, session storage, pub/sub messaging
        - DynamoDB: AWS ecosystem, auto-scaling, NoSQL needs
        """))
        
        return docs
    
    def retrieve_context(self, query: str, top_k: Optional[int] = None) -> str:
        """
        Retrieve relevant context from knowledge base.
        
        IMPORTANT: This method only performs vector search (no API calls).
        All API calls happen during initialization only.
        
        Args:
            query: User query
            top_k: Number of documents to retrieve (defaults to config)
            
        Returns:
            Concatenated context from retrieved documents
        """
        if not self.vector_store:
            return ""
        
        k = top_k or settings.rag_top_k
        
        # Search for similar documents (vector search only - no API call)
        docs = self.vector_store.similarity_search(query, k=k)
        
        # Combine document contents
        context_parts = [doc.page_content for doc in docs]
        return "\n\n".join(context_parts)
