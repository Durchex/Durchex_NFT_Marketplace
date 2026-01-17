import React, { useContext, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { ICOContent } from '../Context';
import { orderAPI, offerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';

const OfferModal = ({ isOpen, onClose, nft }) => {
  const { address } = useContext(ICOContent);
  const [offerPrice, setOfferPrice] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [offerType, setOfferType] = useState('offer'); // 'offer' or 'buy'
  const [selectedPaymentNetwork, setSelectedPaymentNetwork] = useState(nft?.network || 'ethereum');
  const [transactionHash, setTransactionHash] = useState('');
  const [orderCreated, setOrderCreated] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentInProgress, setPaymentInProgress] = useState(false);

  // Map network names to chain IDs
  const NETWORK_CHAIN_IDS = {
    'ethereum': 1,
    'polygon': 137,
    'bsc': 56,
    'arbitrum': 42161,
    'optimism': 10,
    'avalanche': 43114,
    'base': 8453,
    'solana': 101  // Note: Solana is not EVM, will need special handling
  };

  const handleSwitchNetwork = async (networkName) => {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask or another Web3 wallet');
    }

    const chainId = NETWORK_CHAIN_IDS[networkName?.toLowerCase()];
    if (!chainId) {
      throw new Error(`Unknown network: ${networkName}`);
    }

    try {
      // Get current chain ID first
      const currentChainId = await window.ethereum.request({
        method: 'eth_chainId'
      });
      const currentChainIdNum = parseInt(currentChainId, 16);
      
      console.log(`Current chain ID: ${currentChainIdNum}, target chain ID: ${chainId}`);
      
      // If already on correct network, skip switch
      if (currentChainIdNum === chainId) {
        console.log(`Already on ${networkName}`);
        return;
      }

      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      
      console.log(`Switched to ${networkName} (Chain ID: ${chainId})`);
      
      // Wait for network switch to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (switchError) {
      // If the network isn't added, throw to let caller handle it
      if (switchError.code === 4902) {
        console.warn(`Network ${networkName} not in wallet, will attempt to add it`);
        throw new Error(`Please add ${networkName} network to your wallet`);
      }
      if (switchError.code !== 4902) {
        throw switchError;
      }
    }
  };

  const handlePaymentWithWallet = async () => {
    if (!currentOrder) {
      toast.error('No order found. Please create an order first.');
      return;
    }

    setPaymentInProgress(true);
    try {
      // Check if window.ethereum is available
      if (!window.ethereum) {
        toast.error('Please install MetaMask or another Web3 wallet');
        setPaymentInProgress(false);
        return;
      }

      console.log('=== Payment Initiation ===');
      console.log('Order:', currentOrder);

      // Try to switch to the correct network first
      try {
        console.log(`Switching to network: ${currentOrder.network}`);
        await handleSwitchNetwork(currentOrder.network);
      } catch (switchError) {
        console.error('Network switch failed:', switchError);
        toast.error(`Network error: ${switchError.message}`);
        setPaymentInProgress(false);
        return;
      }

      // Re-initialize provider after network switch with proper configuration
      const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      
      // Get and verify signer
      let signer;
      try {
        signer = provider.getSigner();
      } catch (signerError) {
        console.error('Failed to get signer:', signerError);
        toast.error('Failed to connect to wallet. Please try again.');
        setPaymentInProgress(false);
        return;
      }

      let signerAddress;
      try {
        signerAddress = await signer.getAddress();
        console.log('Signer address:', signerAddress);
      } catch (addressError) {
        console.error('Failed to get signer address:', addressError);
        toast.error('Failed to get wallet address. Please try again.');
        setPaymentInProgress(false);
        return;
      }

      // Verify the connected wallet matches the buyer
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        console.error('Wallet mismatch:', {
          connected: signerAddress,
          buyer: address
        });
        toast.error('Connected wallet does not match buyer address');
        setPaymentInProgress(false);
        return;
      }

      console.log('Initiating payment from', signerAddress, 'to', currentOrder.seller);
      console.log('Network:', currentOrder.network, 'Amount (Wei):', currentOrder.price);
      
      // Validate transaction parameters
      if (!currentOrder.seller || !currentOrder.price) {
        throw new Error('Invalid order: missing seller or price');
      }

      if (!ethers.utils.isAddress(currentOrder.seller)) {
        throw new Error('Invalid seller address');
      }

      // Prepare transaction with proper formatting
      const txValue = ethers.utils.parseEther(
        ethers.utils.formatEther(currentOrder.price)
      );

      const tx = {
        to: ethers.utils.getAddress(currentOrder.seller), // Checksum address
        from: signerAddress,
        value: txValue,
        data: '0x' // Empty data for ETH transfer
      };

      console.log('Transaction details:', {
        to: tx.to,
        from: tx.from,
        value: ethers.utils.formatEther(tx.value),
        valueInWei: tx.value.toString()
      });

      // Estimate gas before sending
      toast.loading('Estimating gas...');
      let gasEstimate;
      try {
        gasEstimate = await provider.estimateGas(tx);
        console.log('Estimated gas:', gasEstimate.toString());
        
        // Add 20% buffer to gas estimate
        tx.gasLimit = gasEstimate.mul(120).div(100);
        console.log('Gas limit with buffer:', tx.gasLimit.toString());
      } catch (gasError) {
        console.warn('Gas estimation failed, letting provider handle it:', gasError);
        // Continue anyway - provider might handle it
      }

      // Show confirmation toast
      toast.loading('Please confirm the transaction in your wallet...');

      // Send transaction with comprehensive error handling
      let txResponse;
      try {
        console.log('Sending transaction...');
        txResponse = await signer.sendTransaction(tx);
        console.log('Transaction sent:', txResponse.hash);
      } catch (sendError) {
        console.error('Send transaction error:', {
          code: sendError.code,
          message: sendError.message,
          details: sendError,
          stack: sendError.stack
        });

        // Check if it's a provider timeout, retry once
        if (sendError.code === -32603 || sendError.message?.includes('timeout')) {
          console.log('Attempting retry...');
          toast.loading('Retrying transaction...');
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            txResponse = await signer.sendTransaction(tx);
            console.log('Transaction sent on retry:', txResponse.hash);
          } catch (retryError) {
            console.error('Retry failed:', retryError);
            
            // If retry also fails, show manual fallback option
            toast.error('Automatic payment failed. Please try the manual method or check your wallet.');
            setPaymentInProgress(false);
            return;
          }
        } else {
          throw sendError;
        }
      }

      toast.loading('Transaction pending... waiting for confirmation (this may take 15-60 seconds)');

      // Wait for transaction confirmation (1 block confirmation)
      let receipt;
      try {
        receipt = await txResponse.wait(1);
        console.log('Transaction confirmed:', receipt.transactionHash);
      } catch (waitError) {
        console.error('Wait for receipt error:', waitError);
        toast.error('Error waiting for transaction confirmation. Please check the transaction manually.');
        setPaymentInProgress(false);
        return;
      }

      // Update order in database with transaction hash
      try {
        await orderAPI.updateOrderStatus(currentOrder.orderId, 'completed', receipt.transactionHash);
      } catch (updateError) {
        console.error('Error updating order status:', updateError);
        toast.error('Payment received but failed to update order. Please contact support.');
        setPaymentInProgress(false);
        return;
      }
      
      toast.success(`Payment successful! Transaction: ${receipt.transactionHash.slice(0, 10)}...`);
      
      // Close modal after successful payment
      setTimeout(() => {
        setOrderCreated(false);
        setCurrentOrder(null);
        setOfferPrice('');
        setTransactionHash('');
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Payment error details:', {
        code: error.code,
        message: error.message,
        data: error.data,
        stack: error.stack
      });
      
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        toast.error('Transaction cancelled by user');
      } else if (error.code === 'INSUFFICIENT_FUNDS' || error.code === -32000) {
        toast.error('Insufficient funds in wallet');
      } else if (error.code === -32603) {
        toast.error('RPC error. Please check your internet connection and try again.');
      } else if (error.code === -32602) {
        toast.error('Invalid transaction parameters. Please try again.');
      } else if (error.message?.includes('network')) {
        toast.error(`Network error: ${error.message}`);
      } else if (error.message?.includes('timeout')) {
        toast.error('Transaction timeout. Please check your connection and try again.');
      } else if (error.message?.includes('gas')) {
        toast.error('Gas estimation failed. Try reducing the price or check your wallet.');
      } else {
        toast.error(`Payment failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setPaymentInProgress(false);
    }
  };

  const handlePaymentConfirmation = async () => {
    if (!transactionHash.trim()) {
      toast.error('Please enter a transaction hash');
      return;
    }

    setIsLoading(true);
    try {
      // Update order with transaction hash from manual entry
      await orderAPI.updateOrderStatus(currentOrder.orderId, 'completed', transactionHash);
      toast.success('Payment confirmation submitted! NFT transfer will be processed.');
      setTransactionHash('');
      setOrderCreated(false);
      setCurrentOrder(null);
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
        // Map network to valid currency enum value
        const currencyMap = {
          'ethereum': 'ETH',
          'polygon': 'MATIC',
          'bsc': 'BNB',
          'arbitrum': 'ARB',
          'base': 'BASE',
          'solana': 'SOL'
        };
        
        const network = nft.network || 'ethereum';
        const currency = currencyMap[network] || 'ETH';
        
        const orderData = {
          nftId: nft.itemId || nft.tokenId || nft._id,
          buyer: address,
          seller: nft.owner || nft.seller, // The current NFT owner is the seller
          price: priceInWei,
          amount: '1', // NFTs typically have amount 1 for individual items
          currency: currency, // Use mapped currency based on network
          network: network,
          contractAddress: nft.nftContract || nft.contractAddress || nft.contract,
          nftName: nft.name,
          nftImage: nft.image,
          collectionName: nft.collection
        };
        
        // Validate all required fields are present
        const requiredFields = ['nftId', 'buyer', 'seller', 'price', 'amount', 'currency', 'network', 'contractAddress'];
        const missingFields = requiredFields.filter(field => !orderData[field]);
        
        if (missingFields.length > 0) {
          console.error('Missing required fields:', missingFields);
          console.error('Order data:', orderData);
          toast.error(`Missing required fields: ${missingFields.join(', ')}`);
          setIsLoading(false);
          return;
        }
        
        console.log('Creating order with data:', orderData);
        const orderResponse = await orderAPI.createOrder(orderData);
        
        console.log('Order created successfully:', orderResponse);
        
        if (!orderResponse || !orderResponse.order) {
          throw new Error('Invalid order response from server');
        }
        
        // Store the order details for payment
        setCurrentOrder(orderResponse.order);
        setOrderCreated(true);
        
        // For buy now, we need payment confirmation
        toast.success('Order created! Ready for payment.');
        
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
            {offerType === 'buy' && !orderCreated && (
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
            {!orderCreated ? (
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
            ) : (
              <div className="bg-green-600/20 rounded-lg p-4 border border-green-500/30">
                <div className="text-sm">
                  <p className="text-green-300 font-semibold mb-2">✓ Order Created</p>
                  <div className="text-xs text-gray-300 space-y-1">
                    <p>• Order ID: {currentOrder?.orderId}</p>
                    <p>• Amount: {offerPriceValue} ETH</p>
                    <p>• Recipient: {currentOrder?.seller?.slice(0, 10)}...</p>
                    <p className="text-yellow-400 mt-2">⏳ Awaiting payment confirmation</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800 space-y-3">
            {!orderCreated ? (
              <>
                <button
                  onClick={handleSubmitOffer}
                  disabled={isLoading || !offerPrice}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  {isLoading ? 'Processing...' : offerType === 'offer' ? 'Place Offer' : 'Create Order & Pay'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {/* Payment Section - shown after order is created */}
                <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-500/30 mb-3">
                  <h3 className="font-semibold mb-3">Complete Payment</h3>
                  <button
                    onClick={handlePaymentWithWallet}
                    disabled={paymentInProgress || isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors mb-2"
                  >
                    {paymentInProgress ? 'Processing Payment...' : '💳 Pay with Wallet'}
                  </button>
                  <p className="text-xs text-gray-400 mb-3 text-center">Click to send {offerPriceValue} ETH to seller</p>
                </div>

                {/* Alternative: Manual Transaction Hash */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400">Or Enter Transaction Hash</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={transactionHash}
                      onChange={(e) => setTransactionHash(e.target.value)}
                      placeholder="0x..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={handlePaymentConfirmation}
                      disabled={isLoading || !transactionHash.trim()}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      {isLoading ? '...' : 'Confirm'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">If you already sent the payment, paste the TX hash here</p>
                </div>

                <button
                  onClick={() => {
                    setOrderCreated(false);
                    setCurrentOrder(null);
                    setTransactionHash('');
                    setOfferPrice('');
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel Order
                </button>
              </>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferModal;
