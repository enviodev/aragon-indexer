import { createPublicClient, http, parseAbi } from "viem";
import {
  mainnet,
  polygon,
  arbitrum,
  base,
  sepolia,
  zkSync,
} from "viem/chains";

/**
 * Direct RPC calls for VE contract discovery.
 * Used in contractRegister (which doesn't have access to context.effect()).
 */

const CHAINS: Record<number, { chain: any; rpcUrl: string }> = {
  1: { chain: mainnet, rpcUrl: process.env.ENVIO_RPC_URL_1 || "https://ethereum-rpc.publicnode.com" },
  137: { chain: polygon, rpcUrl: process.env.ENVIO_RPC_URL_137 || "https://polygon-bor-rpc.publicnode.com" },
  42161: { chain: arbitrum, rpcUrl: process.env.ENVIO_RPC_URL_42161 || "https://arbitrum-one-rpc.publicnode.com" },
  8453: { chain: base, rpcUrl: process.env.ENVIO_RPC_URL_8453 || "https://base-rpc.publicnode.com" },
  11155111: { chain: sepolia, rpcUrl: process.env.ENVIO_RPC_URL_11155111 || "https://ethereum-sepolia-rpc.publicnode.com" },
  324: { chain: zkSync, rpcUrl: process.env.ENVIO_RPC_URL_324 || "https://mainnet.era.zksync.io" },
};

const escrowAbi = parseAbi(["function escrow() view returns (address)"]);
const queueAbi = parseAbi(["function queue() view returns (address)"]);
const lockManagerAbi = parseAbi(["function lockManager() view returns (address)"]);

function getClient(chainId: number) {
  const config = CHAINS[chainId];
  if (!config) return null;
  return createPublicClient({ chain: config.chain, transport: http(config.rpcUrl) });
}

/**
 * Discover VotingEscrow and ExitQueue from a token adapter address.
 * tokenAddress.escrow() → escrowAddress
 * escrowAddress.queue() → exitQueueAddress
 */
export async function discoverVeContracts(
  tokenAddress: string,
  chainId: number
): Promise<{ escrowAddress: string; exitQueueAddress?: string } | null> {
  const client = getClient(chainId);
  if (!client) return null;

  try {
    const escrowAddress = await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: escrowAbi,
      functionName: "escrow",
    });
    if (!escrowAddress || escrowAddress === "0x0000000000000000000000000000000000000000") return null;

    let exitQueueAddress: string | undefined;
    try {
      exitQueueAddress = await client.readContract({
        address: escrowAddress as `0x${string}`,
        abi: queueAbi,
        functionName: "queue",
      });
    } catch { /* not all escrows have a queue */ }

    return { escrowAddress, exitQueueAddress };
  } catch {
    return null; // Not a VE token
  }
}

/**
 * Discover LockManager address from a LockToVote plugin.
 * pluginAddress.lockManager() → lockManagerAddress
 */
export async function discoverLockManagerAddress(
  pluginAddress: string,
  chainId: number
): Promise<string | null> {
  const client = getClient(chainId);
  if (!client) return null;

  try {
    return await client.readContract({
      address: pluginAddress as `0x${string}`,
      abi: lockManagerAbi,
      functionName: "lockManager",
    });
  } catch {
    return null;
  }
}
