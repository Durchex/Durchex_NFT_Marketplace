/**
 * BidInterface Component
 * Place and manage bids on active auctions
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './BidInterface.css';

const BidInterface = ({ auctionId, currentBid, highestBidder, minimumBid, onBidPlaced, disabled = false }) => {
    const [bidAmount, setBidAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userBalance, setUserBalance] = useState('0');
    const [gasEstimate, setGasEstimate] = useState('0');
    const [isHighestBidder, setIsHighestBidder] = useState(false);
    const [bidHistory, setBidHistory] = useState([]);

    // Fetch user data and bid history
    useEffect(() => {
        const fetchData = async () => {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const userAddress = await signer.getAddress();

                // Check if user is highest bidder
                setIsHighestBidder(userAddress.toLowerCase() === highestBidder?.toLowerCase());

                // Fetch ETH balance
                const balance = await provider.getBalance(userAddress);
                setUserBalance(ethers.formatEther(balance));

                // Estimate gas for bid
                const gasPrice = await provider.getGasPrice();
                const estimatedGas = ethers.parseUnits('100000', 'wei');
                const gasCost = (estimatedGas * gasPrice) / BigInt(1e18);
                setGasEstimate(ethers.formatEther(gasCost));

                // TODO: Fetch bid history from API
                setBidHistory([]);
            } catch (err) {
                console.error('Failed to fetch data:', err);
            }
        };

        fetchData();
    }, [highestBidder]);

    const handleBidChange = (e) => {
        setBidAmount(e.target.value);
        setError('');
    };

    const validateBid = () => {
        const bid = parseFloat(bidAmount);

        if (!bidAmount || bid <= 0) {
            setError('Please enter a valid bid amount');
            return false;
        }

        if (bid < minimumBid) {
            setError(`Bid must be at least ${minimumBid.toFixed(4)} ETH`);
            return false;
        }

        if (bid > parseFloat(userBalance)) {
            setError('Insufficient balance for this bid');
            return false;
        }

        return true;
    };

    const handlePlaceBid = async (e) => {
        e.preventDefault();

        if (!validateBid()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const bidData = {
                auctionId,
                bidAmount: ethers.parseEther(bidAmount).toString()
            };

            const response = await fetch('/api/auctions/' + auctionId + '/bid', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await signer.signMessage('Durchex NFT Marketplace')}`
                },
                body: JSON.stringify(bidData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to place bid');
            }

            setSuccess(`Bid placed successfully for ${bidAmount} ETH!`);
            setBidAmount('');

            if (onBidPlaced) {
                onBidPlaced(result.data);
            }

            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error('Failed to place bid:', err);
            setError(err.message || 'Failed to place bid');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bid-interface-container">
            <div className="bid-form">
                <h3>Place Your Bid</h3>

                {/* Messages */}
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {/* Current Status */}
                <div className="bid-status">
                    <div className="status-item">
                        <span className="label">Current Bid:</span>
                        <span className="value">{parseFloat(currentBid || 0).toFixed(4)} ETH</span>
                    </div>
                    <div className="status-item">
                        <span className="label">Minimum Bid:</span>
                        <span className="value">{minimumBid.toFixed(4)} ETH</span>
                    </div>
                    {isHighestBidder && (
                        <div className="status-item highlight">
                            <span className="label">✓ You're the highest bidder</span>
                        </div>
                    )}
                </div>

                {/* Bid Input */}
                <form onSubmit={handlePlaceBid} className="bid-form-inner">
                    <div className="form-group">
                        <label htmlFor="bidAmount">Your Bid Amount (ETH)</label>
                        <input
                            type="number"
                            id="bidAmount"
                            value={bidAmount}
                            onChange={handleBidChange}
                            placeholder={minimumBid.toFixed(4)}
                            step="0.01"
                            min={minimumBid}
                            disabled={loading || disabled}
                            required
                        />
                        <small>Available balance: {parseFloat(userBalance).toFixed(4)} ETH</small>
                    </div>

                    {/* Bid Summary */}
                    <div className="bid-summary">
                        <div className="summary-item">
                            <span>Bid Amount:</span>
                            <span>{bidAmount ? parseFloat(bidAmount).toFixed(4) : '0'} ETH</span>
                        </div>
                        <div className="summary-item">
                            <span>Platform Fee (2.5%):</span>
                            <span>{bidAmount ? (parseFloat(bidAmount) * 0.025).toFixed(4) : '0'} ETH</span>
                        </div>
                        <div className="summary-item">
                            <span>Gas Estimate:</span>
                            <span>{parseFloat(gasEstimate).toFixed(6)} ETH</span>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-total">
                            <span>Total Cost:</span>
                            <span>
                                {bidAmount
                                    ? (parseFloat(bidAmount) * 1.025 + parseFloat(gasEstimate)).toFixed(6)
                                    : '0'} ETH
                            </span>
                        </div>
                    </div>

                    {/* Place Bid Button */}
                    <button
                        type="submit"
                        disabled={loading || disabled}
                        className="place-bid-button"
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Placing Bid...
                            </>
                        ) : (
                            'Place Bid'
                        )}
                    </button>
                </form>

                {/* Info */}
                <div className="info-box">
                    <p>✓ Your bid is locked until the auction ends</p>
                    <p>✓ You'll be refunded if outbid by another user</p>
                    <p>✓ Late bids trigger a 15-minute extension</p>
                </div>
            </div>

            {/* Bid History */}
            {bidHistory.length > 0 && (
                <div className="bid-history">
                    <h4>Bid History</h4>
                    <div className="history-list">
                        {bidHistory.map((bid, index) => (
                            <div key={index} className="history-item">
                                <div className="item-info">
                                    <span className="bidder">{bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}</span>
                                    <span className="time">{new Date(bid.timestamp).toLocaleString()}</span>
                                </div>
                                <span className="amount">{parseFloat(bid.amount).toFixed(4)} ETH</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BidInterface;
