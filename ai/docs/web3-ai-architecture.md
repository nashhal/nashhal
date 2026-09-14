# NOVEN Web3 + AI Architecture

## Executive conclusion

Web3 should not be used as the inference engine for NOVEN. The language model, retrieval, ranking and evaluation should remain off-chain. Web3 should become a **trust, identity, provenance and machine-to-machine payment layer** around the AI system.

The target architecture is:

```text
User
  |
  v
NOVEN Web App
  |
  +--> AI inference / RAG / tools ----------------------> Off-chain runtime
  |
  +--> Evidence bundle ---------------------------------> IPFS / object store
  |
  +--> Output receipt --> EIP-712 signature ------------> Wallet / identity
  |
  +--> Attestation -------------------------------------> EAS / L2
  |
  +--> Agent identity / reputation ---------------------> ERC-8004
  |
  +--> Paid external tools -----------------------------> x402
```

## 1. What Web3 should solve for NOVEN

### 1.1 Provenance

Every meaningful NOVEN run should be able to produce a deterministic receipt describing what generated the result:

- query hash
- answer hash
- model name and model-version hash
- retrieval corpus or dataset version hash
- source identifiers and source hashes
- tool versions
- prompt/policy version
- timestamp
- application version
- evaluator or verifier information

The full evidence bundle should stay off-chain. Only compact commitments, identifiers and attestations should be recorded on-chain.

### 1.2 User-controlled identity

Use Sign-In with Ethereum (SIWE) for optional wallet-based identity instead of treating a wallet merely as a button for signing. SIWE standardizes signed login messages with fields such as domain, URI, chain ID, nonce and session-related information, which is useful for preventing replay and phishing problems.

### 1.3 Structured verification receipts

Use EIP-712 typed structured data rather than an opaque `personal_sign` message for NOVEN verification. EIP-712 provides deterministic structured hashing and signing so wallets and applications can display meaningful fields before the user signs.

Suggested receipt type:

```text
NovenRun(
  bytes32 runId,
  bytes32 queryHash,
  bytes32 answerHash,
  bytes32 evidenceHash,
  bytes32 modelHash,
  bytes32 datasetHash,
  string appVersion,
  uint64 createdAt,
  uint256 chainId
)
```

The exact schema should be finalized before production because changing field semantics after signatures exist creates verification ambiguity.

### 1.4 Verifiable evidence bundles

Store the large off-chain evidence object as content-addressed data. IPFS CIDs are derived from cryptographic content identifiers; changing the content changes its identifier. This makes a CID useful as the stable reference for an evidence bundle without putting the entire bundle on-chain.

Example bundle:

```json
{
  "run": { "id": "...", "createdAt": "..." },
  "query": { "hash": "..." },
  "model": { "name": "Qwen...", "versionHash": "..." },
  "retrieval": {
    "datasetHash": "...",
    "documents": [
      { "id": "...", "url": "...", "contentHash": "..." }
    ]
  },
  "answer": { "textHash": "..." },
  "evaluation": { "grounding": 0.94 }
}
```

IPFS does not by itself guarantee permanent availability. Important CIDs must be pinned or otherwise retained by reliable storage infrastructure.

## 2. Ethereum Attestation Service should be the first on-chain trust primitive

Instead of building a custom registry immediately, NOVEN can use the Ethereum Attestation Service (EAS). EAS provides schemas and attestations and supports both on-chain and off-chain attestations.

A NOVEN attestation can state, for example:

```text
NovenAnswerAttestation(
  bytes32 answerHash,
  bytes32 evidenceHash,
  bytes32 modelHash,
  bytes32 datasetHash,
  bytes32 runId,
  string evidenceURI,
  bool grounded,
  uint64 createdAt
)
```

This gives NOVEN a standardized attestation layer and avoids maintaining a bespoke smart contract too early.

Recommended behavior:

```text
Run completed
   |
   +--> create local hashes
   |
   +--> create IPFS evidence bundle
   |
   +--> wallet signs EIP-712 receipt
   |
   +--> optional EAS attestation
   |
   +--> UI shows a verification page
```

## 3. NOVEN should use a Layer 2 for routine receipts

Do not put every AI response directly on Ethereum Mainnet. Routine attestations and receipts should use an EVM-compatible L2 where the economics and throughput are more suitable. Ethereum documentation describes rollups as executing transactions off L1 and posting data back to Ethereum for security, while L2 fees are generally lower due to batching and compression.

For the first production design, choose one L2 and standardize on it. Base, Arbitrum and OP Mainnet are reasonable ecosystems to evaluate, but the final choice should be made against actual current deployment support, tooling, wallet UX, data indexing and cost.

Sepolia remains appropriate for the prototype.

