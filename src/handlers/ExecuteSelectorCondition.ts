import { indexer } from "envio";

indexer.onEvent(
  { contract: "ExecuteSelectorCondition", event: "SelectorAllowed" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const conditionAddress = event.srcAddress;
  const selector = event.params.selector;
  const whereAddress = event.params.where;
  const id = `${chainId}-${conditionAddress}-${selector}-${whereAddress}`;

  context.SelectorPermission.set({
    id,
    chainId,
    conditionAddress,
    selector,
    whereAddress,
    allowed: true,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
}
);

indexer.onEvent(
  { contract: "ExecuteSelectorCondition", event: "SelectorDisallowed" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const conditionAddress = event.srcAddress;
  const selector = event.params.selector;
  const whereAddress = event.params.where;
  const id = `${chainId}-${conditionAddress}-${selector}-${whereAddress}`;

  const existing = await context.SelectorPermission.get(id);
  if (existing) {
    context.SelectorPermission.set({ ...existing, allowed: false });
  }
}
);

indexer.onEvent(
  { contract: "ExecuteSelectorCondition", event: "NativeTransfersAllowed" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const conditionAddress = event.srcAddress;
  const whereAddress = event.params.where;
  const id = `${chainId}-${conditionAddress}-native-${whereAddress}`;

  context.NativeTransferPermission.set({
    id,
    chainId,
    conditionAddress,
    whereAddress,
    allowed: true,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
}
);

indexer.onEvent(
  { contract: "ExecuteSelectorCondition", event: "NativeTransfersDisallowed" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const conditionAddress = event.srcAddress;
  const whereAddress = event.params.where;
  const id = `${chainId}-${conditionAddress}-native-${whereAddress}`;

  const existing = await context.NativeTransferPermission.get(id);
  if (existing) {
    context.NativeTransferPermission.set({ ...existing, allowed: false });
  }
}
);
