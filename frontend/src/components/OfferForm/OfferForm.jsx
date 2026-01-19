/**
 * OfferForm Component
 * Create and manage offers on NFTs
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './OfferForm.css';

const OfferForm = ({ nftContract, tokenId, seller, onOfferCreated }) => {
    const [formData, setFormData] = useState({
        offerAmount: '',
        paymentToken: ethers.ZeroAddress,
        durationDays: 7
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userBalance, setUserBalance] = useState('0');
    const [gasEstimate, setGasEstimate] = useState('0');

    // Fetch user balance on component mount
    useEffect(() => {
        const fetchUserBalance = async () => {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const userAddress = await signer.getAddress();

                if (formData.paymentToken === ethers.ZeroAddress) {
                    // ETH balance
                    const balance = await provider.getBalance(userAddress);
                    setUserBalance(ethers.formatEther(balance));
                } else {
                    // ERC20 balance
                    const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];
                    const tokenContract = new ethers.Contract(
                        formData.paymentToken,
                        ERC20_ABI,
                        provider
                    );
                    const balance = await tokenContract.balanceOf(userAddress);
                    setUserBalance(ethers.formatEther(balance));
                }
            } catch (err) {
                console.error('Failed to fetch balance:', err);
            }
        };

        fetchUserBalance();
    }, [formData.paymentToken]);

    // Estimate gas on amount change
    useEffect(() => {
        const estimateGas = async () => {
            try {
                // Rough estimate: ~100k gas for offer creation
                const provider = new ethers.BrowserProvider(window.ethereum);
                const gasPrice = await provider.getGasPrice();
                const estimatedGas = ethers.parseUnits('100000', 'wei');
                const gasCost = (estimatedGas * gasPrice) / BigInt(1e18);
                
                setGasEstimate(ethers.formatEther(gasCost));
            } catch (err) {
                console.error('Failed to estimate gas:', err);
            }
        };

        estimateGas();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const validateForm = () => {
        if (!formData.offerAmount || parseFloat(formData.offerAmount) <= 0) {
            setError('Please enter a valid offer amount');
            return false;
        }

        if (parseFloat(formData.offerAmount) > parseFloat(userBalance)) {
            setError('Insufficient balance for this offer');
            return false;
        }

        if (formData.durationDays < 1 || formData.durationDays > 365) {
            setError('Duration must be between 1 and 365 days');
            return false;
        }

        return true;
    };

    const handleCreateOffer = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();

            // Prepare offer data
            const offerData = {
                nftContract,
                tokenId,
                seller,
                buyer: userAddress,
                offerAmount: ethers.parseEther(formData.offerAmount).toString(),
                paymentToken: formData.paymentToken,
                durationDays: parseInt(formData.durationDays)
            };

            // Send to backend for creation
            const response = await fetch('/api/offers/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await signer.signMessage('Durchex NFT Marketplace')}`
                },
                body: JSON.stringify(offerData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create offer');
            }

            setSuccess('Offer created successfully!');
            setFormData({
                offerAmount: '',
                paymentToken: ethers.ZeroAddress,
                durationDays: 7
            });

            if (onOfferCreated) {
                onOfferCreated(result.data);
            }

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error('Failed to create offer:', err);
            setError(err.message || 'Failed to create offer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="offer-form-container">
            <h2>Make an Offer</h2>
            
            <form onSubmit={handleCreateOffer} className="offer-form">
                {/* Error Message */}
                {error && <div className="error-message">{error}</div>}
                
                {/* Success Message */}
                {success && <div className="success-message">{success}</div>}

                {/* NFT Info */}
                <div className="nft-info">
                    <div className="info-item">
                        <span className="label">NFT Contract:</span>
                        <span className="value">{nftContract.slice(0, 6)}...{nftContract.slice(-4)}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Token ID:</span>
                        <span className="value">{tokenId}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Seller:</span>
                        <span className="value">{seller.slice(0, 6)}...{seller.slice(-4)}</span>
                    </div>
                </div>

                {/* Offer Amount */}
                <div className="form-group">
                    <label htmlFor="offerAmount">Offer Amount</label>
                    <div className="input-with-unit">
                        <input
                            type="number"
                            id="offerAmount"
                            name="offerAmount"
                            value={formData.offerAmount}
                            onChange={handleInputChange}
                            placeholder="0.0"
                            step="0.01"
                            min="0"
                            disabled={loading}
                            required
                        />
                        <span className="unit">
                            {formData.paymentToken === ethers.ZeroAddress ? 'ETH' : 'Token'}
                        </span>
                    </div>
                    <small className="balance-info">
                        Your balance: {parseFloat(userBalance).toFixed(4)} {formData.paymentToken === ethers.ZeroAddress ? 'ETH' : 'Tokens'}
                    </small>
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
                    <small>Choose payment method for your offer</small>
                </div>

                {/* Duration */}
                <div className="form-group">
                    <label htmlFor="durationDays">Offer Duration (Days)</label>
                    <div className="duration-input">
                        <input
                            type="number"
                            id="durationDays"
                            name="durationDays"
                            value={formData.durationDays}
                            onChange={handleInputChange}
                            min="1"
                            max="365"
                            disabled={loading}
                        />
                        <span className="days-label">days</span>
                    </div>
                    <small>Expires: {new Date(Date.now() + formData.durationDays * 24 * 60 * 60 * 1000).toLocaleDateString()}</small>
                </div>

                {/* Cost Summary */}
                <div className="cost-summary">
                    <div className="summary-item">
                        <span className="label">Offer Amount:</span>
                        <span className="value">
                            {formData.offerAmount ? parseFloat(formData.offerAmount).toFixed(4) : '0'} {formData.paymentToken === ethers.ZeroAddress ? 'ETH' : 'Token'}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Platform Fee (2.5%):</span>
                        <span className="value">
                            {formData.offerAmount ? (parseFloat(formData.offerAmount) * 0.025).toFixed(4) : '0'} {formData.paymentToken === ethers.ZeroAddress ? 'ETH' : 'Token'}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Gas Estimate:</span>
                        <span className="value">{parseFloat(gasEstimate).toFixed(6)} ETH</span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-total">
                        <span className="label">Total Cost:</span>
                        <span className="value">
                            {formData.offerAmount ? (
                                parseFloat(formData.offerAmount) * 1.025 + parseFloat(gasEstimate)
                            ).toFixed(6) : '0'} ETH
                        </span>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="submit-button"
                >
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Creating Offer...
                        </>
                    ) : (
                        'Create Offer'
                    )}
                </button>

                {/* Helper Text */}
                <div className="helper-text">
                    <p>
                        ✓ Your offer will be held in escrow until the seller accepts or rejects it
                    </p>
                    <p>
                        ✓ You can increase your offer or cancel it anytime before expiration
                    </p>
                    <p>
                        ✓ The seller can make a counter-offer with a different price
                    </p>
                </div>
            </form>
        </div>
    );
};

export default OfferForm;
