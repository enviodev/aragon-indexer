import { indexer } from "envio";

indexer.onEvent(
  { contract: "ExitQueue", event: "ExitQueued" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const tokenId = event.params.tokenId.toString();

  // Find the lock by looking up across all escrow addresses for this tokenId
  // The ExitQueue contract is linked to a VotingEscrow, but we don't know which one
  // from the event alone. Use a composite key with the exitQueue address.
  const locks = await context.Lock.getWhere({ tokenId: { _eq: tokenId } });
  const lock = locks.find((l) => l.chainId === chainId);
  if (lock) {
    context.Lock.set({
      ...lock,
      exitQueued: true,
      exitQueuedAt: event.block.timestamp,
      exitCancelled: false,
    });
  }
}
);

indexer.onEvent(
  { contract: "ExitQueue", event: "ExitQueuedV2" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const tokenId = event.params.tokenId.toString();

  const locks = await context.Lock.getWhere({ tokenId: { _eq: tokenId } });
  const lock = locks.find((l) => l.chainId === chainId);
  if (lock) {
    context.Lock.set({
      ...lock,
      exitQueued: true,
      exitQueuedAt: event.block.timestamp,
      exitCancelled: false,
    });
  }
}
);

indexer.onEvent(
  { contract: "ExitQueue", event: "ExitCancelled" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const tokenId = event.params.tokenId.toString();

  const locks = await context.Lock.getWhere({ tokenId: { _eq: tokenId } });
  const lock = locks.find((l) => l.chainId === chainId);
  if (lock) {
    context.Lock.set({
      ...lock,
      exitQueued: false,
      exitCancelled: true,
    });
  }
}
);

indexer.onEvent(
  { contract: "ExitQueue", event: "MinLockSet" },
  async ({ event, context }) => {
  // Track minimum lock period changes — informational
}
);

indexer.onEvent(
  { contract: "ExitQueue", event: "ExitFeePercentAdjusted" },
  async ({ event, context }) => {
  // Track fee adjustments — informational
}
);
