# @noctum/sdk

Official TypeScript SDK for the [Noctum Protocol](https://noctum.io) — anonymous ETH transfers, zero-knowledge identity proofs, and wallet security monitoring on Base L2.

## Install

```bash
npm install @noctum/sdk
# or
pnpm add @noctum/sdk
# or
yarn add @noctum/sdk
```

## Quick Start

```ts
import { NoctumClient } from "@noctum/sdk";

// Public client — no API key required for read-only endpoints
const client = new NoctumClient();

// Authenticated client — required for pool transactions, proofs, and account data
const client = new NoctumClient({
  baseUrl: "https://noctum.io/api",  // default, optional
  apiKey: "noctum_...",              // get one at noctum.io/developers
});
```

## Modules

### `client.pool`

```ts
// Get live pool statistics from Base mainnet (public)
const stats = await client.pool.getStats();
// { totalDeposits, totalWithdrawals, tvlEth, pools: [...] }

// List available pool denominations (public)
const pools = await client.pool.getDenominations();
// [{ id, amount, token, fee, contractAddress, denominationWei }]

// Record a deposit after on-chain confirmation (requires API key)
const tx = await client.pool.deposit({
  commitment: "0x...",      // keccak256 hash of secret + nullifier
  denomination: "0.01",    // must match a live pool
  walletAddress: "0x...",
  txHash: "0x...",          // confirmed on-chain tx hash
});

// Submit a withdrawal via the relayer (requires API key)
// The relayer pays gas — your recipient wallet needs no ETH
const result = await client.pool.withdraw({
  secret: "...",
  nullifier: "...",
  recipient: "0x...",       // fresh wallet with no on-chain history
  denomination: "0.01",
});
// { txHash: "0x...", status: "confirmed" }

// List pool transactions for a wallet (requires API key)
const txns = await client.pool.getTransactions("0x...");
```

### `client.proofs`

```ts
// Generate a ZK identity proof from a wallet signature (requires API key)
const proof = await client.proofs.generate({
  walletAddress: "0x...",
  signature: "0x...",       // EIP-191 signature of message
  message: "noctum identity proof",
});
// { id, proofHash, publicSignal, isActive, createdAt }

// Fetch a proof by ID (public)
const proof = await client.proofs.get(proofId);

// Verify any proof — returns valid/invalid without revealing wallet (public)
const result = await client.proofs.verify(proofId);
// { valid: true, walletAddress, createdAt }

// Revoke a proof immediately (requires API key)
await client.proofs.revoke(proofId, { walletAddress: "0x..." });
```

### `client.security`

```ts
// On-chain risk scan for any Base wallet (public)
const scan = await client.security.scan("0x...");
// { riskScore, riskLevel, findings, ethBalance, usdcBalance, nonce, isContract }

// Get active ERC20 approvals for any address (public)
const approvals = await client.security.getApprovals("0x...");
// [{ token, spender, amount, blockNumber, transactionHash }]

// List watched wallets (requires API key)
const wallets = await client.security.getWallets("0x...");

// Get security alerts for watched wallets (requires API key)
const alerts = await client.security.getAlerts("0x...");
```

### `client.stats`

```ts
// Protocol-wide overview (public)
const overview = await client.stats.getOverview();
// { totalDeposits, totalWithdrawals, totalProofs, tvlEth, uniqueUsers }

// Recent protocol activity feed (public)
const activity = await client.stats.getActivity();
```

### `client.developer`

```ts
// List API keys for a wallet (requires API key)
const keys = await client.developer.listKeys("0x...");

// Create a new API key — full key shown once, store immediately (requires API key)
const key = await client.developer.createKey({
  walletAddress: "0x...",
  name: "my-app-prod",
});
// { id, name, keyPrefix, fullKey, callCount, createdAt }

// Revoke an API key permanently (requires API key)
await client.developer.revokeKey(keyId);

// Get API usage stats (requires API key)
const usage = await client.developer.getUsage("0x...");
// { totalCalls, todayCalls, monthlyCalls, topEndpoints }

// Register a webhook (requires API key)
const hook = await client.developer.createWebhook({
  walletAddress: "0x...",
  url: "https://your-server.com/webhook",
  events: ["deposit.confirmed", "proof.generated", "security.alert"],
});

// Delete a webhook (requires API key)
await client.developer.deleteWebhook(webhookId);
```

## Error Handling

```ts
import { NoctumClient, NoctumError } from "@noctum/sdk";

const client = new NoctumClient({ apiKey: "noctum_..." });

try {
  const result = await client.pool.withdraw({ ... });
} catch (err) {
  if (err instanceof NoctumError) {
    console.error(err.status, err.message);
    // 400 — bad request (invalid params, already withdrawn, invalid proof)
    // 401 — missing or invalid API key
    // 404 — resource not found
    // 500 — server error
  }
}
```

## Contracts on Base Mainnet

| Contract       | Address |
|----------------|---------|
| Pool Factory   | `0xA00877e56F8058D8831DFb0D3466F557AAC4815a` |
| ZK Verifier    | `0x85e435DbFdb2316511673Ea41Be999d0C716Ff31` |
| Pool 0.001 ETH | `0xddbD55543CbE833318333e0D179404C963a15cBe` |
| Pool 0.005 ETH | `0x4e636A224f0c570baB8eE29941A985B60dF7F877` |
| Pool 0.01 ETH  | `0x3Ab95E3Fe0196A1Ff85a4AFB7A00Bbf1Bd45FEA2` |
| Pool 0.1 ETH   | `0x0cd067E8c8B5C6474652F31Da9215BcF85c7fE30` |
| Pool 1.0 ETH   | `0xDb99A1c6f6b4C8dADD16756068d8117191CeD0B6` |

All contracts are verified on [Basescan](https://basescan.org).

## Links

- [noctum.io](https://noctum.io) — Protocol home
- [noctum.io/developers](https://noctum.io/developers) — Get an API key
- [noctum.io/docs](https://noctum.io/docs) — Full documentation
- [@noctum_agent on X](https://x.com/noctum_agent) — Protocol agent
- [Farcaster](https://farcaster.xyz/noctum) — Official channel
- [github.com/noctum-privacy/sdk](https://github.com/noctum-privacy/sdk) — This repository

## License

MIT — see [LICENSE](LICENSE)
