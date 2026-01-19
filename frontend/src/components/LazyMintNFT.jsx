// frontend/src/components/LazyMintNFT.jsx
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { uploadToIPFS } from '../services/ipfs';
import { lazyMintAPI } from '../services/api';
import './LazyMintNFT.css';

/**
 * LazyMintNFT Component
 * Allows creators to mint NFTs without deploying to blockchain
 * Signature is created off-chain, NFT mints on buyer purchase
 */
export default function LazyMintNFT() {
    const [step, setStep] = useState(1); // 1: Upload, 2: Sign, 3: Confirm
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        royaltyPercentage: 10,
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [ipfsURI, setIpfsURI] = useState('');
    const [signature, setSignature] = useState('');
    const [messageHash, setMessageHash] = useState('');
    const [nonce, setNonce] = useState(0);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle image upload
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('Image size must be less than 10MB');
                return;
            }

            setImageFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            setError('');
        }
    };

    // Step 1: Upload image to IPFS
    const handleUploadToIPFS = async () => {
        try {
            setLoading(true);
            setError('');

            if (!imageFile) {
                throw new Error('Please select an image');
            }

            if (!formData.name.trim()) {
                throw new Error('Please enter NFT name');
            }

            // Upload image to IPFS
            const imageHash = await uploadToIPFS(imageFile);

            // Create metadata JSON
            const metadata = {
                name: formData.name,
                description: formData.description,
                image: `ipfs://${imageHash}`,
                attributes: [],
            };

            // Upload metadata to IPFS
            const metadataBlob = new Blob([JSON.stringify(metadata)], {
                type: 'application/json',
            });
            const metadataFile = new File([metadataBlob], 'metadata.json');
            const metadataHash = await uploadToIPFS(metadataFile);

            const finalURI = `ipfs://${metadataHash}`;
            setIpfsURI(finalURI);

            setSuccess('Image and metadata uploaded to IPFS');
            setStep(2);
            setLoading(false);
        } catch (err) {
            console.error('Error uploading to IPFS:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    // Step 2: Sign with wallet
    const handleSign = async () => {
        try {
            setLoading(true);
            setError('');

            // Get wallet provider
            if (!window.ethereum) {
                throw new Error('MetaMask not found');
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const address = await signer.getAddress();

            // Get current nonce
            const nonceResponse = await lazyMintAPI.getCreatorNonce(address);
            const currentNonce = nonceResponse.nonce || 0;
            setNonce(currentNonce);

            // Create message to sign
            const messageHash = ethers.utils.solidityKeccak256(
                ['string', 'uint256', 'uint256'],
                [ipfsURI, formData.royaltyPercentage, currentNonce]
            );

            // Sign the message
            const sig = await signer.signMessage(
                ethers.utils.arrayify(messageHash)
            );

            setSignature(sig);
            setMessageHash(messageHash);

            setSuccess('Signature created! Your NFT is ready to sell.');
            setStep(3);
            setLoading(false);
        } catch (err) {
            console.error('Error signing:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    // Step 3: Submit to marketplace
    const handleSubmitToMarketplace = async () => {
        try {
            setLoading(true);
            setError('');

            if (!window.ethereum) {
                throw new Error('MetaMask not found');
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const creatorAddress = await signer.getAddress();

            // Submit lazy mint to backend
            const response = await lazyMintAPI.submitLazyMint({
                name: formData.name,
                description: formData.description,
                ipfsURI,
                royaltyPercentage: formData.royaltyPercentage,
                signature,
                messageHash,
                nonce,
            });

            if (response.success) {
                setSuccess(
                    `✅ NFT "${formData.name}" is now available for sale! Buyers can purchase and mint it instantly.`
                );

                // Reset form
                setTimeout(() => {
                    setStep(1);
                    setFormData({ name: '', description: '', royaltyPercentage: 10 });
                    setImageFile(null);
                    setImagePreview(null);
                    setIpfsURI('');
                    setSignature('');
                    setMessageHash('');
                }, 2000);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error submitting to marketplace:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="lazy-mint-container">
            <h2>Create NFT (Lazy Minting)</h2>
            <p className="info-text">
                ℹ️ No gas fees! Your NFT will be minted when someone buys it. You
                just need to sign once.
            </p>

            {error && <div className="error-box">{error}</div>}
            {success && <div className="success-box">{success}</div>}

            <div className="steps-container">
                {/* Step 1: Upload */}
                <div className={`step ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
                    <div className="step-header">
                        <span className="step-number">1</span>
                        <h3>Upload Image</h3>
                        {step > 1 && <span className="checkmark">✓</span>}
                    </div>

                    {step === 1 && (
                        <div className="step-content">
                            <div className="form-group">
                                <label htmlFor="name">NFT Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Digital Art #1"
                                    maxLength={100}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe your NFT..."
                                    maxLength={500}
                                    rows={4}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="image">Image File *</label>
                                <div className="image-upload">
                                    <input
                                        type="file"
                                        id="image"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                    />
                                    {imagePreview && (
                                        <div className="image-preview">
                                            <img src={imagePreview} alt="Preview" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="royalty">Royalty Percentage (0-50%)</label>
                                <input
                                    type="number"
                                    id="royalty"
                                    name="royaltyPercentage"
                                    value={formData.royaltyPercentage}
                                    onChange={handleInputChange}
                                    min={0}
                                    max={50}
                                />
                                <small>
                                    You'll earn {formData.royaltyPercentage}% on every resale
                                </small>
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handleUploadToIPFS}
                                disabled={loading}
                            >
                                {loading ? 'Uploading...' : 'Upload to IPFS'}
                            </button>
                        </div>
                    )}

                    {step > 1 && (
                        <div className="step-preview">
                            <p><strong>{formData.name}</strong></p>
                            {imagePreview && <img src={imagePreview} alt="NFT" />}
                        </div>
                    )}
                </div>

                {/* Step 2: Sign */}
                <div className={`step ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
                    <div className="step-header">
                        <span className="step-number">2</span>
                        <h3>Sign with Wallet</h3>
                        {step > 2 && <span className="checkmark">✓</span>}
                    </div>

                    {step === 2 && (
                        <div className="step-content">
                            <p>Sign the NFT metadata with your wallet. This proves you created it.</p>
                            <p className="info-text">
                                ℹ️ This is OFF-CHAIN - no blockchain transaction or gas fees!
                            </p>

                            <div className="details-box">
                                <p>
                                    <strong>Name:</strong> {formData.name}
                                </p>
                                <p>
                                    <strong>Royalty:</strong> {formData.royaltyPercentage}%
                                </p>
                                <p>
                                    <strong>IPFS URI:</strong>{' '}
                                    <code>{ipfsURI.substring(0, 40)}...</code>
                                </p>
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handleSign}
                                disabled={loading}
                            >
                                {loading ? 'Signing...' : 'Sign with MetaMask'}
                            </button>
                        </div>
                    )}

                    {step > 2 && (
                        <div className="step-preview">
                            <p>✓ Signed by wallet</p>
                        </div>
                    )}
                </div>

                {/* Step 3: Confirm */}
                <div className={`step ${step === 3 ? 'active' : ''}`}>
                    <div className="step-header">
                        <span className="step-number">3</span>
                        <h3>Publish to Marketplace</h3>
                    </div>

                    {step === 3 && (
                        <div className="step-content">
                            <p>Your NFT is ready! Publish it to the marketplace now.</p>

                            <div className="summary-box">
                                <h4>Summary</h4>
                                <p>
                                    <strong>NFT Name:</strong> {formData.name}
                                </p>
                                <p>
                                    <strong>Creator Royalty:</strong> {formData.royaltyPercentage}%
                                </p>
                                <p>
                                    <strong>Status:</strong> Ready to publish
                                </p>
                                <p className="info-text">
                                    💡 Once published, buyers can immediately purchase and mint your NFT
                                    without you needing to do anything else!
                                </p>
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handleSubmitToMarketplace}
                                disabled={loading}
                            >
                                {loading ? 'Publishing...' : '🚀 Publish to Marketplace'}
                            </button>

                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    setStep(2);
                                }}
                                disabled={loading}
                            >
                                ← Back
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
