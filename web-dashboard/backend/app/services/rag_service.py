"""RAG (Retrieval-Augmented Generation) service using LangChain and FAISS."""

import os
from typing import List, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
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
        
        # Index persistence path
        self.index_path = "faiss_index"
        
        # Build knowledge base
        self._build_knowledge_base()
    
    def _build_knowledge_base(self):
        """Build the knowledge base from architecture documentation.
        
        Note: Checks for local index first to save API calls.
        """
        # Try to load existing index
        if os.path.exists(self.index_path):
            try:
                self.vector_store = FAISS.load_local(
                    self.index_path, 
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                print("Loaded FAISS index from disk.")
                return
            except Exception as e:
                print(f"Failed to load index: {e}, rebuilding...")

        # If loading failed or didn't exist, rebuild
        try:
            documents = self._create_knowledge_documents()
            
            # Split documents into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len,
            )
            chunks = text_splitter.split_documents(documents)
            
            # Create vector store
            self.vector_store = FAISS.from_documents(chunks, self.embeddings)
            
            # Save index to disk
            self.vector_store.save_local(self.index_path)
            print("Created and saved new FAISS index.")
        except Exception as e:
            error_msg = str(e)
            if "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
                print(f"⚠️  API quota exceeded. RAG disabled until quota resets. Error: {e}")
                print("💡 The chatbot will still work but without architecture knowledge context.")
                self.vector_store = None
            else:
                # Re-raise other errors
                raise
    
    def _create_knowledge_documents(self) -> List[Document]:
        """Create knowledge base documents about architecture components and best practices."""
        docs = []
        
        # UI Constraints and Chat Width Recommendations
        docs.append(Document(page_content="""
        UI Constraints for Chat Responses:
        - Typical chat panel width: 400-500px
        - Avoid ASCII diagrams or wide code blocks that exceed chat width
        - For complex visualizations, recommend implementing on the canvas
        - Keep code examples concise and properly formatted
        - Use markdown formatting for better readability in narrow spaces
        - When users ask for diagrams, suggest using the canvas feature
        """))
        
        # Canvas Implementation Guide
        docs.append(Document(page_content="""
        Canvas Implementation Keywords:
        - "implement on canvas", "draw on canvas", "add to canvas"
        - "create architecture", "design system", "build diagram"
        - "visualize", "show me the architecture"
        When users use these phrases, the system will automatically generate
        the architecture diagram on the canvas using the mentioned components.
        """))
        
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
        
        # Component Library Scope Recommendations
        docs.append(Document(page_content="""
        Scope-Based Component Recommendations:
        
        Small Scope (< 1000 users, low traffic):
        - Database: Supabase (free tier), Firebase (free tier), PostgreSQL (self-hosted)
        - Hosting: Vercel (free tier), Netlify (free tier), Railway ($5/mo)
        - Backend: FastAPI, Express, Flask (all free, just hosting costs)
        - Auth: Supabase Auth, Firebase Auth, NextAuth.js (all free)
        
        Medium Scope (1000-10000 users, moderate traffic):
        - Database: PostgreSQL (managed), MySQL, Supabase (paid tier)
        - Hosting: Vercel (pro), Railway, Render, Cloud Run
        - Backend: FastAPI, NestJS, Django
        - Auth: Clerk, Auth0, Supabase Auth
        - Cache: Redis (managed)
        
        Large Scope (> 10000 users, high traffic):
        - Database: PostgreSQL (enterprise), DynamoDB, MongoDB Atlas
        - Hosting: AWS EC2, GCP Compute, Azure VM, Cloud Run (scaled)
        - Backend: Spring Boot, NestJS, Go/Gin (high performance)
        - Auth: Auth0, AWS Cognito
        - Cache: Redis (enterprise), Memcached
        - Queue: Kafka, RabbitMQ, AWS SQS
        - Monitoring: DataDog, New Relic, Sentry
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
