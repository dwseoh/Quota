# GCP Deployment Guide

Complete guide for deploying the Quota backend to Google Cloud Platform using Cloud Run.

## Prerequisites

1. **GCP Account**: Active Google Cloud Platform account with billing enabled
2. **gcloud CLI**: Install from https://cloud.google.com/sdk/docs/install
3. **Docker**: Install from https://docs.docker.com/get-docker/
4. **MongoDB**: MongoDB Atlas account or GCP-hosted MongoDB
5. **Gemini API Key**: From Google AI Studio

## Setup Steps

### 1. Install and Configure gcloud CLI

```bash
# Install gcloud CLI (if not already installed)
# Visit: https://cloud.google.com/sdk/docs/install

# Initialize and authenticate
gcloud init
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

### 2. Enable Required GCP APIs

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com
```

### 3. Create Secrets in GCP Secret Manager

```bash
# Create GEMINI_API_KEY secret
echo -n "your-gemini-api-key" | gcloud secrets create GEMINI_API_KEY --data-file=-

# Create MONGODB_URL secret
echo -n "your-mongodb-connection-string" | gcloud secrets create MONGODB_URL --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
    --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding MONGODB_URL \
    --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

> **Note**: Replace `YOUR_PROJECT_NUMBER` with your actual project number. Find it with:
> ```bash
> gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)"
> ```

### 4. Deploy to Cloud Run

#### Option A: Using the deployment script (Recommended)

```bash
cd web-dashboard/backend

# Make the script executable
chmod +x deploy.sh

# Deploy (replace with your project ID)
./deploy.sh YOUR_PROJECT_ID
```

#### Option B: Manual deployment

```bash
cd web-dashboard/backend

# Build and push Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/quota-backend

# Deploy to Cloud Run
gcloud run deploy quota-backend \
    --image gcr.io/YOUR_PROJECT_ID/quota-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars "API_TITLE=Quota Backend API,API_VERSION=1.0.0,DEBUG=false" \
    --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest,MONGODB_URL=MONGODB_URL:latest"
```

### 5. Get Your Service URL

```bash
gcloud run services describe quota-backend \
    --region us-central1 \
    --format 'value(status.url)'
```

### 6. Test Your Deployment

```bash
# Health check
curl https://YOUR_SERVICE_URL/health

# API documentation
open https://YOUR_SERVICE_URL/docs
```

## Update Frontend Configuration

After deployment, update your frontend to use the production backend URL:

1. Create `.env.local` in `web-dashboard/frontend/`:
   ```bash
   API_URL=https://YOUR_SERVICE_URL
   ```

2. Or set it in your frontend deployment environment (Vercel, Netlify, etc.)

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Add your Cloud Run IP to IP whitelist (or allow all: `0.0.0.0/0`)
4. Create database user
5. Get connection string and add to GCP Secret Manager

### Option 2: MongoDB on GCP

1. Deploy MongoDB on Compute Engine or use MongoDB Atlas
2. Configure networking and firewall rules
3. Get connection string and add to GCP Secret Manager

## Monitoring and Logs

```bash
# View logs
gcloud run services logs read quota-backend --region us-central1

# View metrics in Cloud Console
open https://console.cloud.google.com/run/detail/us-central1/quota-backend/metrics
```

## Updating the Deployment

```bash
# Make your code changes, then redeploy
./deploy.sh YOUR_PROJECT_ID
```

## Troubleshooting

### Build Fails

- Check `cloudbuild.yaml` syntax
- Verify all dependencies in `requirements.txt`
- Check Docker build logs: `gcloud builds list`

### Deployment Fails

- Verify secrets exist: `gcloud secrets list`
- Check IAM permissions for Cloud Run service account
- Review Cloud Run logs: `gcloud run services logs read quota-backend`

### Connection Issues

- Verify MongoDB connection string
- Check MongoDB IP whitelist
- Test MongoDB connection locally first

### CORS Errors

- Update `app/config.py` to include your frontend URL in `CORS_ORIGINS`
- Redeploy after changes

## Cost Optimization

- Cloud Run charges only for actual usage
- Free tier: 2 million requests/month
- Estimated cost: $0-20/month for moderate usage
- Monitor costs: https://console.cloud.google.com/billing

## Security Best Practices

✅ Secrets stored in Secret Manager (not in code)
✅ Non-root user in Docker container
✅ CORS configured for specific origins
✅ HTTPS enforced by Cloud Run
✅ Regular dependency updates

## Next Steps

1. Set up custom domain (optional)
2. Configure Cloud Build triggers for CI/CD
3. Set up monitoring alerts
4. Configure backup strategy for MongoDB
