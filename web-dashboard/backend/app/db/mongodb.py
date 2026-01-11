"""MongoDB connection manager using motor (async MongoDB driver)."""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

class MongoDB:
    """MongoDB connection manager."""
    
    client: AsyncIOMotorClient = None
    
    @classmethod
    def connect(cls):
        """Initialize MongoDB connection."""
        if not settings.mongodb_uri:
            raise ValueError("MONGODB_URI environment variable is required")
        
        cls.client = AsyncIOMotorClient(settings.mongodb_uri)
        print(f"✅ Connected to MongoDB")
    
    @classmethod
    def close(cls):
        """Close MongoDB connection."""
        if cls.client:
            cls.client.close()
            print("🔌 MongoDB connection closed")
    
    @classmethod
    def get_database(cls):
        """Get database instance."""
        if not cls.client:
            cls.connect()
        return cls.client.get_database("quota-sandbox")
    
    @classmethod
    def get_collection(cls, collection_name: str):
        """Get collection instance."""
        db = cls.get_database()
        return db[collection_name]


# Convenience function
def get_sandboxes_collection():
    """Get the sandboxes collection."""
    return MongoDB.get_collection("sandboxes")
