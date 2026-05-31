export class NoctumError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "NoctumError";
  }
}

// ------------------------------------------------------------------ types

export interface PoolDenomination {
  id: string;
  token: string;
  amount: string;
  fee: string;
  contractAddress: string | null;
  denominationWei: string | null;
}

export interface PoolStats {
  totalDeposits: number;
  totalWithdrawals: number;
  tvlEth: string;
  pools: Array<{
    id: string;
    amount: string;
    contractAddress: string | null;
    depositCount: number;
    poolBalance: string;
    merkleRoot: string;
  }>;
}

export interface PoolTransaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  poolId: string;
  walletAddress: string;
  txHash: string | null;
  status: string;
  timestamp: string;
}

export interface ZkProof {
  id: string;
  walletAddress: string;
  proofHash: string;
  publicSignal: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProofVerification {
  valid: boolean;
  walletAddress?: string;
  createdAt?: string;
}

export interface SecurityScan {
  address: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  findings: Array<{ type: string; severity: string; description: string }>;
  ethBalance: string;
  usdcBalance: string;
  nonce: number;
  isContract: boolean;
}

export interface Approval {
  token: string;
  spender: string;
  amount: string;
  blockNumber: number;
  transactionHash: string;
}

export interface StatsOverview {
  totalDeposits: number;
  totalWithdrawals: number;
  totalProofs: number;
  tvlEth: string;
  uniqueUsers: number;
}

export interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
  txHash?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  callCount: number;
  createdAt: string;
  lastUsed: string | null;
}

