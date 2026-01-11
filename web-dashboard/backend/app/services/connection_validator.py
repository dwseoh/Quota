"""Connection validation logic - synced with frontend/lib/utils.ts"""

VALID_CONNECTIONS: dict[str, list[str]] = {
    "frontend": ["backend", "database", "hosting", "auth", "storage"],
    "backend": ["database", "cache", "queue", "ml", "storage", "auth"],
    "database": ["cache", "backup"],
    "hosting": [],  # hosting is usually a target, not a source
    "ml": ["storage", "database"],
    "auth": ["database"],
    "cache": [],
    "queue": ["backend"],
    "storage": [],
    "cicd": ["hosting"],

    "search": ["database"],
}


def validate_connection(source_type: str, target_type: str) -> bool:
    """
    Validate if a connection between two component types is valid.
    
    Args:
        source_type: The category of the source node
        target_type: The category of the target node
        
    Returns:
        True if the connection is valid, False otherwise
    """
    if source_type not in VALID_CONNECTIONS:
        return True  # Default to allowing unknown types
    
    allowed_targets = VALID_CONNECTIONS[source_type]
    return target_type in allowed_targets
