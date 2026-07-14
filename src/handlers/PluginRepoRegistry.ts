import { indexer } from "envio";

indexer.onEvent(
  { contract: "PluginRepoRegistry", event: "PluginRepoRegistered" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const id = `${chainId}-${event.params.pluginRepo}`;

  const existing = await context.PluginRepo.get(id);
  if (existing) return;

  context.PluginRepo.set({
    id,
    chainId,
    address: event.params.pluginRepo,
    subdomain: event.params.subdomain,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
}
);
