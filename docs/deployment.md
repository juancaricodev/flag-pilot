# Deployment Guide

> Step-by-step guide to deploy Flag Pilot to production.

---

## Architecture

```
                    INTERNET
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼                       ▼
    ┌─────────────┐        ┌─────────────┐
    │   Vercel    │        │   AWS EC2   │
    │ (Dashboard) │        │    (API)    │
    │             │        │             │
    │  Next.js    │───────►│  NestJS     │
    │  Port: 3000 │  HTTP  │  Port: 3001 │
    └─────────────┘        └──────┬──────┘
                                  │
                            ┌─────▼─────┐
                            │ PostgreSQL │
                            │  Port:5432 │
                            └───────────┘
```

**Note**: Dashboard communicates with API via HTTP. Auth cookies use `secure: false` for MVP (no HTTPS). Post-MVP: add domain + nginx + HTTPS.

---

## Prerequisites

- [ ] AWS account (free tier eligible)
- [ ] Vercel account (free tier)
- [ ] GitHub repository access
- [ ] SSH key pair generated

---

## Part 1: EC2 Setup (API)

### Step 1: Create EC2 Instance

1. Go to AWS EC2 Console → Launch Instance
2. Configure:
   - **Name**: `flag-pilot-api`
   - **AMI**: Ubuntu 22.04 LTS
   - **Instance type**: t3.micro (free tier)
   - **Key pair**: Create new or select existing
   - **Network settings**: Allow SSH (22), HTTP (80), HTTPS (443)
   - **Storage**: 20 GB gp3
3. Launch instance

### Step 2: Connect to EC2

```bash
# Change permissions on your key
chmod 400 ~/.ssh/your-key.pem

# Connect
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 3: Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose-plugin

# Add ubuntu user to docker group (no sudo needed for docker commands)
sudo usermod -aG docker ubuntu

# Apply group changes (or logout/login)
newgrp docker

# Verify installation
docker --version
docker compose version
```

### Step 4: Clone Repository

```bash
# Clone the repo
git clone https://github.com/juancaricodev/flag-pilot.git /opt/flag-pilot

# Navigate to project
cd /opt/flag-pilot
```

### Step 5: Create Environment File

```bash
# Create .env.prod on EC2
cat > /opt/flag-pilot/.env.prod << 'EOF'
POSTGRES_PASSWORD=your_secure_password_here
JWT_SECRET=your_jwt_secret_here
EOF

# Secure the file
chmod 600 /opt/flag-pilot/.env.prod
```

**Important**: Replace `your_secure_password_here` and `your_jwt_secret_here` with strong, unique values.

### Step 6: Test Deployment (Manual)

```bash
# Start all services (postgres → migrate → api)
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build

# Check status
docker compose --env-file .env.prod -f docker-compose.prod.yml ps

# Check migration logs
docker compose --env-file .env.prod -f docker-compose.prod.yml logs migrate

# Check API logs
docker compose --env-file .env.prod -f docker-compose.prod.yml logs api

# Test health endpoint
curl http://localhost:3001/health
# Should return: {"status":"ok"}

# Stop services (for now)
docker compose --env-file .env.prod -f docker-compose.prod.yml down
```

### Step 7: Configure GitHub Secrets

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add secrets:
   - **Name**: `EC2_HOST`
     **Value**: `YOUR_EC2_PUBLIC_IP`
   - **Name**: `EC2_SSH_KEY`
     **Value**: Paste the PRIVATE key content (entire file including BEGIN/END lines)

### Step 8: Test CD Workflow

```bash
# Push to main to trigger CD workflow
git push origin main

# Watch the workflow in GitHub Actions tab
# After completion, verify:
curl http://YOUR_EC2_IP:3001/health
# Should return: {"status":"ok"}
```

---

## Part 2: Vercel Setup (Dashboard)

### Step 1: Connect Repository

1. Go to vercel.com/new
2. Import GitHub repository
3. Select `flag-pilot` repo

### Step 2: Configure Build Settings

Vercel should auto-detect Next.js. Verify/update:

- **Framework Preset**: Next.js
- **Root Directory**: `apps/dashboard`
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install`

### Step 3: Configure Environment Variables

1. In Vercel project settings → Environment Variables
2. Add:
   - **Key**: `NEXT_PUBLIC_API_URL`
     **Value**: `http://YOUR_EC2_IP:3001`
     **Environments**: Production, Preview, Development

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Vercel assigns a URL like `flag-pilot.vercel.app`

### Step 5: Test Dashboard

1. Visit your Vercel URL
2. Login with admin credentials (from seed data)
3. Verify flags load from API

---

## Part 6: Verify Full Stack

1. **Dashboard**: Visit `https://your-app.vercel.app`
2. **Login**: Use admin credentials
3. **Create Flag**: Create a new feature flag
4. **Toggle**: Enable/disable the flag
5. **API Health**: Visit `http://YOUR_EC2_IP:3001/health`

---

## Troubleshooting

### API won't start

```bash
# Check migration logs first
docker compose --env-file .env.prod -f docker-compose.prod.yml logs migrate

# Check API logs
docker compose --env-file .env.prod -f docker-compose.prod.yml logs api

# Common issues:
# - DATABASE_URL wrong → check .env.prod
# - Port 3001 in use → check for other processes
# - Prisma migration failed → check PostgreSQL is running
```

### Dashboard can't reach API

```bash
# Check API is running
curl http://YOUR_EC2_IP:3001/health

# Check Vercel environment variable
# NEXT_PUBLIC_API_URL should be http://YOUR_EC2_IP:3001

# Check browser console for CORS errors
# (Not expected - API allows all origins for MVP)
```

### CD Workflow fails

```bash
# Check GitHub Actions logs
# Common issues:
# - EC2_HOST wrong → verify IP address
# - EC2_SSH_KEY wrong → verify private key format
# - Docker not running → SSH and check: systemctl status docker
```

---

## Post-MVP Improvements

After MVP, consider:

1. **Domain + HTTPS** — Buy domain, configure nginx + Let's Encrypt
2. **PostgreSQL Backup** — pg_dump cron or EBS snapshots
3. **Monitoring** — UptimeRobot for uptime alerts
4. **Logging** — CloudWatch or similar

See `docs/post-mvp.md` for details.

---

## Quick Reference

| Service    | URL                           | Port        |
| ---------- | ----------------------------- | ----------- |
| Dashboard  | `https://your-app.vercel.app` | 443 (HTTPS) |
| API        | `http://YOUR_EC2_IP:3001`     | 3001 (HTTP) |
| PostgreSQL | Internal only                 | 5432        |

| File                       | Purpose                       |
| -------------------------- | ----------------------------- |
| `.env.prod`                | Environment variables for EC2 |
| `docker-compose.prod.yml`  | Production Docker services    |
| `apps/api/Dockerfile`      | API container build           |
| `.github/workflows/cd.yml` | Automated deployment          |
