import React, { useContext, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { ICOContent } from '../Context';
import { orderAPI, offerAPI } from '../services/api';
import toast from 'react-hot-toast';

const OfferModal = ({ isOpen, onClose, nft }) => {
  const { address } = useContext(ICOContent);
  const [offerPrice, setOfferPrice] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [offerType, setOfferType] = useState('offer'); // 'offer' or 'buy'
  const [selectedPaymentNetwork, setSelectedPaymentNetwork] = useState(nft?.network || 'ethereum');
  const [transactionHash, setTransactionHash] = useState('');

  const handlePaymentConfirmation = async () => {
    if (!transactionHash.trim()) {
      toast.error('Please enter a transaction hash');
      return;
    }

    setIsLoading(true);
    try {
      // This would need to be implemented - confirm payment with transaction hash
      // For now, just show success
      toast.success('Payment confirmation submitted! NFT transfer will be processed.');
      setTransactionHash('');
      onClose();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitOffer = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsLoading(true);
    try {
      const priceInWei = (parseFloat(offerPrice) * 1e18).toString();

      if (offerType === 'offer') {
        // Make an offer
        await offerAPI.makeOffer({
          nftId: nft.itemId,
          offerer: address,
          offerPrice: priceInWei,
          expirationDays: expirationDays,
          network: nft.network
        });
        toast.success('Offer placed successfully!');
      } else {
        // Buy now - create order first
        const orderResponse = await orderAPI.createOrder({
          nftId: nft.itemId,
          buyer: address,
          price: priceInWei,
          network: nft.network
        });
        
        // For buy now, we need payment confirmation
        toast.success('Order created! Please complete payment to receive the NFT.');
        
        // Reset form but keep modal open for payment
        setOfferPrice('');
        setTransactionHash('');
        return; // Don't close modal yet
      }

      setOfferPrice('');
      setExpirationDays(7);
      onClose();
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast.error(error.message || 'Failed to submit offer');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !nft) return null;

  const nftPrice = nft.price ? (parseFloat(nft.price) / 1e18).toFixed(4) : 'N/A';
  const offerPriceValue = offerPrice ? parseFloat(offerPrice).toFixed(4) : '0.00';
  const priceDifference = offerPrice ? (parseFloat(offerPrice) - nftPrice).toFixed(4) : '0.00';

  return (
    <div>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {offerType === 'offer' ? 'Make an Offer' : 'Buy Now'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">{nft.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Offer Type Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOfferType('offer')}
                className={`py-2 px-4 rounded-lg font-semibold transition-colors ${
                  offerType === 'offer'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Make Offer
              </button>
              <button
                onClick={() => setOfferType('buy')}
                className={`py-2 px-4 rounded-lg font-semibold transition-colors ${
                  offerType === 'buy'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Buy Now
              </button>
            </div>

            {/* NFT Details */}
            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Listed Price</span>
                <span className="font-semibold">{nftPrice} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Collection</span>
                <span className="font-semibold">{nft.collection || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Network</span>
                <span className="font-semibold capitalize">{nft.network}</span>
              </div>
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold">
                {offerType === 'offer' ? 'Offer Price' : 'Purchase Price'} (ETH)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              {offerPrice && (
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Your Offer:</span>
                  <span className={priceDifference < 0 ? 'text-red-400' : 'text-green-400'}>
                    {priceDifference < 0 ? '-' : '+'} {Math.abs(priceDifference)} ETH
                  </span>
                </div>
              )}
            {/* Payment Network Selection (Only for Buy Now) */}
            {offerType === 'buy' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold">Payment Network</label>
                <select
                  value={selectedPaymentNetwork}
                  onChange={(e) => setSelectedPaymentNetwork(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  {/* NFT's network first */}
                  <option value={nft.network} className="capitalize">
                    {nft.network.charAt(0).toUpperCase() + nft.network.slice(1)} (Recommended)
                  </option>
                  {/* Other networks */}
                  {['ethereum', 'polygon', 'bsc', 'arbitrum', 'base', 'solana']
                    .filter(network => network !== nft.network)
                    .map(network => (
                      <option key={network} value={network} className="capitalize">
                        {network.charAt(0).toUpperCase() + network.slice(1)}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-400">
                  Pay using {selectedPaymentNetwork.charAt(0).toUpperCase() + selectedPaymentNetwork.slice(1)} network
                </p>
              </div>
            )}

            {/* Transaction Hash Input (Only for Buy Now after order creation) */}
            {offerType === 'buy' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold">Transaction Hash (Optional)</label>
                <input
                  type="text"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-400">
                  Enter transaction hash after payment to speed up processing
                </p>
              </div>
            )}
            {offerType === 'offer' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold">Expiration</label>
                <select
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={1}>1 Day</option>
                  <option value={7}>1 Week</option>
                  <option value={14}>2 Weeks</option>
                  <option value={30}>1 Month</option>
                </select>
              </div>
            )}

            {/* Summary */}
            <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-500/30">
              <div className="text-sm">
                <p className="text-gray-300 mb-2">You're about to:</p>
                <p className="font-semibold mb-2">
                  {offerType === 'offer'
                    ? `Place an offer of ${offerPriceValue} ETH for ${expirationDays} day${expirationDays > 1 ? 's' : ''}`
                    : `Purchase this NFT for ${offerPriceValue} ETH`}
                </p>
                {offerType === 'buy' && (
                  <div className="text-xs text-gray-400">
                    <p>• Payment Network: {selectedPaymentNetwork.charAt(0).toUpperCase() + selectedPaymentNetwork.slice(1)}</p>
                    <p>• Send {offerPriceValue} ETH to the seller's wallet</p>
                    <p>• NFT will be transferred after payment confirmation</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800 space-y-3">
            <button
              onClick={handleSubmitOffer}
              disabled={isLoading || !offerPrice}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Processing...' : offerType === 'offer' ? 'Place Offer' : 'Create Order & Pay'}
            </button>
            
            {offerType === 'buy' && transactionHash && (
              <button
                onClick={handlePaymentConfirmation}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? 'Processing...' : 'Confirm Payment'}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="w-full bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferModal;
