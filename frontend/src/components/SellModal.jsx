import React, { useContext, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { ICOContent } from '../Context';
import { getCurrencySymbol } from '../Context/constants';
import toast from 'react-hot-toast';

const NETWORK_CHAIN_IDS = {
  ethereum: 1,
  polygon: 137,
  bsc: 56,
  arbitrum: 42161,
  base: 8453,
};

const SellModal = ({ isOpen, onClose, nft }) => {
  const { address, listNFT, setSelectedChain } = useContext(ICOContent);
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitchNetwork = async (networkName) => {
    if (!window.ethereum) throw new Error('Please install a Web3 wallet');
    const chainId = NETWORK_CHAIN_IDS[networkName?.toLowerCase()];
    if (!chainId) throw new Error(`Unknown network: ${networkName}`);
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    const currentChainIdNum = parseInt(currentChainId, 16);
    if (currentChainIdNum === chainId) return;
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
    await new Promise((r) => setTimeout(r, 500));
  };

  const handleList = async (e) => {
    e?.preventDefault();
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }
    const nftContract = nft?.contractAddress || nft?.nftContract;
    const tokenId = nft?.tokenId;
    const network = (nft?.network || 'ethereum').toLowerCase();
    if (!nftContract || !tokenId) {
      toast.error('This NFT cannot be listed here (missing contract or token ID). Use Profile > List NFT.');
      return;
    }
    const priceNum = price && parseFloat(price);
    if (!priceNum || priceNum <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    setIsLoading(true);
    try {
      await handleSwitchNetwork(network);
      if (setSelectedChain) setSelectedChain(network);
      const receipt = await listNFT(nftContract, tokenId, String(priceNum));
      const success = receipt && (receipt.status === 1 || receipt.transactionHash);
      if (success) {
        toast.success('Listed for sale successfully!');
        setPrice('');
        onClose?.();
      } else {
        toast.error(receipt?.message || 'Listing failed');
      }
    } catch (err) {
      console.error('SellModal list error:', err);
      toast.error(err?.message || 'Failed to list NFT');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const symbol = getCurrencySymbol(nft?.network || 'ethereum');
  const canList = nft?.contractAddress || nft?.nftContract;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div>
              <h2 className="text-xl font-bold text-white">List for sale</h2>
              <p className="text-sm text-gray-400 mt-0.5">{nft?.name}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <FiX className="text-xl" />
            </button>
          </div>
          <form onSubmit={handleList} className="p-6 space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Network</span>
                <span className="font-medium text-white capitalize">{nft?.network || 'Ethereum'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Token ID</span>
                <span className="font-mono text-white">{nft?.tokenId ?? '—'}</span>
              </div>
            </div>
            {!canList && (
              <p className="text-amber-400 text-sm">
                This item does not have a contract/token ID for on-chain listing. You can list from Profile → List NFT with your token ID.
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price ({symbol}) *
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder={`0.00`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-lg font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !price.trim() || !canList}
                className="flex-1 py-3 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Listing…' : 'List for sale'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SellModal;
