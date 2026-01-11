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
        
        Uses a smart layout algorithm to position nodes in logical layers:
        - Layer 1 (top): Frontend, Hosting
        - Layer 2 (middle): Backend, Auth
        - Layer 3 (bottom): Database, Cache, Queue, Storage
        - Layer 4 (services): CI/CD, Monitoring, ML, Search
        
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
        
        # Organize nodes by category
        nodes_by_category = {}
        for comp_id in component_ids:
            component = get_component_by_id(comp_id)
            if not component:
                continue
                
            # Find category
            category = None
            for cat in COMPONENT_LIBRARY:
                if any(c.id == comp_id for c in cat.components):
                    category = cat.id
                    break
            
            if category not in nodes_by_category:
                nodes_by_category[category] = []
            nodes_by_category[category].append(comp_id)
        
        # Define layout layers
        layer_config = {
            1: ["frontend", "hosting"],  # Top layer
            2: ["backend", "auth"],  # Middle layer
            3: ["database", "cache", "queue", "storage"],  # Data layer
            4: ["cicd", "monitoring", "ml", "search"]  # Services layer
        }
        
        # Position nodes in layers
        y_spacing = 200
        x_spacing = 250
        start_y = 100
        
        for layer_num, categories in layer_config.items():
            layer_nodes = []
            for cat in categories:
                if cat in nodes_by_category:
                    layer_nodes.extend([(comp_id, cat) for comp_id in nodes_by_category[cat]])
            
            if not layer_nodes:
                continue
            
            # Calculate positions for this layer
            y_pos = start_y + (layer_num - 1) * y_spacing
            total_width = len(layer_nodes) * x_spacing
            start_x = max(100, (800 - total_width) // 2)  # Center horizontally
            
            for idx, (comp_id, cat) in enumerate(layer_nodes):
                x_pos = start_x + idx * x_spacing
                node = self.create_node(comp_id, position={"x": x_pos, "y": y_pos})
                if node:
                    architecture.nodes.append(node)
                    if cat not in nodes_by_category:
                        nodes_by_category[cat] = []
        
        # Helper to get nodes by category
        def get_nodes_by_category(cat: str):
            return [n for n in architecture.nodes if n.data.category == cat]
        
        # Helper to find node by id
        def get_node_by_id(node_id: str):
            for node in architecture.nodes:
                if node.id == node_id:
                    return node
            return None
        
        # Create smart connections
        edges_created = set()  # Track to avoid duplicates
        
        def add_edge(source_id: str, target_id: str):
            """Add edge with smart handle selection based on node positions"""
            if source_id == target_id:
                return  # Prevent self-connections
            
            edge_key = f"{source_id}-{target_id}"
            reverse_key = f"{target_id}-{source_id}"
            if edge_key in edges_created:
                return  # Already exists
            
            # Get node positions
            source_node = get_node_by_id(source_id)
            target_node = get_node_by_id(target_id)
            
            if not source_node or not target_node:
                return
            
            source_y = source_node.position.get("y", 0)
            target_y = target_node.position.get("y", 0)
            source_x = source_node.position.get("x", 0)
            target_x = target_node.position.get("x", 0)
            
            # Determine handles based on relative positions
            source_handle = None
            target_handle = None
            
            # Vertical difference is more significant than horizontal
            if abs(source_y - target_y) > abs(source_x - target_x):
                if source_y < target_y:
                    # Source is above target
                    source_handle = "bottom"
                    target_handle = "top"
                else:
                    # Source is below target
                    source_handle = "top"
                    target_handle = "bottom"
            else:
                # Horizontal connection
                if source_x < target_x:
                    # Source is left of target
                    source_handle = "right"
                    target_handle = "left"
                else:
                    # Source is right of target
                    source_handle = "left"
                    target_handle = "right"
            
            architecture.edges.append(Edge(
                id=self.generate_id(),
                source=source_id,
                target=target_id,
                sourceHandle=source_handle,
                targetHandle=target_handle,
                type="custom"
            ))
            edges_created.add(edge_key)
        
        # Frontend -> Backend
        for frontend in get_nodes_by_category("frontend"):
            for backend in get_nodes_by_category("backend"):
                add_edge(frontend.id, backend.id)
        
        # Backend -> Database
        for backend in get_nodes_by_category("backend"):
            for db in get_nodes_by_category("database"):
                add_edge(backend.id, db.id)
        
        # Database -> Cache (cache population/invalidation logic often flows this way conceptually or via CDC)
        for db in get_nodes_by_category("database"):
            for cache in get_nodes_by_category("cache"):
                add_edge(db.id, cache.id)
        
        # Backend -> Cache
        for backend in get_nodes_by_category("backend"):
            for cache in get_nodes_by_category("cache"):
                add_edge(backend.id, cache.id)
        
        # Backend -> Queue
        for backend in get_nodes_by_category("backend"):
            for queue in get_nodes_by_category("queue"):
                add_edge(backend.id, queue.id)
                # Queue -> Backend (worker/consumer pattern)
                add_edge(queue.id, backend.id)
        
        # Backend -> Auth
        for backend in get_nodes_by_category("backend"):
            for auth in get_nodes_by_category("auth"):
                add_edge(backend.id, auth.id)
        
        # Auth -> Database
        for auth in get_nodes_by_category("auth"):
            for db in get_nodes_by_category("database"):
                add_edge(auth.id, db.id)
        
        # Backend -> Storage
        for backend in get_nodes_by_category("backend"):
            for storage in get_nodes_by_category("storage"):
                add_edge(backend.id, storage.id)
        
        # Backend -> ML
        for backend in get_nodes_by_category("backend"):
            for ml in get_nodes_by_category("ml"):
                add_edge(backend.id, ml.id)
        
        # ML -> Storage (model artifacts, datasets)
        for ml in get_nodes_by_category("ml"):
            for storage in get_nodes_by_category("storage"):
                add_edge(ml.id, storage.id)
                
        # ML -> Database (metadata, feature store)
        for ml in get_nodes_by_category("ml"):
            for db in get_nodes_by_category("database"):
                add_edge(ml.id, db.id)
        
        # Backend -> Search
        for backend in get_nodes_by_category("backend"):
            for search in get_nodes_by_category("search"):
                add_edge(backend.id, search.id)
        
        # Search -> Database (indexing)
        for search in get_nodes_by_category("search"):
            for db in get_nodes_by_category("database"):
                add_edge(search.id, db.id)
        
        # Frontend -> Hosting (frontend hosting)
        for frontend in get_nodes_by_category("frontend"):
            for hosting in get_nodes_by_category("hosting"):
                # Only connect if it's a frontend hosting service
                if any(keyword in hosting.data.componentId for keyword in ["vercel", "netlify"]):
                    add_edge(frontend.id, hosting.id)
        
        # Backend -> Hosting (backend hosting)
        for backend in get_nodes_by_category("backend"):
            for hosting in get_nodes_by_category("hosting"):
                # Connect to backend hosting services
                if any(keyword in hosting.data.componentId for keyword in ["railway", "render", "cloudrun", "ec2", "compute", "azure"]):
                    add_edge(backend.id, hosting.id)
        
        # CI/CD -> Backend (deployment target)
        for cicd in get_nodes_by_category("cicd"):
            for backend in get_nodes_by_category("backend"):
                add_edge(cicd.id, backend.id)
            for frontend in get_nodes_by_category("frontend"):
                add_edge(cicd.id, frontend.id)
        
        # Monitoring -> Backend
        for monitoring in get_nodes_by_category("monitoring"):
            for backend in get_nodes_by_category("backend"):
                add_edge(monitoring.id, backend.id)
        
        return architecture

