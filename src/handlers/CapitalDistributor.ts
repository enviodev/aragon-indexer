import { indexer } from "envio";

indexer.onEvent(
  { contract: "CapitalDistributor", event: "CampaignCreated" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const pluginAddress = event.srcAddress;
  const campaignId = event.params.campaignId.toString();
  const id = `${chainId}-${pluginAddress}-${campaignId}`;

  context.Campaign.set({
    id,
    chainId,
    pluginAddress,
    campaignId,
    metadataUri: event.params.metadataUri || undefined,
    token: event.params.token || undefined,
    startTime: event.params.startTime,
    endTime: event.params.endTime,
    merkleRoot: undefined,
    isPaused: false,
    isEnded: false,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
}
);

indexer.onEvent(
  { contract: "CapitalDistributor", event: "MerkleCampaignSet" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const pluginAddress = event.srcAddress;
  const campaignId = event.params.campaignId.toString();
  const id = `${chainId}-${pluginAddress}-${campaignId}`;

  const campaign = await context.Campaign.get(id);
  if (campaign) {
    context.Campaign.set({
      ...campaign,
      merkleRoot: event.params.merkleRoot,
    });
  }
}
);

indexer.onEvent(
  { contract: "CapitalDistributor", event: "MerkleCampaignUpdated" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const pluginAddress = event.srcAddress;
  const campaignId = event.params.campaignId.toString();
  const id = `${chainId}-${pluginAddress}-${campaignId}`;

  const campaign = await context.Campaign.get(id);
  if (campaign) {
    context.Campaign.set({
      ...campaign,
      merkleRoot: event.params.newMerkleRoot,
    });
  }
}
);

indexer.onEvent(
  { contract: "CapitalDistributor", event: "CampaignPaused" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const pluginAddress = event.srcAddress;
  const campaignId = event.params.campaignId.toString();
  const id = `${chainId}-${pluginAddress}-${campaignId}`;

  const campaign = await context.Campaign.get(id);
  if (campaign) {
    context.Campaign.set({ ...campaign, isPaused: true });
  }
}
);

indexer.onEvent(
  { contract: "CapitalDistributor", event: "CampaignResumed" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const pluginAddress = event.srcAddress;
  const campaignId = event.params.campaignId.toString();
  const id = `${chainId}-${pluginAddress}-${campaignId}`;

  const campaign = await context.Campaign.get(id);
  if (campaign) {
    context.Campaign.set({ ...campaign, isPaused: false });
  }
}
);

indexer.onEvent(
  { contract: "CapitalDistributor", event: "CampaignEnded" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const pluginAddress = event.srcAddress;
  const campaignId = event.params.campaignId.toString();
  const id = `${chainId}-${pluginAddress}-${campaignId}`;

  const campaign = await context.Campaign.get(id);
  if (campaign) {
    context.Campaign.set({ ...campaign, isEnded: true });
  }
}
);
