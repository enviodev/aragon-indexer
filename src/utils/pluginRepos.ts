/**
 * Maps known PluginRepo addresses to plugin interface types.
 * These are the RepoProxy addresses from Aragon's contract deployments.
 * All addresses are lowercased for case-insensitive matching.
 */

type PluginType =
  | "multisig"
  | "tokenVoting"
  | "admin"
  | "addresslistVoting"
  | "spp"
  | "lockToVote"
  | "gauge"
  | "capitalDistributor";

const PLUGIN_REPO_MAP: Record<string, PluginType> = {};

function addRepo(address: string, type: PluginType) {
  PLUGIN_REPO_MAP[address.toLowerCase()] = type;
}

// --- Multisig ---
addRepo("0x8c278e37D0817210E18A7958524b7D0a1fAA6F7b", "multisig"); // Ethereum v1.0.0 + v1.3.0
addRepo("0x9e7956C8758470dE159481e5DD0d08F8B59217A2", "multisig"); // Sepolia
addRepo("0x5A5035E7E8aeff220540F383a9cf8c35929bcF31", "multisig"); // Polygon
addRepo("0x7553E6Fb020c5740768cF289e603770AA09b7aE2", "multisig"); // Arbitrum
addRepo("0xcDC4b0BC63AEfFf3a7826A19D101406C6322A585", "multisig"); // Base
addRepo("0x83f88d380073c8F929fAB649F3d016649c101D3A", "multisig"); // zkSync

// --- TokenVoting ---
addRepo("0xb7401cD221ceAFC54093168B814Cc3d42579287f", "tokenVoting"); // Ethereum v1.0.0 + v1.3.0
addRepo("0x424F4cA6FA9c24C03f2396DF0E96057eD11CF7dF", "tokenVoting"); // Sepolia
addRepo("0xae67aea0B830ed4504B36670B5Fa70c5C386Bb58", "tokenVoting"); // Polygon
addRepo("0x1AeD2BEb470aeFD65B43f905Bd5371b1E4749d18", "tokenVoting"); // Arbitrum
addRepo("0x2532570DcFb749A7F976136CC05648ef2a0f60b0", "tokenVoting"); // Base
addRepo("0xE8F4C59f83CeE31A867E61c9959533A6e95ebCB3", "tokenVoting"); // zkSync

// --- Admin ---
addRepo("0xA4371a239D08bfBA6E8894eccf8466C6323A52C3", "admin"); // Ethereum
addRepo("0x152c9E28995E418870b85cbbc0AEE4e53020edb2", "admin"); // Sepolia
addRepo("0x7fF570473d0876db16A59e8F04EE7F17Ab117309", "admin"); // Polygon
addRepo("0x326A2aee6A8eE78D79E7E956DE60C6E452f76a8e", "admin"); // Arbitrum
addRepo("0x212eF339C77B3390599caB4D46222D79fAabcb5c", "admin"); // Base

// --- AddresslistVoting ---
addRepo("0xC207767d8A7a28019AFFAEAe6698F84B5526EbD7", "addresslistVoting"); // Ethereum
addRepo("0xdfA1fBeC1Cad92597101A4f4A18e1340c5eA55C1", "addresslistVoting"); // Sepolia
addRepo("0x641DdEdc2139d9948e8dcC936C1Ab2314D9181E6", "addresslistVoting"); // Polygon
addRepo("0xf415FF95166EF5D365fFB3bc6d1701f9e9ed7Df7", "addresslistVoting"); // Arbitrum
addRepo("0x0A5387021B2722E983842fA701D0BaD8B9279fE2", "addresslistVoting"); // Base
addRepo("0x5BC82E4473e01f57716FC7f1361d424B54968e17", "addresslistVoting"); // zkSync

// --- StagedProposalProcessor ---
addRepo("0xE67b8E026d190876704292442A38163Ce6945d6b", "spp"); // Ethereum
addRepo("0x421FF506E4DC17356965565688D62b55Bf2bf0a5", "spp"); // Ethereum (alt)
addRepo("0xda62D32C14E8CA78958d6fdC0142A575b0cd6Ad4", "spp"); // Sepolia
addRepo("0x9C61D4266815bdd32f4D2885B6CF5763F449050B", "spp"); // Sepolia (alt)
addRepo("0xc36fE143bd829a80df458Bd9ab52299Df985DC6F", "spp"); // Polygon
addRepo("0xe3B00403Cd8cBee7af01961c25220289a4Cc5753", "spp"); // Arbitrum
addRepo("0x3C13098D4e2FE9aCb2fCEb3EE4fBBe33405eD39D", "spp"); // Base
addRepo("0xE294451cB4B7aA4a8136dA6474b8b4C6C5a69973", "spp"); // zkSync

// --- LockToVote ---
addRepo("0x0f4FBD2951Db08B45dE16e7519699159aE1b4bb7", "lockToVote"); // Ethereum
addRepo("0x4E9c4d138f5E3B5D28b3F0e66749899738AEf8a2", "lockToVote"); // Ethereum (lock-to-vote)
addRepo("0x70927fA8b84777c79A9b9CC011BfbE08B04eB1e4", "lockToVote"); // Ethereum (lock-to-vote-plugin)
addRepo("0x499f7c3E8778D07BbBdc434dF06a985e54d7ed35", "lockToVote"); // Sepolia
addRepo("0x0D0ce1B8569d400b98556967545A29615b66Cd0C", "lockToVote"); // Sepolia (lock-to-vote)
addRepo("0x326D2b4cC92281D6fF757D79af98bE255BA45cE1", "lockToVote"); // Polygon
addRepo("0xd883239CdA10a48484D0a7EEc8fD0A80e182fFA4", "lockToVote"); // Polygon (lock-to-vote)
addRepo("0xe92eF55cCbB3ac48f54f2FcDC4c49379CB01C57F", "lockToVote"); // Arbitrum
addRepo("0xe119b829A80F1dfb4EBfe778D57f3F90F3dcbDAc", "lockToVote"); // Arbitrum (lock-to-vote)
addRepo("0x05ECA5ab78493Bf812052B0211a206BCBA03471B", "lockToVote"); // Base
addRepo("0x9Bb1234b8e163412977C25E6aA7893eFbC3c884F", "lockToVote"); // Base (lock-to-vote)
addRepo("0xd0f0Bc285F4D27417ECd8C027BB6746690ba72b2", "lockToVote"); // zkSync

// --- Gauge Voter ---
addRepo("0x5F97Ee2E3441FAB942034881e2b833C6FE4F282e", "gauge"); // Base (peaq)
addRepo("0x7BEf4dFCAB5a1B8C9A02CD032ddD4629b767D34c", "gauge"); // Base (peaq-simple)
addRepo("0x570C25470827e35C698F5de2a1eb0B3987dFc908", "gauge"); // Base (ynd)

// --- Capital Distributor ---
addRepo("0x09563BB7D619B4cdd7416e5178eaa9b0486845eE", "capitalDistributor"); // Ethereum
addRepo("0x9dd3f94E33b748b09081378d7Fd4dFfF4970b290", "capitalDistributor"); // Ethereum (cryptex)

/**
 * Detect plugin type from pluginSetupRepo address.
 * Returns undefined for unknown repos (3rd party plugins).
 */
export function getPluginTypeFromRepo(
  repoAddress: string
): PluginType | undefined {
  return PLUGIN_REPO_MAP[repoAddress.toLowerCase()];
}
