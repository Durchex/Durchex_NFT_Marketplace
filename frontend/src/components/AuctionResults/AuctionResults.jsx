/**
 * AuctionResults Component
 * Display auction winner and results
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './AuctionResults.css';

const AuctionResults = ({ auctionId, status, winner, finalBid, nftDetails, onClaim, onSettle }) => {
    const [userAddress, setUserAddress] = useState('');
    const [isWinner, setIsWinner] = useState(false);
    const [isSeller, setIsSeller] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [gasEstimate, setGasEstimate] = useState('0');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                setUserAddress(address);

                setIsWinner(address.toLowerCase() === winner?.toLowerCase());
                setIsSeller(address.toLowerCase() === nftDetails?.owner?.toLowerCase());

                // Estimate gas for claiming
                const gasPrice = await provider.getGasPrice();
                const estimatedGas = ethers.parseUnits('80000', 'wei');
                const gasCost = (estimatedGas * gasPrice) / BigInt(1e18);
                setGasEstimate(ethers.formatEther(gasCost));
            } catch (err) {
                console.error('Failed to fetch user data:', err);
            }
        };

        fetchUserData();
    }, [winner, nftDetails]);

    const handleClaim = async () => {
        setLoading(true);
        setError('');

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const response = await fetch(`/api/auctions/${auctionId}/claim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await signer.signMessage('Durchex NFT Marketplace')}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to claim NFT');
            }

            setClaimed(true);
            if (onClaim) {
                onClaim(result.data);
            }
        } catch (err) {
            console.error('Failed to claim:', err);
            setError(err.message || 'Failed to claim NFT');
        } finally {
            setLoading(false);
        }
    };

    const handleSettle = async () => {
        setLoading(true);
        setError('');

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const response = await fetch(`/api/auctions/${auctionId}/settle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await signer.signMessage('Durchex NFT Marketplace')}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to settle auction');
            }

            if (onSettle) {
                onSettle(result.data);
            }
        } catch (err) {
            console.error('Failed to settle:', err);
            setError(err.message || 'Failed to settle auction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auction-results-container">
            {/* Status Header */}
            <div className={`results-header ${status}`}>
                <div className="status-icon">
                    {status === 'settled' && '✓'}
                    {status === 'ended' && '•'}
                    {status === 'cancelled' && '✕'}
                </div>
                <div className="header-text">
                    <h2>
                        {status === 'settled' && 'Auction Settled'}
                        {status === 'ended' && 'Auction Ended'}
                        {status === 'cancelled' && 'Auction Cancelled'}
                    </h2>
                    <p>
                        {status === 'settled' && 'NFT transfer completed'}
                        {status === 'ended' && 'Waiting for settlement'}
                        {status === 'cancelled' && 'This auction was cancelled'}
                    </p>
                </div>
            </div>

            {/* Results Grid */}
            <div className="results-grid">
                {/* Winner Information */}
                {winner && status !== 'cancelled' && (
                    <div className="result-card">
                        <h3>Winner</h3>
                        <div className="result-content">
                            <div className="result-item">
                                <span className="label">Address:</span>
                                <span className="value">
                                    {winner.slice(0, 6)}...{winner.slice(-4)}
                                </span>
                            </div>
                            <div className="result-item highlight">
                                <span className="label">Final Bid:</span>
                                <span className="value">{parseFloat(finalBid || 0).toFixed(4)} ETH</span>
                            </div>
                            {isWinner && (
                                <div className="badge winner">You're the winner!</div>
                            )}
                        </div>
                    </div>
                )}

                {/* NFT Details */}
                {nftDetails && (
                    <div className="result-card">
                        <h3>NFT Details</h3>
                        <div className="result-content">
                            <div className="result-item">
                                <span className="label">Name:</span>
                                <span className="value">{nftDetails.name}</span>
                            </div>
                            <div className="result-item">
                                <span className="label">Collection:</span>
                                <span className="value">
                                    {nftDetails.collection?.slice(0, 6)}...{nftDetails.collection?.slice(-4)}
                                </span>
                            </div>
                            <div className="result-item">
                                <span className="label">Token ID:</span>
                                <span className="value">{nftDetails.tokenId}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Fee Breakdown */}
            <div className="fee-breakdown">
                <h3>Transaction Summary</h3>
                <div className="breakdown-items">
                    <div className="breakdown-item">
                        <span className="label">Final Bid Amount:</span>
                        <span className="value">{parseFloat(finalBid || 0).toFixed(4)} ETH</span>
                    </div>
                    <div className="breakdown-item">
                        <span className="label">Platform Fee (2.5%):</span>
                        <span className="value">{(parseFloat(finalBid || 0) * 0.025).toFixed(4)} ETH</span>
                    </div>
                    <div className="breakdown-item">
                        <span className="label">Creator Royalties (varies):</span>
                        <span className="value">{(parseFloat(finalBid || 0) * 0.05).toFixed(4)} ETH</span>
                    </div>
                    <div className="breakdown-divider"></div>
                    <div className="breakdown-item total">
                        <span className="label">Seller Receives:</span>
                        <span className="value">{(parseFloat(finalBid || 0) * 0.925).toFixed(4)} ETH</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="actions-section">
                {isWinner && status === 'ended' && !claimed && (
                    <div className="action-card">
                        <h4>Claim Your NFT</h4>
                        <p>You have won the auction. Please claim your NFT to complete the transaction.</p>
                        <div className="gas-info">
                            <span>Estimated gas: {parseFloat(gasEstimate).toFixed(6)} ETH</span>
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <button
                            onClick={handleClaim}
                            disabled={loading}
                            className="action-button claim"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Claiming...
                                </>
                            ) : (
                                'Claim NFT'
                            )}
                        </button>
                    </div>
                )}

                {claimed && (
                    <div className="success-card">
                        <span className="check">✓</span>
                        <p>NFT successfully claimed!</p>
                        <small>Your NFT has been transferred to your wallet</small>
                    </div>
                )}

                {isSeller && status === 'ended' && (
                    <div className="action-card">
                        <h4>Settle Auction</h4>
                        <p>Complete the auction to transfer the NFT and receive payment.</p>
                        {error && <div className="error-message">{error}</div>}
                        <button
                            onClick={handleSettle}
                            disabled={loading}
                            className="action-button settle"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Settling...
                                </>
                            ) : (
                                'Settle Auction'
                            )}
                        </button>
                    </div>
                )}

                {status === 'cancelled' && (
                    <div className="cancelled-card">
                        <span className="x">✕</span>
                        <p>This auction was cancelled by the seller</p>
                        <small>No bids were processed. All funds have been refunded.</small>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="info-box">
                <p>
                    {isWinner && status === 'ended' && '✓ Your bid is locked in escrow and protected until you claim your NFT'}
                    {isSeller && status === 'ended' && '✓ Settlement will transfer the NFT to the winner and process your payment'}
                    {status === 'settled' && '✓ This auction has been fully settled'}
                    {status === 'cancelled' && '✓ This auction was cancelled - no fees were charged'}
                </p>
            </div>
        </div>
    );
};

export default AuctionResults;
