# Deployment Guide for Kora-Recapture

> **Production deployment recommendations for maximum reliability**

---

## 🚀 Deployment Options

### Option 1: VPS Deployment (Recommended)
Best for 24/7 automated monitoring with full control.

### Option 2: Serverless (Advanced)
For cost-effective, scheduled-only reclaims.

### Option 3: Local Machine (Development/Testing)
For testing and manual operations.

---

## 📦 Option 1: VPS Deployment (Ubuntu/Debian)

### 1. Server Requirements

**Minimum Specs:**
- 1 CPU core
- 1GB RAM
- 20GB SSD storage
- Ubuntu 22.04 LTS or Debian 11+

**Recommended Providers:**
- DigitalOcean ($6/month droplet)
- Linode ($5/month nanode)
- Vultr ($6/month instance)
- Hetzner ($4.5/month CX11)

### 2. Initial Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install essentials
apt install -y curl git build-essential

# Create non-root user
adduser kora
usermod -aG sudo kora
su - kora
```

### 3. Install Node.js & pnpm

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# Verify installations
node --version  # Should be v20.x
pnpm --version  # Should be 8.x+
```

### 4. Clone and Setup Project

```bash
# Clone repository
git clone https://github.com/victoradoghe/kora-recapture.git
cd kora-recapture

# Install bot dependencies
cd bot
pnpm install

# Copy environment template
cp .env.example .env
```

### 5. Configure Environment

Edit `.env`:

```bash
nano .env
```

```bash
# Solana Configuration
SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY
SOLANA_NETWORK=mainnet-beta
OPERATOR_PRIVATE_KEY=your_base58_key_here

# Safety
DRY_RUN=false  # Set to false for production (after testing!)
INACTIVITY_DAYS=30

# Scheduling - Run every 6 hours
SCHEDULE=0 */6 * * *

# API
API_PORT=3001
CORS_ORIGIN=https://your-dashboard-domain.com

# Alerts
ALERT_THRESHOLD_SOL=10
ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK
```

**Important:** Never commit `.env` to git!

### 6. Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the API server
pm2 start pnpm --name kora-api -- api

# Start the scheduler
pm2 start pnpm --name kora-scheduler -- scheduler

# Save PM2 configuration
pm2 save

# Enable PM2 on system boot
pm2 startup
# Follow the command it outputs
```

### 7. Monitor Processes

```bash
# View running processes
pm2 list

# View logs
pm2 logs kora-api
pm2 logs kora-scheduler

# Restart services
pm2 restart all

# Stop services
pm2 stop all
```

---

## 🌐 Setting Up the Dashboard

### 1. Build for Production

```bash
# In the web directory
cd ~/kora-recapture/web
pnpm install
pnpm build

# Output will be in dist/
```

### 2. Serve with Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/kora-dashboard
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /home/kora/kora-recapture/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to bot
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/kora-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Add SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
sudo certbot renew --dry-run
```

---

## 🔐 Security Best Practices

### 1. Firewall Configuration

```bash
# Enable firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verify status
sudo ufw status
```

### 2. SSH Hardening

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config
```

Change these settings:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Restart SSH:

```bash
sudo systemctl restart sshd
```

### 3. Environment Variable Security

```bash
# Restrict .env file permissions
chmod 600 ~/kora-recapture/bot/.env

# Only kora user can read
ls -l ~/kora-recapture/bot/.env
# Should show: -rw------- 1 kora kora
```

### 4. Private Key Security

**NEVER:**
- Commit private keys to git
- Share `.env` files
- Use main wallet for operator

**ALWAYS:**
- Use dedicated operator wallet
- Keep backups encrypted
- Rotate keys periodically

---

## 📊 Monitoring & Logging

### 1. PM2 Log Management

```bash
# View all logs
pm2 logs

# View specific service
pm2 logs kora-api --lines 100

# Clear old logs
pm2 flush

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 2. Disk Space Monitoring

```bash
# Check disk usage
df -h

# Check kora data directory
du -sh ~/kora-recapture/bot/data/logs
```

