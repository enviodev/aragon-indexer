# Aragon Legacy Indexer → HyperIndex Migration Status

## Overview

Migration from the legacy multi-service monolith (RabbitMQ + MongoDB + custom block crawler, 8+ microservices) to Envio HyperIndex (single indexer, PostgreSQL, GraphQL API, HyperSync).

**Status: ~85% complete — core governance data is production-ready.**

---

## Event Coverage: 55/73 (75%)

### Indexed Events

| Phase | Contract | Events | Status |
|-------|----------|--------|--------|
| 1 | DAORegistry | DAORegistered | Done |
| 1 | PluginRepoRegistry | PluginRepoRegistered | Done |
| 1 | PluginSetupProcessor | InstallationPrepared, InstallationApplied, UpdatePrepared, UpdateApplied, UninstallationPrepared, UninstallationApplied | Done |
| 1 | DAO | MetadataSet, NativeTokenDeposited, Granted, Revoked, Executed | Done |
| 2 | Multisig | MultisigSettingsUpdated, MembersAdded, MembersRemoved, ProposalCreated, ProposalExecuted, Approved | Done |
| 2 | TokenVoting | VotingSettingsUpdated, ProposalCreated, ProposalExecuted, VoteCast | Done |
| 2 | StagedProposalProcessor | ProposalResultReported, ProposalCanceled, ProposalEdited, ProposalAdvanced, ProposalCreated, ProposalExecuted, MetadataSet | Done |
| 2 | GovernanceERC20 | DelegateChanged, DelegateVotesChanged | Done |
| 3 | VotingEscrow | Deposit, Withdraw, MinDepositSet, TokensDelegated, TokensUndelegated | Done |
| 3 | ExitQueue | ExitQueued, ExitQueuedV2, ExitCancelled, MinLockSet, ExitFeePercentAdjusted | Done |
| 3 | LockManager | BalanceLocked, BalanceUnlocked | Done |
| 3 | LockToVote | VoteCast, VoteCleared, ProposalCreated, ProposalExecuted, VotingSettingsUpdated | Done |
| 4 | GaugeVoter | GaugeCreated, GaugeActivated, GaugeDeactivated, GaugeMetadataUpdated, Voted, Reset | Done |
| 4 | CapitalDistributor | CampaignCreated, CampaignPaused, CampaignResumed, CampaignEnded, MerkleCampaignSet, MerkleCampaignUpdated | Done |
| 4 | ExecuteSelectorCondition | SelectorAllowed, SelectorDisallowed, NativeTransfersAllowed, NativeTransfersDisallowed | Done |

### Missing Events (18)

**VE Governance (2) — easy to add:**
- `Split` — VE token split into two NFTs
- `Merged` — two VE tokens merged into one

**Capital Router Policy (5) — medium effort:**
- `SourceSettingsUpdated`, `PluginDefined`, `ModelSettingsUpdated`, `RouterSettingsUpdated`, `ClaimerSettingsUpdated`
- Fire from dynamically deployed policy contracts. Need contract registration from router/claimer plugins.

**SPP (1) — easy to add:**
- `StagesUpdated` — complex tuple signature, was removed during implementation. Can re-add.

**Capital Distributor (1) — easy to add:**
- `PayoutClaimed` — individual claim tracking.

**Factory Deployments (9) — deferred:**
- `DrainBalanceSourceDeployed`, `RequiredBalanceSourceDeployed`, `StreamBalanceSourceDeployed`, `FixedBalanceSourceDeployed`, `RatioModelDeployed`, `EqualRatioModelDeployed`, `BracketsModelDeployed`, `AddressGaugeRatioModelDeployed`, `TokenGaugeRatioModelDeployed`
- Factory contract addresses are unknown. Would need wildcard indexing. All have identical `(address newContract)` signature. Very niche — the deployed contracts are already tracked when they emit their own events via plugin registration.

---

## Entity Coverage

### Migrated (20 entities)

| HyperIndex Entity | Legacy Model | Notes |
|---|---|---|
| Dao | dao | With IPFS metadata (name, description, avatar, links) |
| Plugin | plugin | With interfaceType detection (repo mapping + bytecode fallback) |
| PluginRepo | pluginRepo | |
| Proposal | proposal | With IPFS metadata (title, summary, description, resources) |
| Vote | vote | With votingPower for TokenVoting/LockToVote |
| DaoPermission | daoPermission | Granted/Revoked with permissionId, who, where, condition |
| PluginSetting | setting | Multisig, TokenVoting, LockToVote, SPP settings |
| PluginMember | pluginMember | MembersAdded/Removed for Multisig |
| Token | token | With RPC metadata: name, symbol, decimals (97% coverage) |
| TokenMember | tokenMember | Current voting power per delegate |
| Lock | lock | VE deposits with withdraw/exit queue tracking |
| TokenDelegation | tokenDelegation | VE token delegation |
| LockToVoteMember | lockToVoteMember | Locked balances per voter |
| Gauge | gauge | With status and IPFS metadata URI |
| GaugeVote | voteGauge | Per-gauge per-epoch voting power |
| Campaign | campaign | With merkle root, pause/end state |
| SelectorPermission | selectorPermission | Function selector allow/disallow |
| NativeTransferPermission | (part of selectorPermission) | Native transfer allow/disallow |
| PluginSetupLog | logPluginSetupProcessor | Full install/update/uninstall lifecycle |
| DelegateChangedEvent + DelegateVotesChangedEvent | logDelegateChanged | Delegation event log + current voting power |

### Not Migrated

