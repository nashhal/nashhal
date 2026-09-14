const web3State = {
  provider: null,
  address: '',
  chainId: '',
};

const SEPOLIA_CHAIN_ID = '0xaa36a7';

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

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
    return;
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
  } catch (error) {
    setWeb3Status('Wallet connection cancelled', 'warning');
    console.error(error);
  }
}

async function verifyWithWallet() {
  if (!window.ethereum) {
    setWeb3Status('Connect a browser wallet to sign a non-financial verification message', 'warning');
    return;
  }
  if (!web3State.address) {
    await connectWallet();
    if (!web3State.address) return;
  }

  const hash = document.getElementById('verificationHash')?.textContent || 'NOVEN-demo';
  const message = `NOVEN verification\nEvidence hash: ${hash}\nNetwork: Sepolia testnet\nNo transaction requested.`;

  try {
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, web3State.address],
    });
    const sigField = document.getElementById('verificationSignature');
    if (sigField) sigField.textContent = `${signature.slice(0, 18)}…${signature.slice(-10)}`;
    setWeb3Status('Signed locally · no transaction sent', 'success');
  } catch (error) {
    setWeb3Status('Verification signature cancelled', 'warning');
    console.error(error);
  }
}

async function switchToSepolia() {
  if (!window.ethereum) return connectWallet();
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
    await connectWallet();
  } catch (error) {
    setWeb3Status('Switch to Sepolia was not completed', 'warning');
    console.error(error);
  }
}

window.addEventListener('load', () => {
  const walletButton = document.getElementById('walletButton');
  const verifyButton = document.getElementById('verifyWalletButton');
  const sepoliaButton = document.getElementById('sepoliaButton');

  walletButton?.addEventListener('click', connectWallet);
  verifyButton?.addEventListener('click', verifyWithWallet);
  sepoliaButton?.addEventListener('click', switchToSepolia);

  if (window.ethereum) {
    window.ethereum.on?.('accountsChanged', (accounts) => {
      web3State.address = accounts[0] || '';
      setWalletButton(Boolean(web3State.address));
      if (web3State.address) setWeb3Status(`${shortAddress(web3State.address)} · wallet connected`, 'success');
    });
    window.ethereum.on?.('chainChanged', (chainId) => {
      web3State.chainId = chainId;
      if (web3State.address) connectWallet();
    });
  }
});