import { PluginSetupProcessor } from "generated";

// =============================================
// Contract Registration — register plugin addresses for dynamic indexing
// Must be defined BEFORE handlers
// =============================================

PluginSetupProcessor.InstallationPrepared.contractRegister(
  async ({ event, context }) => {
    const pluginAddress = event.params.plugin;
    // Register plugin address for all dynamic contract types
    // HyperIndex will only index events matching the contract's ABI
    context.addMultisig(pluginAddress);
    context.addTokenVoting(pluginAddress);
    context.addStagedProposalProcessor(pluginAddress);
    context.addGovernanceERC20(pluginAddress);
  }
);

// =============================================
// Handlers
// =============================================

PluginSetupProcessor.InstallationPrepared.handler(
  async ({ event, context }) => {
    const chainId = event.chainId;
    const id = `${chainId}-${event.transaction.hash}-${event.logIndex}`;

    const daoAddress = event.params.dao;
    const pluginAddress = event.params.plugin;

    // Check DAO exists
    const daoId = `${chainId}-${daoAddress}`;
    const dao = await context.Dao.get(daoId);
    if (!dao) return;

    // Create setup log
    context.PluginSetupLog.set({
      id,
      chainId,
      event: "InstallationPrepared",
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
      logIndex: event.logIndex,
      daoAddress,
      pluginAddress,
      preparedSetupId: event.params.preparedSetupId,
      appliedSetupId: undefined,
      pluginSetupRepo: event.params.pluginSetupRepo,
      sender: event.params.sender,
      release: Number(event.params.versionTag[0]),
      build: Number(event.params.versionTag[1]),
      permissions: undefined,
    });

    // Create plugin in preInstall status
    const pluginId = `${chainId}-${pluginAddress}`;
    const existingPlugin = await context.Plugin.get(pluginId);
    if (!existingPlugin) {
      context.Plugin.set({
        id: pluginId,
        chainId,
        address: pluginAddress,
        dao_id: daoId,
        daoAddress,
        interfaceType: "unknown",
        status: "preInstall",
        isSupported: false,
        blockNumber: event.block.number,
        blockTimestamp: event.block.timestamp,
        transactionHash: event.transaction.hash,
        pluginSetupRepo: event.params.pluginSetupRepo,
        release: Number(event.params.versionTag[0]),
        build: Number(event.params.versionTag[1]),
        subdomain: undefined,
        tokenAddress: undefined,
        votingEscrow: undefined,
        conditionAddress: undefined,
        lockManagerAddress: undefined,
        permissions: undefined,
        subPlugins: undefined,
      });
    }
  }
);

PluginSetupProcessor.InstallationApplied.handler(
  async ({ event, context }) => {
    const chainId = event.chainId;
    const id = `${chainId}-${event.transaction.hash}-${event.logIndex}`;

    const daoAddress = event.params.dao;
    const pluginAddress = event.params.plugin;

    // Check DAO exists
    const daoId = `${chainId}-${daoAddress}`;
    const dao = await context.Dao.get(daoId);
    if (!dao) return;

    // Create setup log
    context.PluginSetupLog.set({
      id,
      chainId,
      event: "InstallationApplied",
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
      logIndex: event.logIndex,
      daoAddress,
      pluginAddress,
      preparedSetupId: event.params.preparedSetupId,
      appliedSetupId: event.params.appliedSetupId,
      pluginSetupRepo: undefined,
      sender: undefined,
      release: undefined,
      build: undefined,
      permissions: undefined,
    });

    // Update plugin status to installed
    const pluginId = `${chainId}-${pluginAddress}`;
    const plugin = await context.Plugin.get(pluginId);
    if (plugin) {
      context.Plugin.set({
        ...plugin,
        status: "installed",
      });
    }
  }
);

PluginSetupProcessor.UpdatePrepared.handler(async ({ event, context }) => {
  const chainId = event.chainId;
  const id = `${chainId}-${event.transaction.hash}-${event.logIndex}`;

  context.PluginSetupLog.set({
    id,
    chainId,
    event: "UpdatePrepared",
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
    logIndex: event.logIndex,
    daoAddress: event.params.dao,
    pluginAddress: event.params.setupPayload[0],
    preparedSetupId: event.params.preparedSetupId,
    appliedSetupId: undefined,
    pluginSetupRepo: event.params.pluginSetupRepo,
    sender: event.params.sender,
    release: Number(event.params.versionTag[0]),
    build: Number(event.params.versionTag[1]),
    permissions: undefined,
  });
});

PluginSetupProcessor.UpdateApplied.handler(async ({ event, context }) => {
  const chainId = event.chainId;
  const id = `${chainId}-${event.transaction.hash}-${event.logIndex}`;

  const pluginAddress = event.params.plugin;

  context.PluginSetupLog.set({
    id,
    chainId,
    event: "UpdateApplied",
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
    logIndex: event.logIndex,
    daoAddress: event.params.dao,
    pluginAddress,
    preparedSetupId: event.params.preparedSetupId,
    appliedSetupId: event.params.appliedSetupId,
    pluginSetupRepo: undefined,
    sender: undefined,
    release: undefined,
    build: undefined,
    permissions: undefined,
  });

  // Update plugin status
  const pluginId = `${chainId}-${pluginAddress}`;
  const plugin = await context.Plugin.get(pluginId);
  if (plugin) {
    context.Plugin.set({
      ...plugin,
      status: "updated",
    });
  }
});

PluginSetupProcessor.UninstallationPrepared.handler(
  async ({ event, context }) => {
    const chainId = event.chainId;
    const id = `${chainId}-${event.transaction.hash}-${event.logIndex}`;

    context.PluginSetupLog.set({
      id,
      chainId,
      event: "UninstallationPrepared",
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
      logIndex: event.logIndex,
      daoAddress: event.params.dao,
      pluginAddress: event.params.setupPayload[0],
      preparedSetupId: event.params.preparedSetupId,
      appliedSetupId: undefined,
      pluginSetupRepo: event.params.pluginSetupRepo,
      sender: event.params.sender,
      release: Number(event.params.versionTag[0]),
      build: Number(event.params.versionTag[1]),
      permissions: undefined,
    });
  }
);

PluginSetupProcessor.UninstallationApplied.handler(
  async ({ event, context }) => {
    const chainId = event.chainId;
    const id = `${chainId}-${event.transaction.hash}-${event.logIndex}`;

    const pluginAddress = event.params.plugin;

    context.PluginSetupLog.set({
      id,
      chainId,
      event: "UninstallationApplied",
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
      logIndex: event.logIndex,
      daoAddress: event.params.dao,
      pluginAddress,
      preparedSetupId: event.params.preparedSetupId,
      appliedSetupId: undefined,
      pluginSetupRepo: undefined,
      sender: undefined,
      release: undefined,
      build: undefined,
      permissions: undefined,
    });

    // Update plugin status to uninstalled
    const pluginId = `${chainId}-${pluginAddress}`;
    const plugin = await context.Plugin.get(pluginId);
    if (plugin) {
      context.Plugin.set({
        ...plugin,
        status: "uninstalled",
      });
    }
  }
);
