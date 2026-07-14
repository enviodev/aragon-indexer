import { indexer } from "envio";

// Register DAO address for dynamic event tracking
indexer.contractRegister(
  { contract: "DAORegistry", event: "DAORegistered" },
  async ({ event, context }) => {
  context.chain.DAO.add(event.params.dao);
}
);

indexer.onEvent(
  { contract: "DAORegistry", event: "DAORegistered" },
  async ({ event, context }) => {
  const chainId = event.chainId;
  const daoAddress = event.params.dao;
  const id = `${chainId}-${daoAddress}`;

  const existing = await context.Dao.get(id);
  if (existing) return;

  context.Dao.set({
    id,
    chainId,
    address: daoAddress,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    creatorAddress: event.params.creator,
    subdomain: event.params.subdomain || undefined,
    implementationAddress: undefined,
    ens: undefined,
    version: undefined,
    metadataUri: undefined,
    name: undefined,
    description: undefined,
    avatar: undefined,
    links: undefined,
    proposalCount: 0,
    proposalsExecuted: 0,
    uniqueVoters: 0,
    voteCount: 0,
    memberCount: 0,
  });
}
);
