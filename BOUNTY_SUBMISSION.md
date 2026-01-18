

## Summary

**Kora-Recapture** is production-ready automated rent reclaim system for Kora node operators.

---

## 📋 Bounty Requirements Checklist

### ✅ Core Functionality
- [x] Monitors accounts sponsored by a Kora node
- [x] Detects when accounts are closed or eligible for reclaim
- [x] Reclaims locked rent SOL back to operator treasury
- [x] Working prototype on mainnet (configured and tested)

### ✅ Documentation
- [x] Comprehensive README with setup instructions
- [x] Detailed explanation of how Kora works ([KORA_EXPLAINED.md](docs/KORA_EXPLAINED.md))
- [x] Where rent locking happens (explained in detail)
- [x] Production deployment guide ([DEPLOYMENT.md](docs/DEPLOYMENT.md))

### ✅ Code Quality
- [x] Fully open source (MIT License)
- [x] Clean, readable TypeScript code
- [x] Comprehensive comments throughout
- [x] Type-safe with strict TypeScript config

### ✅ Features Implemented

**Automation:**
- [x] Cron-based backend service (runs every 6 hours)
- [x] CLI tool for manual operations
- [x] REST API for programmatic access

**Monitoring & Reporting:**
- [x] React dashboard showing total rent locked vs reclaimed
- [x] Real-time metrics with trend charts
- [x] Detailed logs explaining why accounts were/weren't reclaimed
- [x] Alert system for idle rent (Discord/Slack webhooks)

**Safety & Controls:**
- [x] Whitelist system to protect active accounts
- [x] Dry-run mode for testing
- [x] Emergency stop functionality
- [x] Clear transaction history with Solscan links
- [x] Audit trail for all operations

**Kora-Specific:**
- [x] Kora-sponsored account detection logic
- [x] Multiple detection methods (program IDs, memos, fee payers)
- [x] Statistics on Kora vs other sponsored accounts
- [x] Configurable Kora identifiers

---

## 🎯 Bonus Features Achieved

- ✅ Beautiful, responsive dashboard (mobile/tablet/desktop)
- ✅ Alert thresholds with webhook notifications
- ✅ Kora-specific detection and filtering
- ✅ Production deployment guide
- ✅ Docker support (in deployment guide)
- ✅ Comprehensive architecture documentation

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `README.md` | Main documentation |
| `docs/KORA_EXPLAINED.md` | Deep dive into Kora sponsorship & rent mechanics |
| `docs/DEPLOYMENT.md` | Production deployment guide |
| `bot/src/services/monitor.service.ts` | Kora-specific account detection |
| `bot/src/services/alert.service.ts` | Webhook alert system |
| `web/src/` | React dashboard |

---

## 🚀 Tech Stack

**Backend (Bot):**
- TypeScript
- Node.js
- Solana Web3.js & SPL Token
- Express.js (API)
- node-cron (scheduling)

**Frontend (Dashboard):**
- React 18
- TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- TanStack Query
- Recharts

---

## 💡 How It Solves the Problem

### Before Kora-Recapture:
- ❌ Operators have no visibility into rent-locked SOL
- ❌ Manual tracking is impractical at scale
- ❌ Silent capital loss accumulates over time
- ❌ No way to distinguish Kora accounts from others

### With Kora-Recapture:
- ✅ Automated monitoring of all sponsored accounts
- ✅ Real-time dashboard shows exactly where SOL is locked
- ✅ Safe, auditable reclaim process
- ✅ Kora-specific detection and statistics
- ✅ Alerts when large amounts are reclaimable
- ✅ Complete audit trail

---

## 📊 Sample Results

For a Kora node with 10,000 sponsored accounts:

```
Total rent locked:     20.00 SOL
Kora-sponsored:        18.50 SOL (92.5%)
Other sponsored:        1.50 SOL (7.5%)
Reclaimable:            6.25 SOL (31.25%)

At $150/SOL → $937.50 recoverable
Annual potential: ~$11,250
```

---

## 🎪 Demo

**Live Dashboard:** `http://localhost:5173`  
**API Endpoints:** `http://localhost:3001/api`

1. Start services: `pnpm api` (bot) and `pnpm dev` (web)
2. Click "Scan Now" to find accounts
3. Review metrics and logs
4. Test alerts with configurable thresholds

---


### Technical Excellence
- Production-ready code with proper error handling
- Type-safe TypeScript throughout
- Modular, testable architecture
- Comprehensive documentation

### Solves Real Problem
- Addresses actual pain point for Kora operators
- Proven ROI calculation
- Safe, auditable process
- Scales to handle thousands of accounts

### Goes Beyond Requirements
- Beautiful UI/UX
- Alert system
- Kora-specific detection
- Production deployment guide
- Docker support

### Ready to Use Today
- Works on mainnet right now
- Clear setup instructions
- Well-documented API
- Active safety measures

---

## 📞 Contact

- **GitHub**: [victoradoghe](https://github.com/victoradoghe)
- **Twitter**: [@D3vnox](https://twitter.com/D3vnox)
- **Email**: victoradoghe112@gmail.com

example.com

---

**Built solo for the SuperteamNG Kora Bounty**  
**Ready for live walkthrough presentation** 🎯
