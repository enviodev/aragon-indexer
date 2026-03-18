import { Multisig } from "generated";
import { extractIpfsCid } from "../utils/metadata";
import { fetchProposalMetadata } from "../effects/ipfs";

Multisig.MultisigSettingsUpdated.handler(async ({ event, context }) => {
  const chainId = event.chainId;
  const pluginAddress = event.srcAddress;
  const pluginId = `${chainId}-${pluginAddress}`;

  const plugin = await context.Plugin.get(pluginId);
  if (!plugin) return;

  // Update plugin interface type if still unknown
  if (plugin.interfaceType === "unknown") {
    context.Plugin.set({ ...plugin, interfaceType: "multisig", isSupported: true });
  }

  const settingId = `${chainId}-${pluginAddress}-${event.transaction.hash}`;
  context.PluginSetting.set({
    id: settingId,
    chainId,
    plugin_id: pluginId,
    pluginAddress,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    onlyListed: event.params.onlyListed,
    minApprovals: Number(event.params.minApprovals),
    votingMode: undefined,
    supportThreshold: undefined,
    minParticipation: undefined,
    minDuration: undefined,
    minProposerVotingPower: undefined,
    stages: undefined,
    policy: undefined,
  });
});

Multisig.MembersAdded.handler(async ({ event, context }) => {
  const chainId = event.chainId;
  const pluginAddress = event.srcAddress;
  const pluginId = `${chainId}-${pluginAddress}`;

  const plugin = await context.Plugin.get(pluginId);
  if (!plugin) return;

  for (const member of event.params.members) {
    const memberId = `${chainId}-${pluginAddress}-${member}`;
    context.PluginMember.set({
      id: memberId,
      chainId,
      plugin_id: pluginId,
      pluginAddress,
      memberAddress: member,
      daoAddress: plugin.daoAddress,
    });
  }

  // Update DAO member count
  const dao = await context.Dao.get(plugin.dao_id);
  if (dao) {
    context.Dao.set({
      ...dao,
      memberCount: dao.memberCount + event.params.members.length,
    });
  }
});

Multisig.MembersRemoved.handler(async ({ event, context }) => {
  const chainId = event.chainId;
  const pluginAddress = event.srcAddress;
  const pluginId = `${chainId}-${pluginAddress}`;

  const plugin = await context.Plugin.get(pluginId);
  if (!plugin) return;

  for (const member of event.params.members) {
    const memberId = `${chainId}-${pluginAddress}-${member}`;
    context.PluginMember.deleteUnsafe(memberId);
  }

  // Update DAO member count
  const dao = await context.Dao.get(plugin.dao_id);
  if (dao) {
    context.Dao.set({
      ...dao,
      memberCount: Math.max(0, dao.memberCount - event.params.members.length),
    });
  }
});

Multisig.MultisigProposalCreated.handler(async ({ event, context }) => {
  const chainId = event.chainId;
  const pluginAddress = event.srcAddress;
  const pluginId = `${chainId}-${pluginAddress}`;
  const proposalIndex = event.params.proposalId.toString();

  const plugin = await context.Plugin.get(pluginId);
  if (!plugin) return;

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
});

Multisig.MultisigProposalExecuted.handler(async ({ event, context }) => {
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
});

Multisig.Approved.handler(async ({ event, context }) => {
  const chainId = event.chainId;
  const pluginAddress = event.srcAddress;
  const pluginId = `${chainId}-${pluginAddress}`;
  const proposalIndex = event.params.proposalId.toString();
  const proposalId = `${chainId}-${pluginAddress}-${proposalIndex}`;

  const plugin = await context.Plugin.get(pluginId);
  if (!plugin) return;

  const voteId = `${chainId}-${pluginAddress}-${proposalIndex}-${event.params.approver}`;
  context.Vote.set({
    id: voteId,
    chainId,
    plugin_id: pluginId,
    proposal_id: proposalId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    daoAddress: plugin.daoAddress,
    pluginAddress,
    proposalIndex,
    memberAddress: event.params.approver,
    voteOption: 2, // Approved = Yes
    votingPower: undefined,
  });

  // Update vote count
  const proposal = await context.Proposal.get(proposalId);
  if (proposal) {
    context.Proposal.set({ ...proposal, voteCount: proposal.voteCount + 1 });
  }
});
