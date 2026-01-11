"""Component library data - synced with frontend/components-data.ts"""

from typing import Optional
from dataclasses import dataclass


@dataclass
class ComponentDefinition:
    id: str
    name: str
    icon: str  # URL to logo image or text identifier
    color: str
    description: Optional[str] = None
    baseCost: Optional[float] = None  # Base monthly cost in USD


@dataclass
class ComponentCategory:
    id: str
    name: str
    icon: str
    components: list[ComponentDefinition]


def logo(name: str, color: Optional[str] = None) -> str:
    """Helper to get logo URL from simple-icons"""
    if color:
        return f"https://cdn.simpleicons.org/{name}/{color.replace('#', '')}"
    return f"https://cdn.simpleicons.org/{name}"


COMPONENT_LIBRARY: list[ComponentCategory] = [
    ComponentCategory(
        id="backend",
        name="Backend",
        icon="server",
        components=[
            ComponentDefinition(id="fastapi", name="FastAPI", icon=logo("fastapi"), color="#009688", baseCost=0),
            ComponentDefinition(id="express", name="Express", icon=logo("express"), color="#000000", baseCost=0),
            ComponentDefinition(id="nodejs", name="Node.js", icon=logo("nodedotjs"), color="#339933", baseCost=0),
            ComponentDefinition(id="django", name="Django", icon=logo("django"), color="#092e20", baseCost=0),
            ComponentDefinition(id="flask", name="Flask", icon=logo("flask"), color="#000000", baseCost=0),
            ComponentDefinition(id="spring", name="Spring Boot", icon=logo("spring"), color="#6db33f", baseCost=0),
            ComponentDefinition(id="nestjs", name="NestJS", icon=logo("nestjs"), color="#e0234e", baseCost=0),
            ComponentDefinition(id="go", name="Go/Gin", icon=logo("go"), color="#00add8", baseCost=0),
        ],
    ),
    ComponentCategory(
        id="frontend",
        name="Frontend",
        icon="palette",
        components=[
            ComponentDefinition(id="react", name="React", icon=logo("react"), color="#61dafb", baseCost=0),
            ComponentDefinition(id="nextjs", name="Next.js", icon=logo("nextdotjs"), color="#000000", baseCost=0),
            ComponentDefinition(id="vue", name="Vue", icon=logo("vuedotjs"), color="#42b883", baseCost=0),
            ComponentDefinition(id="svelte", name="Svelte", icon=logo("svelte"), color="#ff3e00", baseCost=0),
            ComponentDefinition(id="angular", name="Angular", icon=logo("angular"), color="#dd0031", baseCost=0),
            ComponentDefinition(id="solid", name="Solid.js", icon=logo("solid"), color="#2c4f7c", baseCost=0),
            ComponentDefinition(id="astro", name="Astro", icon=logo("astro"), color="#ff5d01", baseCost=0),
        ],
    ),
    ComponentCategory(
        id="database",
        name="Database",
        icon="database",
        components=[
            ComponentDefinition(id="postgresql", name="PostgreSQL", icon=logo("postgresql"), color="#336791", baseCost=15),
            ComponentDefinition(id="mysql", name="MySQL", icon=logo("mysql"), color="#4479a1", baseCost=12),
            ComponentDefinition(id="mongodb", name="MongoDB", icon=logo("mongodb"), color="#47a248", baseCost=57),
            ComponentDefinition(id="supabase", name="Supabase", icon=logo("supabase"), color="#3ecf8e", baseCost=25),
            ComponentDefinition(id="firebase", name="Firebase", icon=logo("firebase"), color="#ffca28", baseCost=25),
            ComponentDefinition(id="redis", name="Redis", icon=logo("redis"), color="#dc382d", baseCost=10),
            ComponentDefinition(id="amazondynamodb", name="DynamoDB", icon=logo("amazondynamodb"), color="#4053d6", baseCost=20),
            ComponentDefinition(id="planetscale", name="PlanetScale", icon=logo("planetscale"), color="#000000", baseCost=29),
        ],
    ),
    ComponentCategory(
        id="hosting",
        name="Hosting",
        icon="cloud",
        components=[
            ComponentDefinition(id="vercel", name="Vercel", icon=logo("vercel"), color="#000000", baseCost=20),
            ComponentDefinition(id="netlify", name="Netlify", icon=logo("netlify"), color="#00c7b7", baseCost=19),
            ComponentDefinition(id="aws-ec2", name="AWS EC2", icon=logo("amazonec2"), color="#ff9900", baseCost=30),
            ComponentDefinition(id="gcp-compute", name="GCP Compute", icon=logo("googlecloud"), color="#4285f4", baseCost=28),
            ComponentDefinition(id="azure-vm", name="Azure VM", icon=logo("microsoftazure"), color="#0078d4", baseCost=32),
            ComponentDefinition(id="railway", name="Railway", icon=logo("railway"), color="#0b0d0e", baseCost=5),
            ComponentDefinition(id="render", name="Render", icon=logo("render"), color="#46e3b7", baseCost=7),
            ComponentDefinition(id="cloudrun", name="Cloud Run", icon=logo("googlecloud"), color="#4285f4", baseCost=15),
        ],
    ),
    ComponentCategory(
        id="ml",
        name="ML/AI",
        icon="brain",
        components=[
            ComponentDefinition(id="tensorflow", name="TensorFlow", icon=logo("tensorflow"), color="#ff6f00", baseCost=50),
            ComponentDefinition(id="pytorch", name="PyTorch", icon=logo("pytorch"), color="#ee4c2c", baseCost=50),
            ComponentDefinition(id="opencv", name="OpenCV", icon=logo("opencv"), color="#5c3ee8", baseCost=0),
            ComponentDefinition(id="scikitlearn", name="Scikit-learn", icon=logo("scikitlearn"), color="#f7931e", baseCost=0),
            ComponentDefinition(id="huggingface", name="Hugging Face", icon="🤗", color="#ffcc00", baseCost=9),
            ComponentDefinition(id="openai", name="OpenAI API", icon=logo("openai"), color="#10a37f", baseCost=100),
            ComponentDefinition(id="anthropic", name="Anthropic", icon=logo("anthropic"), color="#d4a574", baseCost=100),
        ],
    ),
    ComponentCategory(
        id="auth",
        name="Authentication",
        icon="lock",
        components=[
            ComponentDefinition(id="auth0", name="Auth0", icon=logo("auth0"), color="#eb5424", baseCost=23),
            ComponentDefinition(id="clerk", name="Clerk", icon=logo("clerk"), color="#6c47ff", baseCost=25),
            ComponentDefinition(id="firebase-auth", name="Firebase Auth", icon=logo("firebase"), color="#ffca28", baseCost=0),
            ComponentDefinition(id="supabase-auth", name="Supabase Auth", icon=logo("supabase"), color="#3ecf8e", baseCost=0),
            ComponentDefinition(id="jwt", name="Custom JWT", icon=logo("jsonwebtokens"), color="#000000", baseCost=0),
            ComponentDefinition(id="nextauth", name="NextAuth.js", icon=logo("nextdotjs"), color="#000000", baseCost=0),
            ComponentDefinition(id="cognito", name="AWS Cognito", icon=logo("amazonaws"), color="#ff9900", baseCost=15),
        ],
    ),
    ComponentCategory(
        id="cache",
        name="Caching",
        icon="zap",
        components=[
            ComponentDefinition(id="redis-cache", name="Redis", icon=logo("redis"), color="#dc382d", baseCost=10),
            ComponentDefinition(id="memcached", name="Memcached", icon=logo("memcached"), color="#000000", baseCost=8),
            ComponentDefinition(id="cloudflare-cdn", name="Cloudflare", icon=logo("cloudflare"), color="#f38020", baseCost=20),
            ComponentDefinition(id="cloudfront", name="CloudFront", icon=logo("amazonaws"), color="#ff9900", baseCost=15),
            ComponentDefinition(id="varnish", name="Varnish", icon=logo("varnish"), color="#000000", baseCost=0),
        ],
    ),
    ComponentCategory(
        id="queue",
        name="Message Queue",
        icon="mail",
        components=[
            ComponentDefinition(id="rabbitmq", name="RabbitMQ", icon=logo("rabbitmq"), color="#ff6600", baseCost=12),
            ComponentDefinition(id="kafka", name="Apache Kafka", icon=logo("apachekafka"), color="#000000", baseCost=50),
            ComponentDefinition(id="sqs", name="AWS SQS", icon=logo("amazonsqs"), color="#ff9900", baseCost=10),
            ComponentDefinition(id="redis-pubsub", name="Redis Pub/Sub", icon=logo("redis"), color="#dc382d", baseCost=0),
            ComponentDefinition(id="pubsub", name="Google Pub/Sub", icon=logo("googlecloud"), color="#4285f4", baseCost=15),
        ],
    ),
    ComponentCategory(
        id="storage",
        name="Storage",
        icon="package",
        components=[
            ComponentDefinition(id="s3", name="AWS S3", icon=logo("amazons3"), color="#ff9900", baseCost=5),
            ComponentDefinition(id="gcs", name="Google Cloud Storage", icon=logo("googlecloud"), color="#4285f4", baseCost=5),
            ComponentDefinition(id="azure-blob", name="Azure Blob", icon=logo("microsoftazure"), color="#0078d4", baseCost=6),
            ComponentDefinition(id="cloudflare-r2", name="Cloudflare R2", icon=logo("cloudflare"), color="#f38020", baseCost=3),
            ComponentDefinition(id="supabase-storage", name="Supabase Storage", icon=logo("supabase"), color="#3ecf8e", baseCost=0),
        ],
    ),
    ComponentCategory(
        id="cicd",
        name="CI/CD",
        icon="refresh-cw",
        components=[
            ComponentDefinition(id="github-actions", name="GitHub Actions", icon=logo("githubactions"), color="#2088ff", baseCost=0),
            ComponentDefinition(id="gitlab-ci", name="GitLab CI", icon=logo("gitlab"), color="#fc6d26", baseCost=0),
            ComponentDefinition(id="circleci", name="CircleCI", icon=logo("circleci"), color="#343434", baseCost=15),
            ComponentDefinition(id="jenkins", name="Jenkins", icon=logo("jenkins"), color="#d24939", baseCost=10),
            ComponentDefinition(id="vercel-deploy", name="Vercel Deploy", icon=logo("vercel"), color="#000000", baseCost=0),
        ],
    ),
    ComponentCategory(
        id="monitoring",
        name="Monitoring",
        icon="activity",
        components=[
            ComponentDefinition(id="sentry", name="Sentry", icon=logo("sentry"), color="#362d59", baseCost=26),
            ComponentDefinition(id="datadog", name="DataDog", icon=logo("datadog"), color="#632ca6", baseCost=15),
            ComponentDefinition(id="newrelic", name="New Relic", icon=logo("newrelic"), color="#008c99", baseCost=25),
            ComponentDefinition(id="prometheus", name="Prometheus", icon=logo("prometheus"), color="#e6522c", baseCost=0),
            ComponentDefinition(id="logrocket", name="LogRocket", icon=logo("logrocket"), color="#764abc", baseCost=99),
        ],
    ),
    ComponentCategory(
        id="search",
        name="Search",
        icon="search",
        components=[
            ComponentDefinition(id="elasticsearch", name="Elasticsearch", icon=logo("elasticsearch"), color="#005571", baseCost=45),
            ComponentDefinition(id="algolia", name="Algolia", icon=logo("algolia"), color="#5468ff", baseCost=50),
            ComponentDefinition(id="meilisearch", name="Meilisearch", icon=logo("meilisearch"), color="#ff5caa", baseCost=0),
            ComponentDefinition(id="typesense", name="Typesense", icon=logo("typesense"), color="#d32f2f", baseCost=0),
        ],
    ),
]


def get_component_by_id(component_id: str) -> Optional[ComponentDefinition]:
    """Get a component definition by its ID."""
    for category in COMPONENT_LIBRARY:
        for component in category.components:
            if component.id == component_id:
                return component
    return None


def get_category_by_id(category_id: str) -> Optional[ComponentCategory]:
    """Get a category by its ID."""
    for category in COMPONENT_LIBRARY:
        if category.id == category_id:
            return category
    return None
