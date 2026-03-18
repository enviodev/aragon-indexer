import { PluginSetupProcessor } from "generated";
import { getPluginTypeFromRepo } from "../utils/pluginRepos";
import { discoverVeContracts, discoverLockManagerAddress } from "../utils/veDiscovery";

// =============================================
// Contract Registration — register plugin addresses for dynamic indexing
// Must be defined BEFORE handlers.
// Only ONE contract type can be registered per address — the last call wins.
// We use the pluginSetupRepo address to detect the correct type.
// =============================================

PluginSetupProcessor.InstallationPrepared.contractRegister(
  async ({ event, context }) => {
    const pluginAddress = event.params.plugin;
    const repoAddress = event.params.pluginSetupRepo;
    const pluginType = getPluginTypeFromRepo(repoAddress);
    const helpers = event.params.preparedSetupData[0]; // address[] helpers

    // Extract token address from helpers for tokenVoting plugins
    const getTokenFromHelpers = (): `0x${string}` | undefined => {
      if (helpers.length === 1 && helpers[0]) return helpers[0];
      if (helpers.length >= 2 && helpers[helpers.length - 1]) return helpers[helpers.length - 1]!;
      return undefined;
    };

    switch (pluginType) {
      case "multisig":
        context.addMultisig(pluginAddress);
        break;
      case "tokenVoting": {
        context.addTokenVoting(pluginAddress);
        // Register the GovernanceERC20 token for delegation events.
        // Token is a DIFFERENT address from the plugin, so no overwrite.
        // OSx v1.0/v1.3: helpers = [token] (length 1, token at index 0)
        // New token-voting-plugin: helpers = [VotingPowerCondition, token] (length 2, token at index 1)
        //
        // EDGE CASE: For pre-existing ERC20Votes tokens used directly (not newly
        // deployed), we only capture delegation events from InstallationPrepared block
        // onward — historical events before DAO creation are missed. This is a
        // HyperIndex limitation (no "go back in time" for dynamic contracts).
        // For newly deployed tokens (majority of cases), same-block coverage
        // ensures we capture everything from block zero of the token's existence.
        const tokenAddress = getTokenFromHelpers();
        if (tokenAddress) {
          context.addGovernanceERC20(tokenAddress);
          // Discover VE governance contracts (escrow, exitQueue) from token
          try {
            const ve = await discoverVeContracts(tokenAddress, event.chainId);
            if (ve) {
              context.addVotingEscrow(ve.escrowAddress as `0x${string}`);
              if (ve.exitQueueAddress) context.addExitQueue(ve.exitQueueAddress as `0x${string}`);
            }
          } catch { /* VE discovery is best-effort */ }
        }
        break;
      }
      case "spp":
        context.addStagedProposalProcessor(pluginAddress);
        break;
      case "admin":
        // Admin plugin doesn't emit proposal/vote events we track yet
        break;
      case "addresslistVoting":
        // Uses same events as TokenVoting (VotingSettingsUpdated, ProposalCreated, etc.)
        context.addTokenVoting(pluginAddress);
        break;
      case "lockToVote": {
        // LockToVote has same proposal/vote events as TokenVoting
        context.addLockToVote(pluginAddress);
        // Discover LockManager contract via RPC
        try {
          const lockManagerAddr = await discoverLockManagerAddress(pluginAddress, event.chainId);
          if (lockManagerAddr) context.addLockManager(lockManagerAddr as `0x${string}`);
        } catch { /* best-effort */ }
        // Also register token and VE contracts from helpers
        const ltToken = getTokenFromHelpers();
        if (ltToken) {
          context.addGovernanceERC20(ltToken);
          try {
            const ve = await discoverVeContracts(ltToken, event.chainId);
            if (ve) {
              context.addVotingEscrow(ve.escrowAddress as `0x${string}`);
              if (ve.exitQueueAddress) context.addExitQueue(ve.exitQueueAddress as `0x${string}`);
            }
          } catch { /* best-effort */ }
        }
        break;
      }
      default:
        // Unknown plugin repo — register for Multisig as fallback
        context.addMultisig(pluginAddress);
        break;
    }
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

    // Detect plugin type from repo address
    const pluginType = getPluginTypeFromRepo(event.params.pluginSetupRepo);
    const interfaceType = pluginType ?? "unknown";

    // Extract token address from helpers for TokenVoting plugins
    const helpers = event.params.preparedSetupData[0];
    let tokenAddress: string | undefined;
    if (interfaceType === "tokenVoting") {
      if (helpers.length === 1) {
        tokenAddress = helpers[0];
      } else if (helpers.length >= 2) {
        tokenAddress = helpers[helpers.length - 1];
      }
    }

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
        interfaceType,
        status: "preInstall",
        isSupported: false,
        blockNumber: event.block.number,
        blockTimestamp: event.block.timestamp,
        transactionHash: event.transaction.hash,
        pluginSetupRepo: event.params.pluginSetupRepo,
        release: Number(event.params.versionTag[0]),
        build: Number(event.params.versionTag[1]),
        subdomain: undefined,
        tokenAddress,
        votingEscrow: undefined,
        conditionAddress: undefined,
        lockManagerAddress: undefined,
        permissions: undefined,
        subPlugins: undefined,
      });

      // Create Token entity if we have a token address
      if (tokenAddress) {
        const tokenId = `${chainId}-${tokenAddress}`;
        const existingToken = await context.Token.get(tokenId);
        if (!existingToken) {
          context.Token.set({
            id: tokenId,
            chainId,
            address: tokenAddress,
            name: undefined,
            symbol: undefined,
            decimals: undefined,
          });
        }
      }
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
