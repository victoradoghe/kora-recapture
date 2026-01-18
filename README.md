# Kora-Recapture: Automated Rent Reclaim System

> **Recover silent capital loss from inactive Kora-sponsored accounts**

Kora-Recapture is an automated monitoring and reclaim system that helps Solana node operators recover rent-locked SOL from inactive accounts sponsored through Kora. Built for the SuperteamNG Kora bounty.

![Status](https://img.shields.io/badge/status-production--ready-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Solana](https://img.shields.io/badge/solana-mainnet-purple)

---

## 🎯 The Problem

When a Kora node sponsors account creation on Solana, SOL is automatically locked as **rent**. This improves user experience but creates a hidden operational cost:

- **Rent accumulates** across thousands of sponsored accounts
- **Many accounts** become inactive, closed, or abandoned
- **Operators lose visibility** into where their capital is locked
- **Manual tracking** is time-consuming and error-prone
- **Rent is rarely reclaimed**, leading to **silent capital loss**

**Kora-Recapture solves this** by automatically monitoring, auditing, and reclaiming rent from eligible accounts.

---

## Features

### Core Functionality
- ✅ **Automated Monitoring** - Scans all Kora-sponsored accounts continuously
- ✅ **Smart Auditing** - Identifies accounts eligible for rent reclaim
- ✅ **Safe Reclaim** - Closes accounts and recovers SOL to operator treasury
- ✅ **Real-time Dashboard** - Visualize rent locked vs reclaimed
- ✅ **Comprehensive Logs** - Full audit trail with transaction links

### Safety & Controls
- ✅ **Dry-run Mode** - Simulate reclaims without spending SOL
- ✅ **Whitelist System** - Protect specific accounts from reclaim
- ✅ **Emergency Stop** - Immediately halt all operations
- ✅ **Inactivity Threshold** - Configurable days before reclaim eligibility

### Monitoring & Alerts
- ✅ **Live Metrics** - Track total rent locked, reclaimable SOL, accounts monitored
- ✅ **Trend Charts** - Visualize changes over time
- ✅ **Transaction History** - View all reclaim operations with Solscan links
- ✅ **Alert Thresholds** - Notifications when large amounts are idle

### Developer Experience
- ✅ **TypeScript** - Fully typed for safety and maintainability
- ✅ **CLI Interface** - Run commands manually or via automation
- ✅ **REST API** - Integrate with your existing tools
- ✅ **Cron Scheduler** - Set-and-forget automated reclaims

---

## 📦 Project Structure

```
kora-recapture/
├── bot/                    # Backend service (Node.js + TypeScript)
│   ├── src/
│   │   ├── services/      # Core business logic
│   │   │   ├── monitor.service.ts    # Account scanning
│   │   │   ├── audit.service.ts      # Eligibility checks
│   │   │   ├── reclaim.service.ts    # SOL recovery
│   │   │   └── logger.service.ts     # Logging & metrics
│   │   ├── utils/         # Helper functions
│   │   ├── config/        # Configuration loader
│   │   ├── api/           # REST API server
│   │   ├── cli.ts         # Command-line interface
│   │   └── scheduler.ts   # Automated cron jobs
│   ├── data/              # Persistent data
│   │   ├── whitelist.json
│   │   ├── state/
│   │   └── logs/
│   └── package.json
│
├── web/                   # Dashboard (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── api/           # API client
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main application
│   └── package.json
│
├── docs/
│   ├── KORA_EXPLAINED.md  # How Kora works & rent mechanics
│   ├── DEPLOYMENT.md      # Production deployment guide
│   └── ARCHITECTURE.md    # System design documentation
│
└── README.md              # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Solana wallet with SOL (for gas fees)
- Alchemy RPC endpoint (or other Solana RPC)
- Kora node operator wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/kora-recapture.git
cd kora-recapture

# Install bot dependencies
cd bot
pnpm install

# Install dashboard dependencies
cd ../web
pnpm install
```

### Configuration

Create `bot/.env`:

```bash
# Solana Configuration
SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY
SOLANA_NETWORK=mainnet-beta
OPERATOR_PRIVATE_KEY=your_base58_private_key_here

# Safety Settings
DRY_RUN=true                    # Start in safe mode
INACTIVITY_DAYS=30              # Days before account is considered inactive

# Automation
SCHEDULE=0 */6 * * *            # Run every 6 hours (cron format)

# API & Dashboard
API_PORT=3001
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

⚠️ **IMPORTANT SECURITY NOTES:**
- Never commit `.env` to git
- Use a separate operator wallet for testing
- Start with `DRY_RUN=true` to simulate without real transactions
- Test thoroughly on devnet before mainnet

### Running the System

```bash
# Terminal 1: Start the bot API server
cd bot
pnpm api

# Terminal 2: Start the dashboard
cd web
pnpm dev

# Open dashboard at http://localhost:5173
```

---

## 📖 Usage Guide

### CLI Commands

```bash
# Scan for reclaimable accounts
pnpm cli scan

# Perform reclaim (respects DRY_RUN setting)
pnpm cli reclaim

# View statistics
pnpm cli stats

# Manage whitelist
pnpm cli whitelist:add <address>
pnpm cli whitelist:remove <address>

# Emergency stop
pnpm cli emergency-stop --reason "Manual intervention required"

# Start automated scheduler
pnpm scheduler
```

### Dashboard Operations

1. **View Metrics**
   - Total Rent Locked: SOL currently in sponsored accounts
   - Reclaimable SOL: Amount available to reclaim now
   - Accounts Monitored: Total sponsored accounts tracked
   - Total Reclaimed: Historical SOL recovered

2. **Trigger Actions**
   - **Scan Now**: Manually trigger account scan
   - **Reclaim Now**: Execute reclaim on eligible accounts
   - **Emergency Stop**: Halt all automated operations

3. **Review Logs**
   - Filter by action type (scan, audit, reclaim)
   - View transaction signatures with Solscan links
   - Understand why accounts were skipped or reclaimed

---

## 🔍 How It Works

### 1. Monitoring Phase
The `MonitorService` scans the operator wallet's transaction history to find all accounts where the operator paid for creation:

```typescript
// Identifies accounts sponsored by this Kora node
const sponsoredAccounts = await monitorService.scanForSponsoredAccounts();
```

### 2. Audit Phase
The `AuditService` checks each account against eligibility criteria:

```typescript
const isEligible = 
  account.isEmpty &&                    // No tokens/data
  account.isInactive(INACTIVITY_DAYS) && // Not used recently
  account.isCloseable &&                 // Can be closed
  !account.isWhitelisted;                // Not protected
```

### 3. Reclaim Phase
The `ReclaimService` executes the `CloseAccount` instruction to recover rent:

```typescript
// Returns rent to operator wallet
const signature = await reclaimService.closeAccount(accountAddress);
```

**See [`docs/KORA_EXPLAINED.md`](docs/KORA_EXPLAINED.md) for a deep dive into Kora sponsorship and rent mechanics.**

---

## 🛡️ Safety Features

### Dry-Run Mode
- Simulates all operations without submitting transactions
- Logs show "would reclaim X SOL" instead of actual signatures
- Perfect for testing and validation

### Whitelist Protection
```bash
# Protect important accounts
pnpm cli whitelist:add TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
```

### Emergency Stop
- Immediately halts all automated reclaim operations
- Can be triggered from dashboard or CLI
- Requires manual reset to resume

### Activity Checks
- Only reclaims accounts inactive for N days (configurable)
- Checks last transaction timestamp
- Skips recently active accounts

---

## 📊 Monitoring & Alerts

### Alert Thresholds
Configure alerts in `bot/.env`:

```bash
ALERT_THRESHOLD_SOL=10          # Alert when 10+ SOL is reclaimable
ALERT_WEBHOOK_URL=https://...   # Discord/Slack webhook (optional)
```

### Metrics Tracking
All operations are logged with:
- Timestamp
- Account address
- Action taken (scan/audit/reclaim)
- SOL amount (if applicable)
- Success/failure status
- Reason for skipping (if applicable)

### Dashboard Visualization
- Real-time metric cards with trend charts
- Filterable logs table
- Solscan integration for transaction verification

---

## 🧪 Testing

### Unit Tests (Coming Soon)
```bash
cd bot
pnpm test
```

### Integration Testing
1. Set `DRY_RUN=true` in `.env`
2. Run `pnpm cli scan` to find accounts
3. Check logs for eligible accounts
4. Run `pnpm cli reclaim` to see simulation
5. Verify "would reclaim" messages in logs

### Devnet Testing
```bash
# Switch to devnet in .env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Use devnet operator wallet
# Test with small amounts
```

---

## 📚 Documentation

- **[How Kora Works](docs/KORA_EXPLAINED.md)** - Sponsorship model & rent mechanics
- **[Architecture](docs/ARCHITECTURE.md)** - System design deep-dive
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production setup
- **[API Reference](docs/API.md)** - REST endpoint documentation

---

## 🔐 Security Best Practices

1. **Never use your main wallet** - Create a dedicated operator wallet
2. **Test on devnet first** - Validate logic before mainnet
3. **Start with DRY_RUN=true** - Understand behavior before live mode
4. **Review whitelist** - Protect critical accounts
5. **Monitor logs** - Watch for unexpected behavior
6. **Use environment variables** - Never hardcode private keys
7. **Enable rate limiting** - Prevent accidental spam
8. **Backup data directory** - Preserve logs and state

---

## 🎯 Bounty Requirements Checklist

- ✅ Monitors accounts sponsored by a Kora node
- ✅ Detects when accounts are closed/eligible
- ✅ Reclaims locked rent SOL to operator treasury
- ✅ Fully open source (MIT License)
- ✅ Detailed README explaining Kora & rent mechanics
- ✅ Working prototype on mainnet
- ✅ TypeScript implementation
- ✅ Dashboard with metrics & logs
- ✅ Whitelist & safety controls
- ✅ Clear transaction history & audit trail
- ✅ Automated scheduling (cron)
- ✅ CLI interface
- ✅ Alert thresholds
- ✅ Clean, commented code

---

## 🚢 Deployment

See **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** for production setup including:
- VPS configuration
- Process management (PM2)
- Reverse proxy setup
- SSL certificates
- Monitoring & logging
- Backup strategies

---

## 🤝 Contributing

This project is open source under the MIT License. Contributions welcome!

```bash
# Fork the repo
# Create a feature branch
git checkout -b feature/amazing-feature

# Commit changes
git commit -m "Add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **SuperteamNG** - For organizing the bounty
- **Kora Labs** - For building transaction sponsorship infrastructure
- **Solana Foundation** - For the amazing blockchain platform

---

## 📞 Contact & Support

- **Author**: [Victor Adoghe]
- **GitHub**: [victoradoghe](https://github.com/victoradoghe)
- **Twitter**: [@D3vnox](https://twitter.com/D3vnox)
- **Email**: victoradoghe112@gmail.com

---

## 🗺️ Roadmap

- [x] **Email/Discord notifications** - ✅ Implemented (alert.service.ts with webhook support)
- [ ] Telegram bot interface
- [ ] Historical data tracking & analytics
- [ ] Multi-wallet support
- [ ] Advanced filtering rules
- [ ] Scheduled reports (daily/weekly)
- [ ] Cost analysis & ROI metrics

---

**Built for the Solana ecosystem**
