import { createEffect, S } from "envio";
import { createPublicClient, http, parseAbi } from "viem";
import {
  mainnet,
  polygon,
  arbitrum,
  base,
  sepolia,
  zkSync,
} from "viem/chains";

const CHAIN_CONFIGS: Record<number, { chain: any; rpcUrl: string }> = {
  1: { chain: mainnet, rpcUrl: process.env.RPC_URL_1 || "https://ethereum-rpc.publicnode.com" },
  137: { chain: polygon, rpcUrl: process.env.RPC_URL_137 || "https://polygon-bor-rpc.publicnode.com" },
  42161: { chain: arbitrum, rpcUrl: process.env.RPC_URL_42161 || "https://arbitrum-one-rpc.publicnode.com" },
  8453: { chain: base, rpcUrl: process.env.RPC_URL_8453 || "https://base-rpc.publicnode.com" },
  11155111: { chain: sepolia, rpcUrl: process.env.RPC_URL_11155111 || "https://ethereum-sepolia-rpc.publicnode.com" },
  324: { chain: zkSync, rpcUrl: process.env.RPC_URL_324 || "https://mainnet.era.zksync.io" },
};

function getClient(chainId: number) {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) throw new Error(`No RPC config for chain ${chainId}`);
  return createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
  });
}

// VE Governance discovery: token → escrow → exitQueue, lockManager, etc.

const escrowAbi = parseAbi(["function escrow() view returns (address)"]);
const queueAbi = parseAbi(["function queue() view returns (address)"]);
const lockNFTAbi = parseAbi(["function lockNFT() view returns (address)"]);
const tokenAbi = parseAbi(["function token() view returns (address)"]);
const lockManagerAbi = parseAbi(["function lockManager() view returns (address)"]);

/**
 * Discover VotingEscrow addresses from a token's adapter contract.
 * Chain: tokenAddress.escrow() → escrowAddress.queue() → exitQueueAddress
 */
export const discoverVotingEscrow = createEffect(
  {
    name: "discoverVotingEscrow",
    input: S.schema({ tokenAddress: S.string, chainId: S.number }),
    output: S.union([
      S.schema({
        escrowAddress: S.string,
        exitQueueAddress: S.optional(S.string),
        nftLockAddress: S.optional(S.string),
        underlyingToken: S.optional(S.string),
      }),
      null,
    ]),
    cache: true,
    rateLimit: false,
  },
  async ({ input }) => {
    try {
      const client = getClient(input.chainId);
      const addr = input.tokenAddress as `0x${string}`;

      // Try to get escrow address from token adapter
      let escrowAddress: string;
      try {
        escrowAddress = await client.readContract({
          address: addr,
          abi: escrowAbi,
          functionName: "escrow",
        });
      } catch {
        return null; // Not a VE token
      }

      // Get sub-contracts from escrow
      const [exitQueueAddress, nftLockAddress, underlyingToken] =
        await Promise.allSettled([
          client.readContract({ address: escrowAddress as `0x${string}`, abi: queueAbi, functionName: "queue" }),
          client.readContract({ address: escrowAddress as `0x${string}`, abi: lockNFTAbi, functionName: "lockNFT" }),
          client.readContract({ address: escrowAddress as `0x${string}`, abi: tokenAbi, functionName: "token" }),
        ]);

      return {
        escrowAddress,
        exitQueueAddress: exitQueueAddress.status === "fulfilled" ? exitQueueAddress.value : undefined,
        nftLockAddress: nftLockAddress.status === "fulfilled" ? nftLockAddress.value : undefined,
        underlyingToken: underlyingToken.status === "fulfilled" ? underlyingToken.value : undefined,
      };
    } catch {
      return null;
    }
  }
);

/**
 * Discover LockManager address from a LockToVote plugin.
 */
export const discoverLockManager = createEffect(
  {
    name: "discoverLockManager",
    input: S.schema({ pluginAddress: S.string, chainId: S.number }),
    output: S.union([S.string, null]),
    cache: true,
    rateLimit: false,
  },
  async ({ input }) => {
    try {
      const client = getClient(input.chainId);
      return await client.readContract({
        address: input.pluginAddress as `0x${string}`,
        abi: lockManagerAbi,
        functionName: "lockManager",
      });
    } catch {
      return null;
    }
  }
);
