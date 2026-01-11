"""Service for manipulating and generating architectures."""

import uuid
import random
from typing import Optional, List
from app.models.architecture import ArchitectureJson, ArchitectureNode, Edge, Scope
from app.data.components_data import get_component_by_id, COMPONENT_LIBRARY
from app.services.connection_validator import validate_connection
from app.services.cost_calculator import calculate_costs


class ArchitectureService:
    """Service for architecture manipulation and generation."""
    
    def generate_id(self) -> str:
        """Generate a unique node ID."""
        return f"{uuid.uuid4().hex[:8]}"
    
    def create_node(
        self,
        component_id: str,
        position: Optional[dict[str, float]] = None
    ) -> Optional[ArchitectureNode]:
        """
        Create a new architecture node from a component ID.
        
        Args:
            component_id: The component ID
            position: Optional position coordinates
            
        Returns:
            ArchitectureNode or None if component not found
        """
        component = get_component_by_id(component_id)
        if not component:
            return None
        
        # Find category for this component
        category = None
        for cat in COMPONENT_LIBRARY:
            if any(c.id == component_id for c in cat.components):
                category = cat
                break
        
        if not category:
            return None
        
        # Generate position if not provided
        if position is None:
            position = {
                "x": random.randint(100, 800),
                "y": random.randint(100, 600),
            }
        
        return ArchitectureNode(
            id=f"{component_id}-{self.generate_id()}",
            type="custom",
            position=position,
            data={
                "label": component.name,
                "componentId": component.id,
                "category": category.id,
                "icon": component.icon,
                "color": component.color,
            }
        )
    
    def add_component_to_architecture(
        self,
        architecture: ArchitectureJson,
        component_id: str,
        connect_to: Optional[str] = None
    ) -> ArchitectureJson:
        """
        Add a component to an architecture and optionally connect it.
        
        Args:
            architecture: Current architecture
            component_id: Component to add
            connect_to: Optional node ID to connect to
            
        Returns:
            Updated architecture
        """
        node = self.create_node(component_id)
        if not node:
            return architecture
        
        # Add node
        architecture.nodes.append(node)
        
        # Connect if specified
        if connect_to:
            source_node = next((n for n in architecture.nodes if n.id == connect_to), None)
            if source_node:
                source_category = source_node.data.category
                target_category = node.data.category
                
                if validate_connection(source_category, target_category):
                    edge = Edge(
                        id=self.generate_id(),
                        source=connect_to,
                        target=node.id,
                        type="custom"
                    )
                    architecture.edges.append(edge)
        
        return architecture
    
    def remove_component(
        self,
        architecture: ArchitectureJson,
        node_id: str
    ) -> ArchitectureJson:
        """
        Remove a component and its connections from architecture.
        
        Args:
            architecture: Current architecture
            node_id: Node ID to remove
            
        Returns:
            Updated architecture
        """
        architecture.nodes = [n for n in architecture.nodes if n.id != node_id]
        architecture.edges = [
            e for e in architecture.edges
            if e.source != node_id and e.target != node_id
        ]
        return architecture
    
    def calculate_architecture_cost(self, architecture: ArchitectureJson) -> dict:
        """Calculate cost for an architecture."""
        scope_dict = {
            "users": architecture.scope.users,
            "trafficLevel": architecture.scope.trafficLevel,
            "dataVolumeGB": architecture.scope.dataVolumeGB,
            "regions": architecture.scope.regions,
            "availability": architecture.scope.availability,
        }
        
        # Convert nodes to dict format for cost calculator
        nodes_dict = []
        for node in architecture.nodes:
            nodes_dict.append({
                "id": node.id,
                "data": {
                    "componentId": node.data.componentId,
                    "category": node.data.category,
                    "label": node.data.label,
                }
            })
        
        return calculate_costs(nodes_dict, scope_dict)
    
    def generate_architecture_from_components(
        self,
        component_ids: List[str],
        scope: Optional[Scope] = None
    ) -> ArchitectureJson:
        """
        Generate a complete architecture from a list of component IDs.
        
        Args:
            component_ids: List of component IDs to include
            scope: Optional scope configuration
            
        Returns:
            Generated architecture with nodes and connections
        """
        architecture = ArchitectureJson(
            nodes=[],
            edges=[],
            scope=scope or Scope(),
        )
        
        # Create nodes
        nodes_by_category = {}
        for comp_id in component_ids:
            node = self.create_node(comp_id)
            if node:
                architecture.nodes.append(node)
                category = node.data.category
                if category not in nodes_by_category:
                    nodes_by_category[category] = []
                nodes_by_category[category].append(node)
        
        # Create connections based on category relationships
        # Frontend -> Backend
        if "frontend" in nodes_by_category and "backend" in nodes_by_category:
            for frontend_node in nodes_by_category["frontend"]:
                for backend_node in nodes_by_category["backend"]:
                    if validate_connection("frontend", "backend"):
                        edge = Edge(
                            id=self.generate_id(),
                            source=frontend_node.id,
                            target=backend_node.id,
                            type="custom"
                        )
                        architecture.edges.append(edge)
        
        # Backend -> Database
        if "backend" in nodes_by_category and "database" in nodes_by_category:
            for backend_node in nodes_by_category["backend"]:
                for db_node in nodes_by_category["database"]:
                    if validate_connection("backend", "database"):
                        edge = Edge(
                            id=self.generate_id(),
                            source=backend_node.id,
                            target=db_node.id,
                            type="custom"
                        )
                        architecture.edges.append(edge)
        
        # Backend -> Cache
        if "backend" in nodes_by_category and "cache" in nodes_by_category:
            for backend_node in nodes_by_category["backend"]:
                for cache_node in nodes_by_category["cache"]:
                    if validate_connection("backend", "cache"):
                        edge = Edge(
                            id=self.generate_id(),
                            source=backend_node.id,
                            target=cache_node.id,
                            type="custom"
                        )
                        architecture.edges.append(edge)
        
        # Backend -> Auth
        if "backend" in nodes_by_category and "auth" in nodes_by_category:
            for backend_node in nodes_by_category["backend"]:
                for auth_node in nodes_by_category["auth"]:
                    if validate_connection("backend", "auth"):
                        edge = Edge(
                            id=self.generate_id(),
                            source=backend_node.id,
                            target=auth_node.id,
                            type="custom"
                        )
                        architecture.edges.append(edge)
        
        # Auth -> Database
        if "auth" in nodes_by_category and "database" in nodes_by_category:
            for auth_node in nodes_by_category["auth"]:
                for db_node in nodes_by_category["database"]:
                    if validate_connection("auth", "database"):
                        edge = Edge(
                            id=self.generate_id(),
                            source=auth_node.id,
                            target=db_node.id,
                            type="custom"
                        )
                        architecture.edges.append(edge)
        
        return architecture
