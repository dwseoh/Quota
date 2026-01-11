#!/bin/bash

# GCP Backend Deployment Script
# Usage: ./deploy.sh [project-id]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="quota-backend"
REGION="us-central1"
PROJECT_ID="${1:-$GCP_PROJECT_ID}"

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: GCP_PROJECT_ID not set${NC}"
    echo "Usage: ./deploy.sh [project-id]"
    echo "Or set GCP_PROJECT_ID environment variable"
    exit 1
fi

echo -e "${GREEN}Deploying to GCP Project: $PROJECT_ID${NC}"

# Set the project
gcloud config set project $PROJECT_ID

# Build and submit to Cloud Build
echo -e "${YELLOW}Building Docker image...${NC}"
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars "API_TITLE=Quota Backend API,API_VERSION=1.0.0,DEBUG=false" \
    --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest,MONGODB_URL=MONGODB_URL:latest"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "Service URL: ${GREEN}$SERVICE_URL${NC}"
echo -e "Health check: ${GREEN}$SERVICE_URL/health${NC}"
echo -e "API docs: ${GREEN}$SERVICE_URL/docs${NC}"
