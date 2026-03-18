/**
 * Extract IPFS CID from metadata bytes.
 * Aragon metadata is typically hex-encoded with a prefix indicating IPFS.
 */
export function extractIpfsCid(metadataBytes: string): string | undefined {
  if (!metadataBytes || metadataBytes === "0x") return undefined;

  try {
    // Remove 0x prefix if present
    const hex = metadataBytes.startsWith("0x")
      ? metadataBytes.slice(2)
      : metadataBytes;

    // Decode hex to UTF-8
    const decoded = Buffer.from(hex, "hex").toString("utf8");

    // Check if it starts with ipfs:// prefix
    if (decoded.startsWith("ipfs://")) {
      return decoded.slice(7);
    }

    // Check if it's a raw CID (starts with Qm or bafy)
    if (decoded.startsWith("Qm") || decoded.startsWith("bafy")) {
      return decoded;
    }

    return decoded || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Build full IPFS gateway URL from CID.
 */
export function ipfsUrl(cid: string): string {
  return `https://ipfs.io/ipfs/${cid}`;
}
