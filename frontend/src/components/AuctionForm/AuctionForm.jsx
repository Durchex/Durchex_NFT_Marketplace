/**
 * AuctionForm Component
 * Create and launch auctions for NFTs
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './AuctionForm.css';

const AuctionForm = ({ nftContract, tokenId, creator, onAuctionCreated }) => {
    const [formData, setFormData] = useState({
        startingBid: '',
        reservePrice: '',
        durationHours: 24,
        paymentToken: ethers.ZeroAddress,
        autoExtend: true
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [gasEstimate, setGasEstimate] = useState('0');
    const [nftData, setNftData] = useState(null);

    // Fetch NFT data and gas estimate
    useEffect(() => {
        const fetchData = async () => {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const gasPrice = await provider.getGasPrice();
                
                // Estimate auction creation gas (~150k)
                const estimatedGas = ethers.parseUnits('150000', 'wei');
                const gasCost = (estimatedGas * gasPrice) / BigInt(1e18);
                setGasEstimate(ethers.formatEther(gasCost));

                // TODO: Fetch NFT metadata from API
                setNftData({
                    name: `NFT #${tokenId}`,
                    contract: nftContract
                });
            } catch (err) {
                console.error('Failed to fetch data:', err);
            }
        };

        fetchData();
    }, [nftContract, tokenId]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError('');
    };

    const validateForm = () => {
        if (!formData.startingBid || parseFloat(formData.startingBid) <= 0) {
            setError('Please enter a valid starting bid');
            return false;
        }

        if (!formData.reservePrice || parseFloat(formData.reservePrice) <= 0) {
            setError('Please enter a valid reserve price');
            return false;
        }

        if (parseFloat(formData.startingBid) > parseFloat(formData.reservePrice)) {
            setError('Starting bid cannot be higher than reserve price');
            return false;
        }

        if (formData.durationHours < 1 || formData.durationHours > 720) {
            setError('Duration must be between 1 hour and 30 days');
            return false;
        }

        return true;
    };

    const handleCreateAuction = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();

            const auctionData = {
                nftContract,
                tokenId,
                creator: userAddress,
                startingBid: ethers.parseEther(formData.startingBid).toString(),
                reservePrice: ethers.parseEther(formData.reservePrice).toString(),
                durationHours: parseInt(formData.durationHours),
                paymentToken: formData.paymentToken,
                autoExtend: formData.autoExtend
            };

            const response = await fetch('/api/auctions/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await signer.signMessage('Durchex NFT Marketplace')}`
                },
                body: JSON.stringify(auctionData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create auction');
            }

            setSuccess('Auction created successfully!');
            setFormData({
                startingBid: '',
                reservePrice: '',
                durationHours: 24,
                paymentToken: ethers.ZeroAddress,
                autoExtend: true
            });

            if (onAuctionCreated) {
                onAuctionCreated(result.data);
            }

            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error('Failed to create auction:', err);
            setError(err.message || 'Failed to create auction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auction-form-container">
            <h2>Create Auction</h2>

            <form onSubmit={handleCreateAuction} className="auction-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {/* NFT Info */}
                <div className="nft-info">
                    <div className="info-item">
                        <span className="label">NFT:</span>
                        <span className="value">{nftData?.name || `#${tokenId}`}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Contract:</span>
                        <span className="value">{nftContract.slice(0, 6)}...{nftContract.slice(-4)}</span>
                    </div>
                </div>

                {/* Starting Bid */}
                <div className="form-group">
                    <label htmlFor="startingBid">Starting Bid</label>
                    <div className="input-with-unit">
                        <input
                            type="number"
                            id="startingBid"
                            name="startingBid"
                            value={formData.startingBid}
                            onChange={handleInputChange}
                            placeholder="0.0"
                            step="0.01"
                            min="0"
                            disabled={loading}
                            required
                        />
                        <span className="unit">{formData.paymentToken === ethers.ZeroAddress ? 'ETH' : 'Token'}</span>
                    </div>
                </div>

                {/* Reserve Price */}
                <div className="form-group">
                    <label htmlFor="reservePrice">Reserve Price (Minimum)</label>
                    <div className="input-with-unit">
                        <input
                            type="number"
                            id="reservePrice"
                            name="reservePrice"
                            value={formData.reservePrice}
                            onChange={handleInputChange}
                            placeholder="0.0"
                            step="0.01"
                            min="0"
                            disabled={loading}
                            required
                        />
                        <span className="unit">{formData.paymentToken === ethers.ZeroAddress ? 'ETH' : 'Token'}</span>
                    </div>
                    <small>Auction won't close unless this price is met</small>
                </div>

                {/* Duration */}
                <div className="form-group">
                    <label htmlFor="durationHours">Auction Duration</label>
                    <div className="duration-input">
                        <input
                            type="number"
                            id="durationHours"
                            name="durationHours"
                            value={formData.durationHours}
                            onChange={handleInputChange}
                            min="1"
                            max="720"
                            disabled={loading}
                        />
                        <span className="duration-label">hours</span>
                    </div>
                    <small>Ends: {new Date(Date.now() + formData.durationHours * 60 * 60 * 1000).toLocaleString()}</small>
                </div>

                {/* Payment Token */}
                <div className="form-group">
                    <label htmlFor="paymentToken">Payment Token</label>
                    <select
                        id="paymentToken"
                        name="paymentToken"
                        value={formData.paymentToken}
                        onChange={handleInputChange}
                        disabled={loading}
                    >
                        <option value={ethers.ZeroAddress}>ETH (Native)</option>
                        <option value="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48">USDC</option>
                        <option value="0xdac17f958d2ee523a2206206994597c13d831ec7">USDT</option>
                        <option value="0x6B175474E89094C44Da98b954EedeAC495271d0F">DAI</option>
                    </select>
                </div>

                {/* Auto-Extend */}
                <div className="form-group checkbox">
                    <label htmlFor="autoExtend">
                        <input
                            type="checkbox"
                            id="autoExtend"
                            name="autoExtend"
                            checked={formData.autoExtend}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                        <span>Auto-extend auction by 15 min on late bids</span>
                    </label>
                    <small>Prevents sniping by auto-extending when bids occur near end</small>
                </div>

                {/* Summary */}
                <div className="auction-summary">
                    <div className="summary-item">
                        <span className="label">Starting Bid:</span>
                        <span className="value">{formData.startingBid || '0'} {formData.paymentToken === ethers.ZeroAddress ? 'ETH' : 'Token'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Reserve Price:</span>
                        <span className="value">{formData.reservePrice || '0'} {formData.paymentToken === ethers.ZeroAddress ? 'ETH' : 'Token'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Duration:</span>
                        <span className="value">{formData.durationHours} hours</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Gas Estimate:</span>
                        <span className="value">{parseFloat(gasEstimate).toFixed(6)} ETH</span>
                    </div>
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={loading} className="submit-button">
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Creating Auction...
                        </>
                    ) : (
                        'Create Auction'
                    )}
                </button>

                {/* Info */}
                <div className="info-box">
                    <p>✓ You must own the NFT to create an auction</p>
                    <p>✓ Fees are 2.5% of final sale price</p>
                    <p>✓ You can cancel the auction before any bids</p>
                </div>
            </form>
        </div>
    );
};

export default AuctionForm;
