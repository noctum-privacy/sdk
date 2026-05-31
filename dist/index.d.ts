declare class NoctumError extends Error {
    status: number;
    constructor(status: number, message: string);
}
interface PoolDenomination {
    id: string;
    token: string;
    amount: string;
    fee: string;
    contractAddress: string | null;
    denominationWei: string | null;
}
interface PoolStats {
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
interface PoolTransaction {
    id: string;
    type: "DEPOSIT" | "WITHDRAWAL";
    poolId: string;
    walletAddress: string;
    txHash: string | null;
    status: string;
    timestamp: string;
}
interface ZkProof {
    id: string;
    walletAddress: string;
    proofHash: string;
    publicSignal: string;
    isActive: boolean;
    createdAt: string;
}
interface ProofVerification {
    valid: boolean;
    walletAddress?: string;
    createdAt?: string;
}
interface SecurityScan {
    address: string;
    riskScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    findings: Array<{
        type: string;
        severity: string;
        description: string;
    }>;
    ethBalance: string;
    usdcBalance: string;
    nonce: number;
    isContract: boolean;
}
interface Approval {
    token: string;
    spender: string;
    amount: string;
    blockNumber: number;
    transactionHash: string;
}
interface StatsOverview {
    totalDeposits: number;
    totalWithdrawals: number;
    totalProofs: number;
    tvlEth: string;
    uniqueUsers: number;
}
interface ActivityItem {
    type: string;
    description: string;
    timestamp: string;
    txHash?: string;
}
interface ApiKey {
    id: string;
    name: string;
    keyPrefix: string;
    callCount: number;
    createdAt: string;
    lastUsed: string | null;
}
interface Webhook {
    id: string;
    url: string;
    walletAddress: string;
    events: string[];
    isActive: boolean;
    createdAt: string;
}
interface ApiUsage {
    walletAddress: string;
    totalCalls: number;
    todayCalls: number;
    monthlyCalls: number;
    topEndpoints: Array<{
        endpoint: string;
        calls: number;
    }>;
}
interface NoctumClientOptions {
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
declare class NoctumClient {
    private readonly baseUrl;
    private readonly apiKey?;
    constructor(options?: NoctumClientOptions);
    private request;
    pool: {
        /**
         * Get live pool statistics pulled from Base mainnet contracts. Public endpoint.
         */
        getStats: () => Promise<PoolStats>;
        /**
         * List all available pool denominations with contract addresses. Public endpoint.
         */
        getDenominations: () => Promise<PoolDenomination[]>;
        /**
         * Record a deposit after the on-chain transaction is confirmed. Requires API key.
         */
        deposit: (data: {
            commitment: string;
            denomination: string;
            walletAddress: string;
            txHash: string;
        }) => Promise<PoolTransaction>;
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
        }) => Promise<{
            txHash: string;
            status: string;
        }>;
        /**
         * List pool transactions for a wallet address. Requires API key.
         */
        getTransactions: (wallet: string) => Promise<PoolTransaction[]>;
    };
    proofs: {
        /**
         * Generate a ZK identity proof from an EIP-191 wallet signature. Requires API key.
         */
        generate: (data: {
            walletAddress: string;
            signature: string;
            message: string;
        }) => Promise<ZkProof>;
        /**
         * Fetch a proof by commitment hash. Public endpoint.
         */
        get: (proofId: string) => Promise<ZkProof>;
        /**
         * Verify any proof — returns valid/invalid without revealing the wallet address.
         * Public endpoint.
         */
        verify: (proofId: string) => Promise<ProofVerification>;
        /**
         * Revoke a proof immediately. Requires API key.
         */
        revoke: (proofId: string, data: {
            walletAddress: string;
        }) => Promise<void>;
    };
    security: {
        /**
         * Run an on-chain risk scan for any Base wallet. Checks ETH balance, USDC balance,
         * transaction count, contract code, and active ERC20 approvals. Public endpoint.
         */
        scan: (address: string) => Promise<SecurityScan>;
        /**
         * Get active ERC20 approvals for any address. Public endpoint.
         */
        getApprovals: (address: string) => Promise<Approval[]>;
        /**
         * List watched wallets for a wallet account. Requires API key.
         */
        getWallets: (wallet: string) => Promise<Array<{
            address: string;
            label: string;
        }>>;
        /**
         * Get security alerts for watched wallets. Requires API key.
         */
        getAlerts: (wallet: string) => Promise<Array<{
            id: string;
            type: string;
            severity: string;
            message: string;
            createdAt: string;
        }>>;
    };
    stats: {
        /**
         * Get protocol-wide statistics. Public endpoint.
         */
        getOverview: () => Promise<StatsOverview>;
        /**
         * Get recent protocol activity feed. Public endpoint.
         */
        getActivity: () => Promise<ActivityItem[]>;
    };
    developer: {
        /**
         * List API keys for a wallet. Requires API key.
         */
        listKeys: (wallet: string) => Promise<ApiKey[]>;
        /**
         * Create a new API key. The full key is returned once — store it immediately.
         * Requires API key.
         */
        createKey: (data: {
            walletAddress: string;
            name: string;
        }) => Promise<ApiKey & {
            fullKey: string;
        }>;
        /**
         * Permanently revoke an API key. Requires API key.
         */
        revokeKey: (keyId: string) => Promise<void>;
        /**
         * Get API usage statistics. Requires API key.
         */
        getUsage: (wallet: string) => Promise<ApiUsage>;
        /**
         * List registered webhooks. Requires API key.
         */
        listWebhooks: (wallet: string) => Promise<Webhook[]>;
        /**
         * Register a webhook for protocol events. Requires API key.
         * Events: deposit.confirmed, withdrawal.confirmed, proof.generated, proof.revoked, security.alert
         */
        createWebhook: (data: {
            walletAddress: string;
            url: string;
            events: string[];
        }) => Promise<Webhook>;
        /**
         * Delete a registered webhook. Requires API key.
         */
        deleteWebhook: (webhookId: string) => Promise<void>;
    };
}

export { type ActivityItem, type ApiKey, type ApiUsage, type Approval, NoctumClient, type NoctumClientOptions, NoctumError, type PoolDenomination, type PoolStats, type PoolTransaction, type ProofVerification, type SecurityScan, type StatsOverview, type Webhook, type ZkProof, NoctumClient as default };