### 3. System Resource Monitoring

```bash
# Install htop
sudo apt install -y htop

# Monitor resources
htop

# Check PM2 monit
pm2 monit
```

---

## 🔔 Alert Configuration

### Discord Webhook Setup

1. **Create Webhook:**
   - Go to Discord Server Settings → Integrations → Webhooks
   - Click "New Webhook"
   - Copy the webhook URL

2. **Add to Environment:**
   ```bash
   ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/123456/abcdef
   ```

3. **Test Alert:**
   ```bash
   cd ~/kora-recapture/bot
   pnpm cli test-alert
   ```

### Slack Webhook (Alternative)

```bash
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

---

## 🔄 Maintenance Tasks

### Daily

```bash
# Check PM2 status
pm2 list

# View recent logs
pm2 logs --lines 50
```

### Weekly

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check disk space
df -h

# Review logs for anomalies
pm2 logs kora-api --lines 500 | grep ERROR
```

### Monthly

```bash
# Update Node.js packages
cd ~/kora-recapture/bot
pnpm update

cd ~/kora-recapture/web
pnpm update

# Rebuild dashboard
pnpm build

# Restart PM2 processes
pm2 restart all
```

---

## 🆘 Troubleshooting

### Bot Not Starting

```bash
# Check PM2 logs
pm2 logs kora-api --err

# Common issues:
# - Invalid OPERATOR_PRIVATE_KEY
# - RPC endpoint not responding
# - Port 3001 already in use

# Test configuration
cd ~/kora-recapture/bot
pnpm cli scan --dry-run
```

### Dashboard Not Loading

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify build exists
ls -la ~/kora-recapture/web/dist

# Test API connection
curl http://localhost:3001/api/health
```

### High Memory Usage

```bash
# Check PM2 memory usage
pm2 list

# Restart services to clear memory
pm2 restart all

# If persistent, increase server RAM or optimize logs
```

---

## 📈 Performance Optimization

### 1. Database Optimization (Future)

If you add a database:

```bash
# PostgreSQL for historical data
sudo apt install -y postgresql
# Configure connection pooling
```

### 2. Caching

```bash
# Redis for API caching
sudo apt install -y redis-server
sudo systemctl enable redis-server
```

### 3. Load Balancing

For high-traffic dashboards:

```nginx
upstream api_backend {
    server localhost:3001;
    server localhost:3002;
}
```

---

## 🔧 Advanced: Docker Deployment

### Dockerfile (bot)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "api"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  bot-api:
    build: ./bot
    ports:
      - "3001:3001"
    env_file:
      - ./bot/.env
    volumes:
      - ./bot/data:/app/data
    restart: always

  scheduler:
    build: ./bot
    command: pnpm scheduler
    env_file:
      - ./bot/.env
    volumes:
      - ./bot/data:/app/data
    restart: always

  dashboard:
    build: ./web
    ports:
      - "80:80"
    depends_on:
      - bot-api
    restart: always
```

Run with:

```bash
docker-compose up -d
```

---

## 📞 Support & Monitoring

### Health Check Endpoint

```bash
# Check bot health
curl https://your-domain.com/api/health

# Should return:
# { "status": "ok", "uptime": 12345 }
```

### UptimeRobot (Free Monitoring)

1. Sign up at uptimerobot.com
2. Add HTTP(s) monitor for `https://your-domain.com/api/health`
3. Get alerts if service goes down

---

## ✅ Deployment Checklist

- [ ] Server provisioned and secured
- [ ] Node.js and pnpm installed
- [ ] Repository cloned
- [ ] `.env` configured with secure values
- [ ] PM2 installed and configured
- [ ] Services started and saved
- [ ] Dashboard built and deployed
- [ ] Nginx configured with SSL
- [ ] Firewall enabled
- [ ] SSH hardened
- [ ] Monitoring alerts configured
- [ ] Backup strategy implemented
- [ ] Documentation reviewed

---

**Your Kora-Recapture system is now ready for production! 🚀**

For issues or questions, refer to the [main README](../README.md) or create an issue on GitHub.