| Legacy Model | Reason |
|---|---|
| **asset** | DAO treasury balances — requires periodic balance checks + pricing API. Should be a separate service. |
| **transaction** | DAO transaction history — partially covered by `Executed` event. Full tx decoding is a separate concern. |
| **metrics / pluginMetrics / gaugeMetrics** | Aggregate stats (TVL, unique voters, etc.) — computed by RabbitMQ workers in legacy. Simple counters (proposalCount, memberCount, voteCount) are inline. Complex aggregates should be materialized views or a separate service. |
| **member** | Global member entity with ENS/avatar — cross-chain, not per-DAO. Could be added but ENS resolution is Ethereum-only. |
| **contract** | Contract metadata (verified source, ABI) — operational, not core indexing. |
| **campaignReward / campaignMerkleRoot** | Individual claim tracking and merkle proofs — `PayoutClaimed` event not indexed yet. |
| **logPolicy** | Policy contract event logs — `SourceSettingsUpdated` etc. not indexed yet. |
| **pluginSlug** | Human-readable plugin URLs — application-layer concern, not indexing. |
| configIndexer, migration, jwt, taskRun, taskService, metadataRefetch, logMetadata | Infrastructure/operational — not applicable to HyperIndex. |

---

## Chain Support

| Chain | ID | Status |
|-------|-----|--------|
| Ethereum Mainnet | 1 | Active |
| Ethereum Sepolia | 11155111 | Active |
| Polygon Mainnet | 137 | Active |
| Arbitrum Mainnet | 42161 | Active |
| Base Mainnet | 8453 | Active |
| zkSync Era | 324 | Active |
| zkSync Sepolia | 300 | **Disabled** — no HyperSync support |

---

## Plugin Detection

Two-tier detection system:

1. **Repo address mapping** (`pluginRepos.ts`) — instant, no RPC. Covers all known Aragon plugin repos across all chains including Sepolia dev repos. ~200 addresses mapped.
2. **Bytecode fallback** (`bytecodeDetector.ts`) — fetches contract bytecode via `eth_getCode` and checks function selector hashes. Same approach as legacy `PluginDetector`. Covers any plugin regardless of repo.

Current classification: 16,945 classified / 1,028 unknown (genuinely 3rd party plugins).

---

## Known Limitations

1. **Pre-existing ERC20Votes tokens** — For DAOs using a pre-existing governance token (not deployed during DAO creation), delegation events before `InstallationPrepared` block are missed. HyperIndex only indexes dynamic contracts from registration block forward. Affects a small minority of DAOs — most deploy fresh tokens.

2. **DAO metadata coverage at 5%** — Many DAOs don't set IPFS metadata. This matches the legacy system. Not a bug.

3. **No REST API** — HyperIndex provides GraphQL only. Legacy had a custom REST API. A thin wrapper over GraphQL can be added if needed.

4. **No computed metrics** — TVL, pricing, aggregate stats were computed by RabbitMQ workers. The indexer stores raw event data + simple counters. Complex aggregates should be a separate service or materialized views on the PostgreSQL database.

5. **Factory contract addresses unknown** — 9 factory `*Deployed` events not indexed because factory addresses aren't in deployment configs. Would need wildcard indexing (high noise) or manual address discovery.

---

## Data Quality (latest full sync)

| Metric | Value |
|--------|-------|
| DAOs | 13,323 |
| Plugins | 17,973 (94% classified) |
| Proposals | 16,465 |
| Votes | 19,082 |
| DelegateVotesChanged events | 984,559 |
| Token members | 71,876 |
| Tokens | 6,565 (97% with name/symbol/decimals) |
| Permissions | 229,194 |
| Gauges | 73 |
| Gauge votes | 144 |
| Campaigns | 17 |
| VE Locks | 164 |
| LockToVote members | 53 |
| Selector permissions | 18 |

---

## Architecture

```
aragon-indexer/
  config.yaml                    # 15 contracts, ~55 events, 6 chains
  schema.graphql                 # 20 entity types, 4 enums
  src/
    handlers/                    # 15 handler files
      DAORegistry.ts             # + contractRegister (DAO)
      PluginSetupProcessor.ts    # + contractRegister (all plugin types + VE + LockManager)
      DAO.ts                     # + contractRegister (ExecuteSelectorCondition)
      PluginRepoRegistry.ts
      Multisig.ts
      TokenVoting.ts
      StagedProposalProcessor.ts
      GovernanceERC20.ts
      VotingEscrow.ts
      ExitQueue.ts
      LockManager.ts
      LockToVote.ts
      GaugeVoter.ts
      CapitalDistributor.ts
      ExecuteSelectorCondition.ts
    effects/
      ipfs.ts                    # IPFS metadata with dedicated gateway support
      rpc.ts                     # Token metadata, VE discovery effects
    utils/
      metadata.ts                # IPFS CID extraction from hex bytes
      pluginRepos.ts             # ~200 repo → type mappings
      bytecodeDetector.ts        # Fallback bytecode-based plugin detection
      veDiscovery.ts             # VE contract discovery via RPC
```

### Dynamic Contract Registration Flow

```
DAORegistered → register DAO address
InstallationPrepared → detect plugin type (repo mapping → bytecode fallback)
  → multisig: register Multisig
  → tokenVoting: register TokenVoting + GovernanceERC20 (from helpers)
                  + VotingEscrow + ExitQueue (via RPC discovery)
  → spp: register StagedProposalProcessor
  → lockToVote: register LockToVote + LockManager (via RPC)
                 + GovernanceERC20 + VotingEscrow + ExitQueue
  → gauge: register GaugeVoter
  → capitalDistributor: register CapitalDistributor
Granted (with condition) → register ExecuteSelectorCondition
```
