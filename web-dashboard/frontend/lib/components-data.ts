export interface ComponentDefinition {
    id: string;
    name: string;
    icon: string; // URL to logo image or emoji fallback
    color: string;
    description?: string;
    baseCost?: number; // Approximate base monthly cost in USD (very rough)
}

export interface ComponentCategory {
    id: string;
    name: string;
    icon: string;
    components: ComponentDefinition[];
}

// Helper to get logo URL from simple-icons
const logo = (name: string, color?: string) =>
    `https://cdn.simpleicons.org/${name}${color ? `/${color.replace('#', '')}` : ''}`;

export const COMPONENT_LIBRARY: ComponentCategory[] = [
    {
        id: "backend",
        name: "Backend",
        icon: "server",
        components: [
            { id: "fastapi", name: "FastAPI", icon: logo("fastapi"), color: "#009688", baseCost: 0 },
            { id: "express", name: "Express", icon: logo("express"), color: "#000000", baseCost: 0 },
            { id: "nodejs", name: "Node.js", icon: logo("nodedotjs"), color: "#339933", baseCost: 0 },
            { id: "django", name: "Django", icon: logo("django"), color: "#092e20", baseCost: 0 },
            { id: "flask", name: "Flask", icon: logo("flask"), color: "#000000", baseCost: 0 },
            { id: "spring", name: "Spring Boot", icon: logo("spring"), color: "#6db33f", baseCost: 0 },
            { id: "nestjs", name: "NestJS", icon: logo("nestjs"), color: "#e0234e", baseCost: 0 },
            { id: "go", name: "Go/Gin", icon: logo("go"), color: "#00add8", baseCost: 0 },
        ],
    },
    {
        id: "frontend",
        name: "Frontend",
        icon: "palette",
        components: [
            { id: "react", name: "React", icon: logo("react"), color: "#61dafb", baseCost: 0 },
            { id: "nextjs", name: "Next.js", icon: logo("nextdotjs"), color: "#000000", baseCost: 0 },
            { id: "vue", name: "Vue", icon: logo("vuedotjs"), color: "#42b883", baseCost: 0 },
            { id: "svelte", name: "Svelte", icon: logo("svelte"), color: "#ff3e00", baseCost: 0 },
            { id: "angular", name: "Angular", icon: logo("angular"), color: "#dd0031", baseCost: 0 },
            { id: "solid", name: "Solid.js", icon: logo("solid"), color: "#2c4f7c", baseCost: 0 },
            { id: "astro", name: "Astro", icon: logo("astro"), color: "#ff5d01", baseCost: 0 },
        ],
    },
    {
        id: "database",
        name: "Database",
        icon: "database",
        components: [
            // You asked to keep PostgreSQL free
            { id: "postgresql", name: "PostgreSQL", icon: logo("postgresql"), color: "#336791", baseCost: 0 },
            // MySQL, MongoDB etc. are OSS but managed services have usage-based pricing;
            // leave 0 to mean "license-free, infra/managed cost varies".
            { id: "mysql", name: "MySQL", icon: logo("mysql"), color: "#4479a1", baseCost: 0 },
            { id: "mongodb", name: "MongoDB", icon: logo("mongodb"), color: "#47a248", baseCost: 0 },
            { id: "supabase", name: "Supabase", icon: logo("supabase"), color: "#3ecf8e", baseCost: 0 },
            { id: "firebase", name: "Firebase", icon: logo("firebase"), color: "#ffca28", baseCost: 0 },
            { id: "redis", name: "Redis", icon: logo("redis"), color: "#dc382d", baseCost: 0 },
            { id: "amazondynamodb", name: "DynamoDB", icon: logo("amazondynamodb"), color: "#4053d6", baseCost: 0 },
            { id: "planetscale", name: "PlanetScale", icon: logo("planetscale"), color: "#000000", baseCost: 0 },
        ],
    },
    {
        id: "hosting",
        name: "Hosting",
        icon: "cloud",
        components: [
            // Vercel Pro starts around $20/month per seat; Hobby is free.[web:33][web:38]
            { id: "vercel", name: "Vercel", icon: logo("vercel"), color: "#000000", baseCost: 20 },
            // Netlify Pro is in a similar tens-of-dollars range; exact depends on seats/sites.[web:8]
            { id: "netlify", name: "Netlify", icon: logo("netlify"), color: "#00c7b7", baseCost: 19 },
            // Cloud VMs are pay‑per‑hour; keep as rough ballparks for a small instance.
            { id: "aws-ec2", name: "AWS EC2", icon: logo("amazonec2"), color: "#ff9900", baseCost: 30 },
            { id: "gcp-compute", name: "GCP Compute", icon: logo("googlecloud"), color: "#4285f4", baseCost: 28 },
            { id: "azure-vm", name: "Azure VM", icon: logo("microsoftazure"), color: "#0078d4", baseCost: 32 },
            // Railway and Render have low entry paid tiers (~$5–$7) plus free tiers.[web:35][web:8]
            { id: "railway", name: "Railway", icon: logo("railway"), color: "#0b0d0e", baseCost: 5 },
            { id: "render", name: "Render", icon: logo("render"), color: "#46e3b7", baseCost: 7 },
            { id: "cloudrun", name: "Cloud Run", icon: logo("googlecloud"), color: "#4285f4", baseCost: 0 },
        ],
    },
    {
        id: "ml",
        name: "ML/AI",
        icon: "brain",
        components: [
            // Libraries themselves are free; cost is GPU/infra.
            { id: "tensorflow", name: "TensorFlow", icon: logo("tensorflow"), color: "#ff6f00", baseCost: 0 },
            { id: "pytorch", name: "PyTorch", icon: logo("pytorch"), color: "#ee4c2c", baseCost: 0 },
            { id: "opencv", name: "OpenCV", icon: logo("opencv"), color: "#5c3ee8", baseCost: 0 },
            { id: "scikitlearn", name: "Scikit-learn", icon: logo("scikitlearn"), color: "#f7931e", baseCost: 0 },
            // Hugging Face has free and paid tiers; keep small non-zero to indicate likely SaaS spend.
            { id: "huggingface", name: "Hugging Face", icon: "🤗", color: "#ffcc00", baseCost: 9 },
            // OpenAI/Anthropic are usage‑based per token; this is a placeholder for “small project” spend.[web:19][web:8]
            { id: "openai", name: "OpenAI API", icon: logo("openai"), color: "#10a37f", baseCost: 50 },
            { id: "anthropic", name: "Anthropic", icon: logo("anthropic"), color: "#d4a574", baseCost: 50 },
        ],
    },
    {
        id: "auth",
        name: "Authentication",
        icon: "lock",
        components: [
            // Auth0 Essentials starts ≈$35/month; using that as base.[web:32][web:34][web:37]
            { id: "auth0", name: "Auth0", icon: logo("auth0"), color: "#eb5424", baseCost: 35 },
            { id: "clerk", name: "Clerk", icon: logo("clerk"), color: "#6c47ff", baseCost: 25 },
            { id: "firebase-auth", name: "Firebase Auth", icon: logo("firebase"), color: "#ffca28", baseCost: 0 },
            { id: "supabase-auth", name: "Supabase Auth", icon: logo("supabase"), color: "#3ecf8e", baseCost: 0 },
            { id: "jwt", name: "Custom JWT", icon: logo("jsonwebtokens"), color: "#000000", baseCost: 0 },
            { id: "nextauth", name: "NextAuth.js", icon: logo("nextdotjs"), color: "#000000", baseCost: 0 },
            { id: "cognito", name: "AWS Cognito", icon: logo("amazonaws"), color: "#ff9900", baseCost: 0 },
        ],
    },
    {
        id: "cache",
        name: "Caching",
        icon: "zap",
        components: [
            { id: "redis-cache", name: "Redis", icon: logo("redis"), color: "#dc382d", baseCost: 0 },
            { id: "memcached", name: "Memcached", icon: logo("memcached"), color: "#000000", baseCost: 0 },
            { id: "cloudflare-cdn", name: "Cloudflare", icon: logo("cloudflare"), color: "#f38020", baseCost: 0 },
            { id: "cloudfront", name: "CloudFront", icon: logo("amazonaws"), color: "#ff9900", baseCost: 0 },
            { id: "varnish", name: "Varnish", icon: logo("varnish"), color: "#000000", baseCost: 0 },
        ],
    },
    {
        id: "queue",
        name: "Message Queue",
        icon: "mail",
        components: [
            { id: "rabbitmq", name: "RabbitMQ", icon: logo("rabbitmq"), color: "#ff6600", baseCost: 0 },
            { id: "kafka", name: "Apache Kafka", icon: logo("apachekafka"), color: "#000000", baseCost: 0 },
            { id: "sqs", name: "AWS SQS", icon: logo("amazonsqs"), color: "#ff9900", baseCost: 0 },
            { id: "redis-pubsub", name: "Redis Pub/Sub", icon: logo("redis"), color: "#dc382d", baseCost: 0 },
            { id: "pubsub", name: "Google Pub/Sub", icon: logo("googlecloud"), color: "#4285f4", baseCost: 0 },
        ],
    },
    {
        id: "storage",
        name: "Storage",
        icon: "package",
        components: [
            { id: "s3", name: "AWS S3", icon: logo("amazons3"), color: "#ff9900", baseCost: 0 },
            { id: "gcs", name: "Google Cloud Storage", icon: logo("googlecloud"), color: "#4285f4", baseCost: 0 },
            { id: "azure-blob", name: "Azure Blob", icon: logo("microsoftazure"), color: "#0078d4", baseCost: 0 },
            { id: "cloudflare-r2", name: "Cloudflare R2", icon: logo("cloudflare"), color: "#f38020", baseCost: 0 },
            { id: "supabase-storage", name: "Supabase Storage", icon: logo("supabase"), color: "#3ecf8e", baseCost: 0 },
        ],
    },
    {
        id: "cicd",
        name: "CI/CD",
        icon: "refresh-cw",
        components: [
            { id: "github-actions", name: "GitHub Actions", icon: logo("githubactions"), color: "#2088ff", baseCost: 0 },
            { id: "gitlab-ci", name: "GitLab CI", icon: logo("gitlab"), color: "#fc6d26", baseCost: 0 },
            { id: "circleci", name: "CircleCI", icon: logo("circleci"), color: "#343434", baseCost: 0 },
            { id: "jenkins", name: "Jenkins", icon: logo("jenkins"), color: "#d24939", baseCost: 0 },
            { id: "vercel-deploy", name: "Vercel Deploy", icon: logo("vercel"), color: "#000000", baseCost: 0 },
        ],
    },
    {
        id: "monitoring",
        name: "Monitoring",
        icon: "activity",
        components: [
            { id: "sentry", name: "Sentry", icon: logo("sentry"), color: "#362d59", baseCost: 0 },
            { id: "datadog", name: "DataDog", icon: logo("datadog"), color: "#632ca6", baseCost: 0 },
            { id: "newrelic", name: "New Relic", icon: logo("newrelic"), color: "#008c99", baseCost: 0 },
            { id: "prometheus", name: "Prometheus", icon: logo("prometheus"), color: "#e6522c", baseCost: 0 },
            { id: "logrocket", name: "LogRocket", icon: logo("logrocket"), color: "#764abc", baseCost: 0 },
        ],
    },
    {
        id: "search",
        name: "Search",
        icon: "search",
        components: [
            { id: "elasticsearch", name: "Elasticsearch", icon: logo("elasticsearch"), color: "#005571", baseCost: 0 },
            { id: "algolia", name: "Algolia", icon: logo("algolia"), color: "#5468ff", baseCost: 0 },
            { id: "meilisearch", name: "Meilisearch", icon: logo("meilisearch"), color: "#ff5caa", baseCost: 0 },
            { id: "typesense", name: "Typesense", icon: logo("typesense"), color: "#d32f2f", baseCost: 0 },
        ],
    },
];

export function getComponentById(id: string): ComponentDefinition | undefined {
    for (const category of COMPONENT_LIBRARY) {
        const component = category.components.find((c) => c.id === id);
        if (component) return component;
    }
    return undefined;
}

export function getCategoryById(id: string): ComponentCategory | undefined {
    return COMPONENT_LIBRARY.find((cat) => cat.id === id);
}

