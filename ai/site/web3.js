const web3State = { provider: null, address: '', chainId: '' };
const SEPOLIA_CHAIN_ID = '0xaa36a7';

function shortAddress(address) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }
function shortHash(value) { return value.length > 30 ? `${value.slice(0, 24)}…${value.slice(-6)}` : value; }

function setWeb3Status(message, tone = 'neutral') {
  const status = document.getElementById('web3Status');
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function setWalletButton(connected) {
  const button = document.getElementById('walletButton');
  if (!button) return;
  button.textContent = connected ? shortAddress(web3State.address) : 'Connect wallet';
  button.dataset.connected = connected ? 'true' : 'false';
}

async function connectWallet() {
  if (!window.ethereum) {
    setWeb3Status('No browser wallet detected · Web3 stays optional', 'warning');
    return false;
  }
  try {
    web3State.provider = window.ethereum;
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    web3State.address = accounts[0] || '';
    web3State.chainId = chainId || '';
    setWalletButton(Boolean(web3State.address));
    const chainLabel = chainId?.toLowerCase() === SEPOLIA_CHAIN_ID ? 'Sepolia testnet' : `Chain ${parseInt(chainId, 16)}`;
    setWeb3Status(`${shortAddress(web3State.address)} · ${chainLabel}`, 'success');
    return Boolean(web3State.address);
  } catch (error) {
    setWeb3Status('Wallet connection cancelled', 'warning');
    console.error(error);
    return false;
  }
}

async function switchToSepolia() {
  if (!window.ethereum) return connectWallet();
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_ID }] });
    return connectWallet();
  } catch (error) {
    setWeb3Status('Switch to Sepolia was not completed', 'warning');
    console.error(error);
    return false;
  }
}

async function verifyWithWallet() {
  if (!window.ethereum) {
    setWeb3Status('Connect a browser wallet to sign the verification message', 'warning');
    return;
  }
  if (!web3State.address && !(await connectWallet())) return;
  const hash = document.getElementById('verificationHash')?.textContent || 'NOVEN-demo';
  const message = `NOVEN verification\nEvidence hash: ${hash}\nNetwork: Sepolia testnet\nNo transaction requested.`;
  try {
    const signature = await window.ethereum.request({ method: 'personal_sign', params: [message, web3State.address] });
    const sigField = document.getElementById('verificationSignature');
    if (sigField) sigField.innerHTML = `<span title="${signature}">${shortHash(signature)}</span>`;
    setWeb3Status('Signed locally · no transaction sent', 'success');
  } catch (error) {
    setWeb3Status('Verification signature cancelled', 'warning');
    console.error(error);
  }
}

function hashFromUi() {
  const value = document.getElementById('web3Hash')?.textContent || document.getElementById('verificationHash')?.textContent || '';
  return value.replace(/…/g, '').trim();
}

function hexFromUtf8(text) {
  return [...new TextEncoder().encode(text)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function anchorOnChain() {
  if (!window.ethereum) {
    setWeb3Status('Install a browser wallet to anchor on Sepolia', 'warning');
    return;
  }
  if (!web3State.address && !(await connectWallet())) return;
  if (web3State.chainId.toLowerCase() !== SEPOLIA_CHAIN_ID) {
    if (!(await switchToSepolia())) return;
  }

  const hash = hashFromUi();
  if (!hash || hash === 'Awaiting a run') {
    setWeb3Status('Run a query before anchoring its output', 'warning');
    return;
  }

  const payload = `NOVEN:${hash}`;
  try {
    setWeb3Status('Waiting for wallet approval…', 'neutral');
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: web3State.address,
        to: web3State.address,
        value: '0x0',
        data: `0x${hexFromUtf8(payload)}`,
      }],
    });

    const signature = document.getElementById('verificationSignature');
    if (signature) {
      const url = `https://sepolia.etherscan.io/tx/${txHash}`;
      signature.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" title="${txHash}">tx ${shortHash(txHash)}</a>`;
    }
    setWeb3Status('Hash anchored on Sepolia', 'success');
  } catch (error) {
    setWeb3Status('Transaction cancelled or rejected', 'warning');
    console.error(error);
  }
}

window.addEventListener('load', () => {
  const walletButton = document.getElementById('walletButton');
  const verifyButton = document.getElementById('verifyWalletButton');
  const anchorButton = document.getElementById('anchorButton');
  const anchorButton2 = document.getElementById('anchorButton2');
  const sepoliaButton = document.getElementById('sepoliaButton');

  walletButton?.addEventListener('click', connectWallet);
  verifyButton?.addEventListener('click', verifyWithWallet);
  anchorButton?.addEventListener('click', anchorOnChain);
  anchorButton2?.addEventListener('click', anchorOnChain);
  sepoliaButton?.addEventListener('click', switchToSepolia);

  if (window.ethereum) {
    window.ethereum.on?.('accountsChanged', (accounts) => {
      web3State.address = accounts[0] || '';
      setWalletButton(Boolean(web3State.address));
      if (web3State.address) setWeb3Status(`${shortAddress(web3State.address)} · wallet connected`, 'success');
      else setWeb3Status('Wallet not connected');
    });
    window.ethereum.on?.('chainChanged', (chainId) => {
      web3State.chainId = chainId;
      if (web3State.address) setWeb3Status(`${shortAddress(web3State.address)} · ${chainId.toLowerCase() === SEPOLIA_CHAIN_ID ? 'Sepolia testnet' : `Chain ${parseInt(chainId, 16)}`}`, 'success');
    });
  }
});