export interface Webhook {
  id: string;
  url: string;
  walletAddress: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export interface ApiUsage {
  walletAddress: string;
  totalCalls: number;
  todayCalls: number;
  monthlyCalls: number;
  topEndpoints: Array<{ endpoint: string; calls: number }>;
}

// ------------------------------------------------------------------ client

export interface NoctumClientOptions {
  /**
   * Base URL for the Noctum API. Defaults to "https://noctum.io/api".
   */
  baseUrl?: string;
  /**
   * API key for authenticated endpoints. Create one at noctum.io/developers.
   * Public endpoints (pool stats, proof verification, security scan) work without a key.
   */
  apiKey?: string;
}

export class NoctumClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(options: NoctumClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "https://noctum.io/api").replace(/\/$/, "");
    this.apiKey = options.apiKey;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers["X-API-Key"] = this.apiKey;
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
      throw new NoctumError(res.status, payload.error ?? res.statusText);
    }
    return res.json() as Promise<T>;
  }

  // ------------------------------------------------------------------ pool

  pool = {
    /**
     * Get live pool statistics pulled from Base mainnet contracts. Public endpoint.
     */
    getStats: (): Promise<PoolStats> =>
      this.request("GET", "/pool/stats"),

    /**
     * List all available pool denominations with contract addresses. Public endpoint.
     */
    getDenominations: (): Promise<PoolDenomination[]> =>
      this.request("GET", "/pool/denominations"),

    /**
     * Record a deposit after the on-chain transaction is confirmed. Requires API key.
     */
    deposit: (data: {
      commitment: string;
      denomination: string;
      walletAddress: string;
      txHash: string;
    }): Promise<PoolTransaction> =>
      this.request("POST", "/pool/deposit", data),

    /**
     * Submit a withdrawal via the relayer. The relayer pays gas — recipient needs no ETH.
     * Requires API key.
     */
    withdraw: (data: {
      secret: string;
      nullifier: string;
      recipient: string;
      denomination: string;
      walletAddress?: string;
    }): Promise<{ txHash: string; status: string }> =>
      this.request("POST", "/pool/withdraw", data),

    /**
     * List pool transactions for a wallet address. Requires API key.
     */
    getTransactions: (wallet: string): Promise<PoolTransaction[]> =>
      this.request("GET", `/pool/transactions?wallet=${encodeURIComponent(wallet)}`),
  };

  // ------------------------------------------------------------------ proofs

  proofs = {
    /**
     * Generate a ZK identity proof from an EIP-191 wallet signature. Requires API key.
     */
    generate: (data: {
      walletAddress: string;
      signature: string;
      message: string;
    }): Promise<ZkProof> =>
      this.request("POST", "/proofs", data),

    /**
     * Fetch a proof by commitment hash. Public endpoint.
     */
    get: (proofId: string): Promise<ZkProof> =>
      this.request("GET", `/proofs/${encodeURIComponent(proofId)}`),

    /**
     * Verify any proof — returns valid/invalid without revealing the wallet address.
     * Public endpoint.
     */
    verify: (proofId: string): Promise<ProofVerification> =>
      this.request("GET", `/proofs/verify/${encodeURIComponent(proofId)}`),

    /**
     * Revoke a proof immediately. Requires API key.
     */
    revoke: (proofId: string, data: { walletAddress: string }): Promise<void> =>
      this.request("POST", `/proofs/${encodeURIComponent(proofId)}/revoke`, data),
  };

  // ------------------------------------------------------------------ security

  security = {
    /**
     * Run an on-chain risk scan for any Base wallet. Checks ETH balance, USDC balance,
     * transaction count, contract code, and active ERC20 approvals. Public endpoint.
     */
    scan: (address: string): Promise<SecurityScan> =>
      this.request("GET", `/security/scan/${encodeURIComponent(address)}`),

    /**
     * Get active ERC20 approvals for any address. Public endpoint.
     */
    getApprovals: (address: string): Promise<Approval[]> =>
      this.request("GET", `/security/approvals/${encodeURIComponent(address)}`),

    /**
     * List watched wallets for a wallet account. Requires API key.
     */
    getWallets: (wallet: string): Promise<Array<{ address: string; label: string }>> =>
      this.request("GET", `/security/wallets?wallet=${encodeURIComponent(wallet)}`),

    /**
     * Get security alerts for watched wallets. Requires API key.
     */
    getAlerts: (wallet: string): Promise<Array<{
      id: string;
      type: string;
      severity: string;
      message: string;
      createdAt: string;
    }>> =>
      this.request("GET", `/security/alerts?wallet=${encodeURIComponent(wallet)}`),
  };

  // ------------------------------------------------------------------ stats

  stats = {
    /**
     * Get protocol-wide statistics. Public endpoint.
     */
    getOverview: (): Promise<StatsOverview> =>
      this.request("GET", "/stats/overview"),

    /**
     * Get recent protocol activity feed. Public endpoint.
     */
    getActivity: (): Promise<ActivityItem[]> =>
      this.request("GET", "/stats/activity"),
  };

  // ------------------------------------------------------------------ developer

  developer = {
    /**
     * List API keys for a wallet. Requires API key.
     */
    listKeys: (wallet: string): Promise<ApiKey[]> =>
      this.request("GET", `/developer/keys?wallet=${encodeURIComponent(wallet)}`),

    /**
     * Create a new API key. The full key is returned once — store it immediately.
     * Requires API key.
     */
    createKey: (data: {
      walletAddress: string;
      name: string;
    }): Promise<ApiKey & { fullKey: string }> =>
      this.request("POST", "/developer/keys", data),

    /**
     * Permanently revoke an API key. Requires API key.
     */
    revokeKey: (keyId: string): Promise<void> =>
      this.request("DELETE", `/developer/keys/${encodeURIComponent(keyId)}`),

    /**
     * Get API usage statistics. Requires API key.
     */
    getUsage: (wallet: string): Promise<ApiUsage> =>
      this.request("GET", `/developer/usage?wallet=${encodeURIComponent(wallet)}`),

    /**
     * List registered webhooks. Requires API key.
     */
    listWebhooks: (wallet: string): Promise<Webhook[]> =>
      this.request("GET", `/developer/webhooks?wallet=${encodeURIComponent(wallet)}`),

    /**
     * Register a webhook for protocol events. Requires API key.
     * Events: deposit.confirmed, withdrawal.confirmed, proof.generated, proof.revoked, security.alert
     */
    createWebhook: (data: {
      walletAddress: string;
      url: string;
      events: string[];
    }): Promise<Webhook> =>
      this.request("POST", "/developer/webhooks", data),

    /**
     * Delete a registered webhook. Requires API key.
     */
    deleteWebhook: (webhookId: string): Promise<void> =>
      this.request("DELETE", `/developer/webhooks/${encodeURIComponent(webhookId)}`),
  };
}

export default NoctumClient;
