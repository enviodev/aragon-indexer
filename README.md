# Aragon Indexer

Aragon DAO Protocol Indexer. Built with [Envio HyperIndex](https://docs.envio.dev).

## Chains

| Network | Chain ID |
|---|---|
| Ethereum Mainnet | 1 |
| Sepolia | 11155111 |
| Polygon | 137 |
| Arbitrum | 42161 |
| Base | 8453 |
| ZKsync | 324 |

## Contracts

- **`DAORegistry`**: `DAORegistered`
- **`PluginRepoRegistry`**: `PluginRepoRegistered`
- **`PluginSetupProcessor`**: `InstallationPrepared`, `InstallationApplied`, `UpdatePrepared`, `UpdateApplied`, `UninstallationPrepared`, `UninstallationApplied`
- **`DAO`**: `MetadataSet`, `NativeTokenDeposited`, `Granted`, `Revoked`, `Executed`
- **`Multisig`**: `MultisigSettingsUpdated`, `MembersAdded`, `MembersRemoved`, `MultisigProposalCreated`, `MultisigProposalExecuted`, `Approved`
- **`TokenVoting`**: `VotingSettingsUpdated`, `TokenVotingProposalCreated`, `TokenVotingProposalExecuted`, `VoteCast`
- **`StagedProposalProcessor`**: `ProposalResultReported`, `ProposalCanceled`, `ProposalEdited`, `ProposalAdvanced`, `SPPProposalCreated`, `SPPProposalExecuted`, `SPPMetadataSet`
- **`GovernanceERC20`**: `DelegateChanged`, `DelegateVotesChanged`
- **`VotingEscrow`**: `Deposit`, `Withdraw`, `MinDepositSet`, `TokensDelegated`, `TokensUndelegated`
- **`ExitQueue`**: `ExitQueued`, `ExitQueuedV2`, `ExitCancelled`, `MinLockSet`, `ExitFeePercentAdjusted`
- **`LockManager`**: `BalanceLocked`, `BalanceUnlocked`
- **`LockToVote`**: `LockToVoteVoteCast`, `VoteCleared`, `LockToVoteProposalCreated`, `LockToVoteProposalExecuted`, `LockToVoteSettingsUpdated`
- **`GaugeVoter`**: `GaugeCreated`, `GaugeActivated`, `GaugeDeactivated`, `GaugeMetadataUpdated`, `Voted`, `Reset`
- **`CapitalDistributor`**: `CampaignCreated`, `MerkleCampaignSet`, `MerkleCampaignUpdated`, `CampaignPaused`, `CampaignResumed`, `CampaignEnded`
- **`ExecuteSelectorCondition`**: `SelectorAllowed`, `SelectorDisallowed`, `NativeTransfersAllowed`, `NativeTransfersDisallowed`

## Schema entities (22)

`Dao`, `PluginRepo`, `Plugin`, `PluginSetupLog`, `DaoPermission`, `PluginSetting`, `Proposal`, `Vote`, `PluginMember`, `TokenMember`, `PluginActivityMetric`, `Token`, `DelegateChangedEvent`, `DelegateVotesChangedEvent`, `Lock`, `TokenDelegation`, `LockToVoteMember`, `Gauge`, `GaugeVote`, `Campaign`, `SelectorPermission`, `NativeTransferPermission`

## Run locally

```bash
pnpm install
pnpm dev
```

GraphQL playground at [http://localhost:8080](http://localhost:8080) (local password: `testing`).

## Generate from `config.yaml` or `schema.graphql`

```bash
pnpm codegen
```

## Pre-requisites

- [Node.js v22+ (v24 recommended)](https://nodejs.org/en/download/current)
- [pnpm](https://pnpm.io/installation)
- [Docker](https://www.docker.com/products/docker-desktop/) or [Podman](https://podman.io/)

## Resources

- [Envio docs](https://docs.envio.dev)
- [HyperIndex overview](https://docs.envio.dev/docs/HyperIndex/overview)
- [Discord](https://discord.gg/envio)
