(() => {
  const SEPOLIA_CHAIN_ID = '0xaa36a7';
  const SEPOLIA_DECIMAL = 11155111;
  const EAS_ADDRESS = '0xC2679fBD37d54388Ce493F1DB75320D236e1815e';
  const SCHEMA_REGISTRY = '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0';
  const NOVEN_SCHEMA = 'bytes32 queryHash,bytes32 answerHash,bytes32 evidenceHash,bytes32 modelHash,string runId,uint64 createdAt';
  const SCHEMA_STORAGE = 'noven_eas_schema_uid_v1';
  const web3State = { provider: null, address: '', chainId: '' };

  const $ = (id) => document.getElementById(id);
  const shortAddress = (value) => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : '';
  const shortValue = (value) => value && value.length > 34 ? `${value.slice(0, 26)}…${value.slice(-6)}` : (value || '—');

  function status(message, tone = 'neutral') {
    const node = $('web3Status');
    if (!node) return;
    node.textContent = message;
    node.dataset.tone = tone;
  }

  function setWalletButton() {
    const button = $('walletButton');
    if (button) button.textContent = web3State.address ? shortAddress(web3State.address) : 'Connect wallet';
  }

  function setSignature(value, title = '') {
    const node = $('verificationSignature');
    if (!node) return;
    node.textContent = shortValue(value);
    if (title) node.title = title;
  }

  async function connectWallet() {
    if (!window.ethereum) {
      status('No browser wallet detected · Web3 is optional', 'warning');
      return false;
    }
    try {
      web3State.provider = window.ethereum;
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      web3State.address = accounts?.[0] || '';
      web3State.chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setWalletButton();
      const chain = web3State.chainId?.toLowerCase() === SEPOLIA_CHAIN_ID ? 'Sepolia testnet' : `Chain ${parseInt(web3State.chainId, 16)}`;
      status(`${shortAddress(web3State.address)} · ${chain}`, 'success');
      return Boolean(web3State.address);
    } catch (error) {
      status('Wallet connection cancelled', 'warning');
      console.error(error);
      return false;
    }
  }

  async function switchToSepolia() {
    if (!window.ethereum) return connectWallet();
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_ID }] });
    } catch (error) {
      status('Switch to Sepolia was not completed', 'warning');
      return false;
    }
    return connectWallet();
  }

  async function sha256Hex(text) {
    if (!window.crypto?.subtle) throw new Error('Secure hashing unavailable');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
    return `0x${Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')}`;
  }

  function currentRun() {
    if (window.NOVEN_TRUST_RUN) return window.NOVEN_TRUST_RUN;
    const q = document.getElementById('question')?.value?.trim() || '';
    const a = document.getElementById('answer')?.textContent?.trim() || '';
    if (!q || !a) return null;
    return {
      runId: `NVR-${Date.now().toString(36).toUpperCase()}`,
      question: q,
      answer: a,
      sources: [],
      outputHash: '',
      createdAt: new Date().toISOString(),
      runtime: 'browser-runtime',
      model: 'NOVEN browser runtime',
      dataset: 'NOVEN knowledge layer'
    };
  }

  async function buildReceipt() {
    const run = currentRun();
    if (!run) throw new Error('Run a query first');
    const sources = Array.isArray(run.sources) ? run.sources : [];
    const [queryHash, answerHash, evidenceHash, modelHash] = await Promise.all([
      sha256Hex(run.question),
      sha256Hex(run.answer),
      sha256Hex(JSON.stringify(sources)),
      sha256Hex(`${run.model}|${run.runtime}|${run.dataset}`)
    ]);
    return {
      protocol: 'NOVEN Trust Receipt v1',
      runId: run.runId,
      createdAt: run.createdAt,
      runtime: run.runtime,
      model: run.model,
      dataset: run.dataset,
      questionHash: queryHash,
      answerHash,
      evidenceHash,
      modelHash,
      outputHash: run.outputHash ? `0x${run.outputHash.replace(/^0x/, '')}` : '',
      sources: sources.map((source) => ({ title: source.title || '', source: source.source || '', url: source.url || '', score: Number(source.score || 0) }))
    };
  }

  async function signEip712() {
    if (!window.ethereum) { status('Connect a browser wallet to sign the receipt', 'warning'); return; }
    if (!web3State.address && !(await connectWallet())) return;
    if (web3State.chainId?.toLowerCase() !== SEPOLIA_CHAIN_ID) {
      if (!(await switchToSepolia())) return;
    }
    try {
      status('Prepare the structured verification signature…', 'neutral');
      const receipt = await buildReceipt();
      const domain = { name: 'NOVEN Trust', version: '1', chainId: SEPOLIA_DECIMAL, verifyingContract: EAS_ADDRESS };
      const types = {
        NovenRun: [
          { name: 'runId', type: 'string' },
          { name: 'queryHash', type: 'bytes32' },
          { name: 'answerHash', type: 'bytes32' },
          { name: 'evidenceHash', type: 'bytes32' },
          { name: 'modelHash', type: 'bytes32' },
          { name: 'createdAt', type: 'uint256' }
        ]
      };
      const message = {
        runId: receipt.runId,
        queryHash: receipt.questionHash,
        answerHash: receipt.answerHash,
        evidenceHash: receipt.evidenceHash,
        modelHash: receipt.modelHash,
        createdAt: Math.floor(new Date(receipt.createdAt).getTime() / 1000)
      };
      const signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [web3State.address, JSON.stringify({ types: { EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' }
        ], ...types }, primaryType: 'NovenRun', domain, message })]
      });
      setSignature(signature, 'EIP-712 structured signature');
      status('EIP-712 receipt signed · no transaction sent', 'success');
      window.NOVEN_TRUST_SIGNATURE = { type: 'EIP-712', signature, domain, message, receipt };
      return signature;
    } catch (error) {
      status(error?.message || 'EIP-712 signature cancelled', 'warning');
      console.error(error);
      return null;
    }
  }

  function downloadReceipt() {
    buildReceipt().then((receipt) => {
      const payload = {
        ...receipt,
        signature: window.NOVEN_TRUST_SIGNATURE?.signature || null,
        signatureType: window.NOVEN_TRUST_SIGNATURE?.type || null,
        generatedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${receipt.runId}-noventrust.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      status('Verification receipt created locally', 'success');
    }).catch((error) => {
      status(error?.message || 'Create a query before exporting a receipt', 'warning');
    });
  }

  async function loadEthers() {
    if (window.ethers) return window.ethers;
    const module = await import('https://cdn.jsdelivr.net/npm/ethers@6.15.0/+esm');
    window.ethers = module;
    return module;
  }

  async function registerSchema() {
    const ethers = await loadEthers();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const abi = ['function register(string schema,address resolver,bool revocable) returns (bytes32)'];
    const registry = new ethers.Contract(SCHEMA_REGISTRY, abi, signer);
    const schemaUid = ethers.solidityPackedKeccak256(['string', 'address', 'bool'], [NOVEN_SCHEMA, ethers.ZeroAddress, true]);
    try {
      const existing = await provider.call({ to: SCHEMA_REGISTRY, data: registry.interface.encodeFunctionData('register', [NOVEN_SCHEMA, ethers.ZeroAddress, true]) });
      void existing;
    } catch (error) {
      void error;
    }
    const tx = await registry.register(NOVEN_SCHEMA, ethers.ZeroAddress, true);
    status('Registering NOVEN attestation schema…', 'neutral');
    await tx.wait();
    try { localStorage.setItem(SCHEMA_STORAGE, schemaUid); } catch { /* storage optional */ }
    status(`NOVEN schema registered · ${shortValue(schemaUid)}`, 'success');
    return schemaUid;
  }

  async function getSchemaUid() {
    let stored = '';
    try { stored = localStorage.getItem(SCHEMA_STORAGE) || ''; } catch { /* storage optional */ }
    if (stored && /^0x[0-9a-fA-F]{64}$/.test(stored)) return stored;
    const ethers = await loadEthers();
    return ethers.solidityPackedKeccak256(['string', 'address', 'bool'], [NOVEN_SCHEMA, ethers.ZeroAddress, true]);
  }

  async function attestOnEas() {
    if (!window.ethereum) { status('Connect a browser wallet to create an EAS attestation', 'warning'); return; }
    if (!web3State.address && !(await connectWallet())) return;
    if (web3State.chainId?.toLowerCase() !== SEPOLIA_CHAIN_ID) {
      if (!(await switchToSepolia())) return;
    }
    try {
      const ethers = await loadEthers();
      const receipt = await buildReceipt();
      const schema = await getSchemaUid();
      const coder = ethers.AbiCoder.defaultAbiCoder();
      const encoded = coder.encode(
        ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'string', 'uint64'],
        [receipt.questionHash, receipt.answerHash, receipt.evidenceHash, receipt.modelHash, receipt.runId, BigInt(Math.floor(new Date(receipt.createdAt).getTime() / 1000))]
      );
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const abi = ['function attest(tuple(bytes32 schema,tuple(address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value) data)) payable returns (bytes32)'];
      const eas = new ethers.Contract(EAS_ADDRESS, abi, signer);
      status('Waiting for wallet approval for EAS…', 'neutral');
      const tx = await eas.attest({ schema, data: { recipient: ethers.ZeroAddress, expirationTime: 0, revocable: true, refUID: ethers.ZeroHash, data: encoded, value: 0 } });
      const mined = await tx.wait();
      const txHash = mined?.hash || tx.hash;
      const url = `https://sepolia.easscan.org/attestation/view/${txHash}`;
      setSignature(txHash, 'EAS transaction hash');
      status('EAS attestation submitted on Sepolia', 'success');
      window.NOVEN_TRUST_ATTESTATION = { schema, txHash, explorer: `https://sepolia.etherscan.io/tx/${txHash}`, easscan: url, receipt };
    } catch (error) {
      status(error?.message || 'EAS attestation failed', 'warning');
      console.error(error);
    }
  }

  function bind() {
    $('walletButton')?.addEventListener('click', connectWallet);
    $('verifyWalletButton')?.addEventListener('click', signEip712);
    $('anchorButton')?.addEventListener('click', attestOnEas);
    $('sepoliaButton')?.addEventListener('click', switchToSepolia);
    $('downloadReceiptButton')?.addEventListener('click', downloadReceipt);
    $('registerSchemaButton')?.addEventListener('click', async () => {
      try {
        if (!window.ethereum) { status('Connect a browser wallet first', 'warning'); return; }
        if (!web3State.address && !(await connectWallet())) return;
        if (web3State.chainId?.toLowerCase() !== SEPOLIA_CHAIN_ID) {
          if (!(await switchToSepolia())) return;
        }
        await registerSchema();
      } catch (error) {
        status(error?.message || 'Schema registration failed', 'warning');
        console.error(error);
      }
    });

    if (window.ethereum) {
      window.ethereum.on?.('accountsChanged', (accounts) => {
        web3State.address = accounts?.[0] || '';
        setWalletButton();
        status(web3State.address ? `${shortAddress(web3State.address)} · wallet connected` : 'Wallet not connected', web3State.address ? 'success' : 'neutral');
      });
      window.ethereum.on?.('chainChanged', (chainId) => {
        web3State.chainId = chainId;
        if (web3State.address) status(`${shortAddress(web3State.address)} · ${chainId.toLowerCase() === SEPOLIA_CHAIN_ID ? 'Sepolia testnet' : `Chain ${parseInt(chainId, 16)}`}`, 'success');
      });
    }

    window.addEventListener('noven:run', () => {
      setSignature('—');
      status('Run ready · choose a trust action', 'neutral');
    });
  }

  window.addEventListener('load', bind);
})();
