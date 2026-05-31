"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  NoctumClient: () => NoctumClient,
  NoctumError: () => NoctumError,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var NoctumError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "NoctumError";
  }
};
var NoctumClient = class {
  baseUrl;
  apiKey;
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl ?? "https://noctum.io/api").replace(/\/$/, "");
    this.apiKey = options.apiKey;
  }
  async request(method, path, body) {
    const headers = { "Content-Type": "application/json" };
    if (this.apiKey) headers["X-API-Key"] = this.apiKey;
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      ...body !== void 0 ? { body: JSON.stringify(body) } : {}
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ error: res.statusText }));
      throw new NoctumError(res.status, payload.error ?? res.statusText);
    }
    return res.json();
  }
  // ------------------------------------------------------------------ pool
  pool = {
    /**
     * Get live pool statistics pulled from Base mainnet contracts. Public endpoint.
     */
    getStats: () => this.request("GET", "/pool/stats"),
    /**
     * List all available pool denominations with contract addresses. Public endpoint.
     */
    getDenominations: () => this.request("GET", "/pool/denominations"),
    /**
     * Record a deposit after the on-chain transaction is confirmed. Requires API key.
     */
    deposit: (data) => this.request("POST", "/pool/deposit", data),
    /**
     * Submit a withdrawal via the relayer. The relayer pays gas — recipient needs no ETH.
     * Requires API key.
     */
    withdraw: (data) => this.request("POST", "/pool/withdraw", data),
    /**
     * List pool transactions for a wallet address. Requires API key.
     */
    getTransactions: (wallet) => this.request("GET", `/pool/transactions?wallet=${encodeURIComponent(wallet)}`)
  };
  // ------------------------------------------------------------------ proofs
  proofs = {
    /**
     * Generate a ZK identity proof from an EIP-191 wallet signature. Requires API key.
     */
    generate: (data) => this.request("POST", "/proofs", data),
    /**
     * Fetch a proof by commitment hash. Public endpoint.
     */
    get: (proofId) => this.request("GET", `/proofs/${encodeURIComponent(proofId)}`),
    /**
     * Verify any proof — returns valid/invalid without revealing the wallet address.
     * Public endpoint.
     */
    verify: (proofId) => this.request("GET", `/proofs/verify/${encodeURIComponent(proofId)}`),
    /**
     * Revoke a proof immediately. Requires API key.
     */
    revoke: (proofId, data) => this.request("POST", `/proofs/${encodeURIComponent(proofId)}/revoke`, data)
  };
  // ------------------------------------------------------------------ security
  security = {
    /**
     * Run an on-chain risk scan for any Base wallet. Checks ETH balance, USDC balance,
     * transaction count, contract code, and active ERC20 approvals. Public endpoint.
     */
    scan: (address) => this.request("GET", `/security/scan/${encodeURIComponent(address)}`),
    /**
     * Get active ERC20 approvals for any address. Public endpoint.
     */
    getApprovals: (address) => this.request("GET", `/security/approvals/${encodeURIComponent(address)}`),
    /**
     * List watched wallets for a wallet account. Requires API key.
     */
    getWallets: (wallet) => this.request("GET", `/security/wallets?wallet=${encodeURIComponent(wallet)}`),
    /**
     * Get security alerts for watched wallets. Requires API key.
     */
    getAlerts: (wallet) => this.request("GET", `/security/alerts?wallet=${encodeURIComponent(wallet)}`)
  };
  // ------------------------------------------------------------------ stats
  stats = {
    /**
     * Get protocol-wide statistics. Public endpoint.
     */
    getOverview: () => this.request("GET", "/stats/overview"),
    /**
     * Get recent protocol activity feed. Public endpoint.
     */
    getActivity: () => this.request("GET", "/stats/activity")
  };
  // ------------------------------------------------------------------ developer
  developer = {
    /**
     * List API keys for a wallet. Requires API key.
     */
    listKeys: (wallet) => this.request("GET", `/developer/keys?wallet=${encodeURIComponent(wallet)}`),
    /**
     * Create a new API key. The full key is returned once — store it immediately.
     * Requires API key.
     */
    createKey: (data) => this.request("POST", "/developer/keys", data),
    /**
     * Permanently revoke an API key. Requires API key.
     */
    revokeKey: (keyId) => this.request("DELETE", `/developer/keys/${encodeURIComponent(keyId)}`),
    /**
     * Get API usage statistics. Requires API key.
     */
    getUsage: (wallet) => this.request("GET", `/developer/usage?wallet=${encodeURIComponent(wallet)}`),
    /**
     * List registered webhooks. Requires API key.
     */
    listWebhooks: (wallet) => this.request("GET", `/developer/webhooks?wallet=${encodeURIComponent(wallet)}`),
    /**
     * Register a webhook for protocol events. Requires API key.
     * Events: deposit.confirmed, withdrawal.confirmed, proof.generated, proof.revoked, security.alert
     */
    createWebhook: (data) => this.request("POST", "/developer/webhooks", data),
    /**
     * Delete a registered webhook. Requires API key.
     */
    deleteWebhook: (webhookId) => this.request("DELETE", `/developer/webhooks/${encodeURIComponent(webhookId)}`)
  };
};
var index_default = NoctumClient;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NoctumClient,
  NoctumError
});