## 4. Replace the current raw transaction anchoring design

The current NOVEN Web3 implementation uses a zero-value transaction to the connected wallet with the NOVEN hash in transaction data. That can demonstrate that a hash can be published, but it is not the cleanest production trust primitive.

Production should prefer:

1. EIP-712 signed off-chain receipt for every run.
2. EAS attestation for runs that require public verifiability.
3. Optional L2 anchoring for high-value or selected runs.

This separates inexpensive user signatures from stronger public attestations and avoids treating a generic self-transfer as NOVEN's application-level protocol.

## 5. ERC-8004 is the long-term path if NOVEN becomes an autonomous agent

ERC-8004 is a draft Ethereum standard for trustless agents. It defines three registries:

- Identity Registry
- Reputation Registry
- Validation Registry

That matches a future NOVEN direction where NOVEN is not only a chat interface but an agent that calls tools, hires other agents/services or acts across organizational boundaries.

Example future identity:

```text
NOVEN Agent
  |
  +--> Identity registry entry
  +--> Agent metadata / capabilities
  +--> service endpoints
  +--> wallet
  +--> reputation signals
  +--> independent validation records
```

Do not make ERC-8004 a dependency for the first working AI model. Add it after the core answer quality and evidence pipeline are stable.

## 6. x402 can turn NOVEN into a machine-to-machine marketplace client

x402 is an HTTP-native payment standard that activates HTTP 402 Payment Required for programmatic payments. It is designed for API access, pay-per-use resources and AI agents that pay for services programmatically.

This is particularly relevant to NOVEN once it has tools such as:

```text
Search provider
Translation provider
OCR provider
Data API
Specialized model
Web scraping provider
Research database
```

NOVEN could eventually decide:

```text
Free local retrieval insufficient
        |
        v
Tool requires payment
        |
        v
HTTP 402
        |
        v
x402 payment
        |
        v
Tool response
        |
        v
NOVEN verifies + cites result
```

The important design rule is that payment should be per tool call and policy-controlled, never an uncontrolled capability of the model.

## 7. Web3 for model and dataset provenance

This is the most important connection between Web3 and the actual AI development process.

### Dataset versioning

Each training/RAG dataset release should have a manifest containing:

- dataset version
- source list
- license/usage status
- collection window
- normalization version
- deduplication version
- document count
- content hashes
- manifest hash
- storage URI

Then record the manifest hash in a signed release record or attestation.

### Model versioning

Each model release should have:

- model identifier
- base model
- adapter/QLoRA identifier
- training configuration hash
- dataset manifest hash
- evaluation report hash
- model artifact hash
- release commit SHA

The blockchain does not need the model weights. It only needs a compact commitment to the exact release metadata.

### Evaluation provenance

A benchmark run can produce:

```text
Model v0.3
Dataset v0.8
Benchmark v0.4
Evaluation hash
Grounding score
Factuality score
Arabic quality score
Latency
Cost
```

The evaluation report stays off-chain, while the report hash can be attested.

This creates a verifiable chain:

```text
Dataset release
      ↓
Training configuration
      ↓
Model release
      ↓
Benchmark
      ↓
Evaluation report
      ↓
Production answer
```

## 8. The ideal NOVEN verification page

The current Trust/Web3 concept should evolve into a real verification product, not merely a blockchain button.

A verification page should show:

```text
NOVEN RUN #8F42

Question
  [human-readable query]

Answer
  [answer text]

Model
  [model name + version]

Evidence
  6 sources
  4 independent publishers

Evidence bundle
  IPFS CID: bafy...

Integrity
  Query hash       0x...
  Answer hash      0x...
  Evidence hash    0x...
  Model hash       0x...

Attestation
  EAS UID          0x...

Wallet attestation
  Signed by        0x...

Network
  [chosen L2]

Status
  VERIFIED
```

This is much more valuable to NOVEN than a generic "blockchain used" badge.

## 9. Privacy rules

Never place sensitive prompts, private documents, access tokens, private user data or full model outputs on a public blockchain.

Use this pattern instead:

```text
Sensitive data
     ↓
Encrypted/off-chain storage
     ↓
Hash / commitment
     ↓
Blockchain or attestation
```

Blockchain records should be treated as public and durable unless the chosen system explicitly provides a different guarantee.

## 10. Zero-knowledge and TEE validation: later stage

Zero-knowledge ML and trusted execution environments can be used as stronger validation mechanisms, but they should not be the first implementation for NOVEN.

The sensible progression is:

```text
Stage 1   Hashes + EIP-712
Stage 2   IPFS evidence bundles
Stage 3   EAS attestations
Stage 4   L2 receipts
Stage 5   ERC-8004 agent identity/reputation
Stage 6   selective ZKML / TEE validation
```

