import { StagedProposalProcessor } from "generated";
import { extractIpfsCid } from "../utils/metadata";
import { fetchProposalMetadata, fetchDaoMetadata } from "../effects/ipfs";
import { trackPluginActivity } from "../utils/metrics";

StagedProposalProcessor.ProposalResultReported.handler(
  async ({ event, context }) => {
    // Log proposal result reports from sub-bodies
    // Can be used for tracking multi-stage proposal progression
  }
);

StagedProposalProcessor.ProposalCanceled.handler(
  async ({ event, context }) => {
    const chainId = event.chainId;
    const pluginAddress = event.srcAddress;
    const proposalIndex = event.params.proposalId.toString();
    const proposalId = `${chainId}-${pluginAddress}-${proposalIndex}`;

    const proposal = await context.Proposal.get(proposalId);
    if (!proposal) return;

    context.Proposal.set({
      ...proposal,
      status: "Canceled",
    });
  }
);

StagedProposalProcessor.ProposalEdited.handler(
  async ({ event, context }) => {
    const chainId = event.chainId;
    const pluginAddress = event.srcAddress;
    const proposalIndex = event.params.proposalId.toString();
    const proposalId = `${chainId}-${pluginAddress}-${proposalIndex}`;

    const proposal = await context.Proposal.get(proposalId);
    if (!proposal) return;

    const cid = extractIpfsCid(event.params.metadata);
    const metadata = cid
      ? await context.effect(fetchProposalMetadata, cid)
      : null;

    context.Proposal.set({
      ...proposal,
      metadataUri: cid ? `ipfs://${cid}` : proposal.metadataUri,
      title: metadata?.title ?? proposal.title,
      summary: metadata?.summary ?? proposal.summary,
      description: metadata?.description ?? proposal.description,
      resources: metadata?.resourcesJson ? JSON.parse(metadata.resourcesJson) : proposal.resources,
    });
  }
);

StagedProposalProcessor.ProposalAdvanced.handler(
  async ({ event, context }) => {
    // Proposal advanced to next stage — no status change needed
    // Stage progression tracked via the event itself
  }
);

StagedProposalProcessor.SPPProposalCreated.handler(
  async ({ event, context }) => {
    const chainId = event.chainId;
    const pluginAddress = event.srcAddress;
    const pluginId = `${chainId}-${pluginAddress}`;
    const proposalIndex = event.params.proposalId.toString();

    const plugin = await context.Plugin.get(pluginId);
    if (!plugin) return;

    // Update plugin type if unknown
    if (plugin.interfaceType === "unknown") {
      context.Plugin.set({ ...plugin, interfaceType: "spp", isSupported: true });
    }

    const cid = extractIpfsCid(event.params.metadata);
    const metadata = cid
      ? await context.effect(fetchProposalMetadata, cid)
      : null;

    const proposalId = `${chainId}-${pluginAddress}-${proposalIndex}`;
    context.Proposal.set({
      id: proposalId,
      chainId,
      dao_id: plugin.dao_id,
      plugin_id: pluginId,
      daoAddress: plugin.daoAddress,
      pluginAddress,
      proposalIndex,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
      creatorAddress: event.params.creator,
      metadataUri: cid ? `ipfs://${cid}` : undefined,
      title: metadata?.title,
      summary: metadata?.summary,
      description: metadata?.description,
      resources: metadata?.resourcesJson ? JSON.parse(metadata.resourcesJson) : undefined,
      rawActions: undefined,
      status: "Active",
      startDate: event.params.startDate,
      endDate: event.params.endDate,
      executed: false,
      executedAt: undefined,
      executedTxHash: undefined,
      voteCount: 0,
    });

    // Update DAO proposal count
    const dao = await context.Dao.get(plugin.dao_id);
    if (dao) {
      context.Dao.set({ ...dao, proposalCount: dao.proposalCount + 1 });
    }
    await trackPluginActivity(context as any, { chainId, pluginId: pluginId, pluginAddress, memberAddress: event.params.creator, daoAddress: plugin.daoAddress, blockNumber: event.block.number, type: "proposal" });
  }
);

StagedProposalProcessor.SPPProposalExecuted.handler(
  async ({ event, context }) => {
    const chainId = event.chainId;
    const pluginAddress = event.srcAddress;
    const proposalIndex = event.params.proposalId.toString();
    const proposalId = `${chainId}-${pluginAddress}-${proposalIndex}`;

    const proposal = await context.Proposal.get(proposalId);
    if (!proposal) return;

    context.Proposal.set({
      ...proposal,
      status: "Executed",
      executed: true,
      executedAt: event.block.timestamp,
      executedTxHash: event.transaction.hash,
    });

    const dao = await context.Dao.get(proposal.dao_id);
    if (dao) {
      context.Dao.set({ ...dao, proposalsExecuted: dao.proposalsExecuted + 1 });
    }
  }
);

StagedProposalProcessor.SPPMetadataSet.handler(
  async ({ event, context }) => {
    const chainId = event.chainId;
    const pluginAddress = event.srcAddress;
    const pluginId = `${chainId}-${pluginAddress}`;

    const plugin = await context.Plugin.get(pluginId);
    if (!plugin) return;

    const cid = extractIpfsCid(event.params.metadata);
    if (!cid) return;

    const metadata = await context.effect(fetchDaoMetadata, cid);

    // SPP MetadataSet updates the plugin's own metadata (not the DAO's)
    // Store as plugin subdomain/name for now
    if (metadata?.name) {
      context.Plugin.set({
        ...plugin,
        subdomain: metadata.name,
      });
    }
  }
);
