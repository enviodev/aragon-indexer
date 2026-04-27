# Aragon Indexer

A multichain Aragon DAO Protocol indexer built with [Envio HyperIndex](https://docs.envio.dev). Tracks DAOs, plugin installations, proposals, votes, governance tokens, and voting-escrow locks across the Aragon OSx deployments on Ethereum, Polygon, ZKsync, Base, Arbitrum, and Sepolia.

## Chains

| Chain | ID |
|---|---|
| Ethereum Mainnet | 1 |
| Polygon | 137 |
| ZKsync | 324 |
| Base | 8453 |
| Sepolia | 11155111 |
| Arbitrum | 42161 |

## What it indexes

### Core registries
- `DAORegistry`: DAO registrations
- `PluginRepoRegistry`: plugin repository registrations
- `PluginSetupProcessor`: installation, update, and uninstallation lifecycle (`InstallationPrepared`/`InstallationApplied`, `UpdatePrepared`/`UpdateApplied`, `UninstallationPrepared`/`UninstallationApplied`)

### DAO contracts (factory-registered from `DAORegistered`)
- `DAO`: metadata, native token deposits, permission grants/revokes, executions

### Governance plugins
- `Multisig`: settings, members, proposals, approvals, executions
- `TokenVoting`: settings, proposals, votes, executions
- `StagedProposalProcessor`: staged proposal lifecycle, advancement, cancellation, results

### Governance tokens
- `GovernanceERC20`: delegation and vote-power changes

### VE governance (factory-registered via RPC discovery)
- `VotingEscrow`: deposits, withdrawals, delegation, min deposit
- `ExitQueue`, `LockManager`, `LockToVote`, `CapitalDistributor`, `ExecuteSelectorCondition`, `GaugeVoter`

## Schema

22 GraphQL entities including `Dao`, `PluginRepo`, `Plugin`, `PluginSetting`, `Proposal`, `Vote`, `Token`, `Lock`, `TokenDelegation`, `Gauge`, `Campaign`.

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