Use stronger validation only where the value or risk of a claim justifies the computational overhead.

## 11. Recommended NOVEN Web3 roadmap

### Phase A — immediately

- Replace raw `personal_sign` verification with EIP-712 typed receipts.
- Create a canonical `NovenRun` schema.
- Hash query, answer, evidence and model metadata.
- Build a public verification page from the receipt.
- Keep all of this optional for users without wallets.

### Phase B — evidence

- Create a deterministic evidence-bundle JSON format.
- Store the bundle through IPFS.
- Display the CID in NOVEN.
- Add integrity verification by recomputing hashes.

### Phase C — public attestations

- Register one NOVEN EAS schema on the selected testnet.
- Issue attestations only when the user selects “Verify publicly”.
- Save the EAS UID beside the run record.

### Phase D — L2 production

- Select one L2.
- Batch or selectively anchor attestations.
- Add explorer links and monitoring.
- Keep routine answers off-chain.

### Phase E — autonomous NOVEN agent

- Evaluate ERC-8004.
- Register NOVEN as an agent.
- Publish capabilities and endpoints.
- Add reputation signals based on completed verified runs.
- Add validation records for benchmarked actions.

### Phase F — machine economy

- Add x402 for paid external tools.
- Give the agent a constrained spending policy.
- Require explicit approval or policy rules for every paid category.
- Record tool-call receipts and outcomes.

## 12. What NOT to do

Do not:

- run the language model on-chain
- store full articles on-chain
- store full prompts or private user data on-chain
- mint an NFT for every answer
- issue a token just to make the AI product look Web3-native
- make wallet connection mandatory for ordinary questions
- treat a blockchain transaction as proof that an answer is factually correct

A blockchain can prove that a particular commitment or attestation was recorded. It does not automatically prove the underlying answer was true.

## 13. Target architecture for the next NOVEN generation

```text
                         ┌──────────────────────┐
                         │      NOVEN UI        │
                         │ Ask / Research / Build│
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │    AI Orchestrator    │
                         │ model + RAG + tools   │
                         └─────┬──────┬──────┬──┘
                               │      │      │
                ┌──────────────┘      │      └──────────────┐
                ▼                     ▼                     ▼
         ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
         │ Model store │       │ Evidence    │       │ Tool layer  │
         │ / registry  │       │ + RAG       │       │ MCP / APIs  │
         └──────┬──────┘       └──────┬──────┘       └──────┬──────┘
                │                     │                     │
                └──────────────┬──────┴──────────────┬──────┘
                               ▼                     ▼
                       ┌───────────────┐      ┌───────────────┐
                       │ Receipt engine│      │ x402 payment  │
                       │ EIP-712 hash  │      │ when needed   │
                       └───────┬───────┘      └───────────────┘
                               │
                     ┌─────────┴──────────┐
                     ▼                    ▼
               ┌───────────┐       ┌──────────────┐
               │ IPFS CID  │       │ EAS / L2     │
               │ evidence  │       │ attestation  │
               └───────────┘       └──────┬───────┘
                                          ▼
                                  ┌──────────────┐
                                  │ Verify page  │
                                  │ public proof │
                                  └──────────────┘

Future agent layer:
ERC-8004 identity + reputation + validation
```

## Sources

1. Ethereum Improvement Proposal 712 — Typed structured data hashing and signing: https://eips.ethereum.org/EIPS/eip-712
2. Ethereum Improvement Proposal 4361 — Sign-In with Ethereum: https://eips.ethereum.org/EIPS/eip-4361
3. Ethereum data availability and storage strategies: https://ethereum.org/developers/docs/data-availability/ and https://ethereum.org/developers/docs/data-availability/blockchain-data-storage-strategies/
4. Ethereum scaling and rollups: https://ethereum.org/developers/docs/scaling/
5. Ethereum account abstraction: https://ethereum.org/roadmap/account-abstraction
6. IPFS content addressing: https://docs.ipfs.tech/concepts/content-addressing/
7. IPFS persistence and pinning: https://docs.ipfs.tech/concepts/persistence/
8. Ethereum Attestation Service: https://docs.attest.org/
9. Ethereum Attestation Service — schemas: https://docs.attest.org/docs/tutorials/create-a-schema
10. ERC-8004 Trustless Agents: https://eips.ethereum.org/EIPS/eip-8004
11. Ethereum Foundation overview of ERC-8004: https://ai.ethereum.foundation/blog/erc-8004-trustless-agents
12. x402 protocol: https://docs.x402.org/introduction
13. x402 HTTP 402 details: https://docs.x402.org/core-concepts/http-402
