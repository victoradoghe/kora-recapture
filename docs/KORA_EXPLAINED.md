# How Kora Works: Transaction Sponsorship & Rent Mechanics

> **A deep dive into Kora's sponsorship model and where rent locking happens**

---

## 📖 Table of Contents

1. [What is Kora?](#what-is-kora)
2. [The Transaction Sponsorship Problem](#the-transaction-sponsorship-problem)
3. [How Kora Solves It](#how-kora-solves-it)
4. [Understanding Solana Rent](#understanding-solana-rent)
5. [Where Rent Locking Happens](#where-rent-locking-happens)
6. [The Hidden Cost Problem](#the-hidden-cost-problem)
7. [How Kora-Recapture Helps](#how-kora-recapture-helps)

---

## 🤔 What is Kora?

**Kora** is infrastructure that enables **gasless transactions** on Solana. It allows applications to sponsor transaction fees and account creation costs on behalf of their users.

### The User Experience Problem

Without Kora:
```
User wants to use your dApp
  ↓
User needs SOL for gas fees
  ↓
User must go to exchange, buy SOL, transfer to wallet
  ↓
High friction = Lost users
```

With Kora:
```
User wants to use your dApp
  ↓
App sponsors the transaction via Kora
  ↓
User interacts seamlessly (no SOL needed!)
  ↓
Great UX = More users
```

---

## 💸 The Transaction Sponsorship Problem

On Solana, every transaction requires:

1. **Transaction fees** (~0.000005 SOL per signature)
2. **Rent** for account creation (~0.00089088 SOL for small accounts)

### Traditional Model (User Pays)
```solana
Transaction {
  signatures: [userKeypair],      // User signs
  fee_payer: userPublicKey,       // User pays fees
  instructions: [...]
}
```

### Sponsored Model (App Pays via Kora)
```solana
Transaction {
  signatures: [userKeypair, koraNodeKeypair],  // Both sign
  fee_payer: koraNodePublicKey,                // Kora pays fees
  instructions: [...]
}
```

---

## 🔧 How Kora Solves It

Kora operates **relay nodes** that:

1. **Accept unsigned transactions** from dApps
2. **Sign with node wallet** (becoming the fee payer)
3. **Submit to Solana network**
4. **Charge apps** via API credits or subscription

### The Flow

```
┌─────────┐      ┌──────────┐      ┌─────────────┐      ┌─────────┐
│  User   │─────▶│   dApp   │─────▶│ Kora Node   │─────▶│ Solana  │
└─────────┘      └──────────┘      └─────────────┘      └─────────┘
   Signs            Creates            Signs &              Executes
transaction       transaction          Pays Fees          transaction
```

### Code Example (How dApps Use Kora)

```typescript
import { Connection, Transaction } from '@solana/web3.js';

// Your unsigned transaction
const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: userWallet.publicKey,
    toPubkey: recipientPublicKey,
    lamports: 1000000,
  })
);

// Send to Kora for sponsorship
const response = await fetch('https://kora-node.example.com/sponsor', {
  method: 'POST',
  body: JSON.stringify({
    transaction: transaction.serialize(),
    userSignature: await userWallet.signTransaction(transaction)
  })
});

// Kora node signs, pays fees, and submits
const { signature } = await response.json();
```

---

## 🏦 Understanding Solana Rent

On Solana, **rent** is a mechanism to prevent state bloat. Every account that stores data must pay rent to exist on-chain.

### Rent-Exempt Threshold

An account is **rent-exempt** if it holds:
```
Rent = (Account Size in bytes) × Rent Rate × 2 years of epochs
```

For a typical **Token Account** (165 bytes):
```
Rent ≈ 0.00203928 SOL (rent-exempt minimum)
```

### Who Pays Rent?

When an account is created, **someone must deposit the rent**. In Kora's case:

```typescript
// Creating a new Token Account (ATA)
const createATAInstruction = createAssociatedTokenAccount(
  connection,
  feePayer,        // ← Kora node wallet (pays rent!)
  mint,
  ownerPublicKey   // User owns the account
);
```

**The Kora node pays the rent**, but **the user owns the account**.

---

## 📍 Where Rent Locking Happens

Rent gets locked in multiple scenarios:

### 1. **Associated Token Account (ATA) Creation**

Most common scenario:

```typescript
// User wants to receive Token X for the first time
// dApp creates ATA via Kora sponsorship

const ata = await getAssociatedTokenAddress(
  tokenMint,
  userWallet
);

// Kora node pays ~0.00203928 SOL to create this account
const tx = new Transaction().add(
  createAssociatedTokenAccountInstruction(
    koraNode,     // Payer (Kora locks rent here!)
    ata,
    userWallet,   // Owner
    tokenMint
  )
);
```

**Result:** Kora node's wallet loses 0.002 SOL. This SOL is now **locked** in the ATA.

### 2. **Program Derived Addresses (PDAs)**

When dApps create PDAs through Kora:

```typescript
// Creating a game player account
const [playerPDA] = PublicKey.findProgramAddress(
  [Buffer.from("player"), userWallet.toBuffer()],
  gameProgramId
);

// Kora sponsors the creation
// Rent locked: ~0.001-0.01 SOL depending on account size
```

### 3. **Metadata Accounts**

NFT metadata, config accounts, etc.:

```typescript
// Minting NFT via sponsored transaction
// Metadata account created → Rent locked by Kora
```

---

## 💔 The Hidden Cost Problem

Over time, this creates a **silent capital drain**:

### Scenario: Gaming dApp Using Kora

```
Month 1:  1,000 users onboard → 1,000 ATAs created
          Rent locked: 1,000 × 0.002 = 2 SOL

Month 6:  10,000 users total
          Rent locked: 10,000 × 0.002 = 20 SOL

Month 12: 50,000 users, but only 5,000 active
          Rent locked: 50,000 × 0.002 = 100 SOL
          Active rent: 5,000 × 0.002 = 10 SOL
          
          ❌ 90 SOL locked in inactive accounts!
```

### Why It's a Problem

1. **No Visibility** - Operators don't track which accounts are inactive
2. **Manual Work** - Checking thousands of accounts is impractical
3. **Capital Inefficiency** - Rent sits idle instead of being reused
4. **Scaling Cost** - More users = more locked capital

### Real-World Impact

A Kora node sponsoring 100,000 account creations:
```
100,000 accounts × 0.002 SOL = 200 SOL locked

At $100/SOL → $20,000 in locked capital
At $200/SOL → $40,000 in locked capital
```

If 50% of accounts become inactive, that's **$10,000-$20,000 recoverable**.

---

## 🎯 When Can Rent Be Reclaimed?

Rent is only recoverable when an account is **closed**. For Token Accounts:

### Conditions for Closing

```typescript
// An ATA can be closed if:
const canClose = 
  account.amount === 0 &&           // No tokens in account
  account.delegate === null &&      // No active delegate
  account.closeAuthority === owner; // Owner has permission
```

### The Close Instruction

```typescript
const closeInstruction = createCloseAccountInstruction(
  accountToClose,      // The ATA
  destination,         // Where rent goes (Kora wallet)
  owner               // Must sign (usually the user)
);
```

**Problem:** Users don't manually close their own ATAs. They:
- Don't know they can
- Don't care about 0.002 SOL
- Have abandoned the wallet

**Solution:** Kora-Recapture automates this.

---

## 🔄 How Kora-Recapture Helps

Kora-Recapture fills the gap by:

### 1. **Monitoring**
Scans all accounts where the Kora node was the fee payer:

```typescript
// Identifies Kora-sponsored accounts
const sponsoredAccounts = transactions
  .filter(tx => tx.feePayer === koraNodePublicKey)
  .map(tx => extractCreatedAccounts(tx));
```

### 2. **Auditing**
Checks if accounts are eligible for reclaim:

```typescript
const isEligible = 
  account.amount === 0 &&                    // Empty
  daysSinceLastActivity(account) > 30 &&     // Inactive
  !whitelist.includes(account.address);      // Not protected
```

### 3. **Reclaiming**
Safely closes accounts and recovers rent:

```typescript
// For each eligible account:
const closeIx = createCloseAccountInstruction(
  accountAddress,
  koraNodePublicKey,  // Rent returns here ✅
  accountOwner        // Owner must have signed (special case)
);
```

**Note:** For user-owned ATAs, reclaim requires **owner cooperation** or **system-level authority** (which Kora nodes don't have). See [technical limitations](#technical-limitations) below.

---

## ⚠️ Technical Limitations

### Challenge: Account Ownership

Most Kora-sponsored accounts are **owned by users**, not the Kora node:

```
┌─────────────────────┐
│  Token Account      │
├─────────────────────┤
│ Owner: UserWallet   │  ← User controls this
│ Rent: Paid by Kora  │  ← Kora wants to reclaim this
└─────────────────────┘
```

### Possible Solutions

1. **User Cooperation** (Requires user signature)
   ```typescript
   // User must sign the close instruction
   // Difficult to coordinate at scale
   ```

2. **Program Authority** (Custom program)
   ```rust
   // Deploy a program with close_account IX
   // Users delegate authority to program
   // Kora can trigger closes via program
   ```

3. **Monitored Exit** (Passive tracking)
   ```typescript
   // Wait for users to naturally close accounts
   // Recapture focuses on Kora-owned PDAs instead
   ```

**Kora-Recapture's Approach:**
- Focuses on **Kora-controlled accounts** (PDAs, system accounts)
- Provides **monitoring and alerts** for user-owned accounts
- Suggests **batch close campaigns** where users are incentivized to close

---

## 📊 Rent Reclaim Economics

### ROI Calculation

For a Kora node with 10,000 sponsored ATAs:

```
Total rent locked:     10,000 × 0.002 = 20 SOL
Inactive (60%):        6,000 × 0.002 = 12 SOL
Reclaimable (50% coop): 3,000 × 0.002 = 6 SOL

At $150/SOL: $900 recoverable
```

Minus operational costs:
```
Bot hosting: ~$20/month
Gas for closes: ~0.000005 × 3,000 = 0.015 SOL (~$2)

Net recovery: ~$878/month
Annual: ~$10,536
```

---

## 🎓 Key Takeaways

1. **Kora enables gasless UX** by sponsoring transactions
2. **Rent is locked** when Kora creates accounts as fee payer
3. **Inactive accounts accumulate** over time (hidden cost)
4. **Rent can be reclaimed** by closing empty accounts
5. **Manual tracking is impractical** at scale
6. **Automation is essential** for capital efficiency
7. **Kora-Recapture solves this** with monitoring & reclaim

---

## 📚 Additional Resources

- [Solana Rent Documentation](https://docs.solana.com/developing/programming-model/accounts#rent)
- [Kora Documentation](https://docs.kora.com) (Hypothetical)
- [SPL Token Program](https://spl.solana.com/token)
- [Associated Token Account Program](https://spl.solana.com/associated-token-account)

---

**Understanding Kora's sponsorship model is key to recognizing the rent-reclaim opportunity. Kora-Recapture turns this hidden cost into recoverable capital.**
