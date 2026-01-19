/**
 * BatchMintForm Component
 * Form for uploading and configuring batch mint operations
 */

import React, { useState, useRef } from 'react';
import './BatchMintForm.css';

export default function BatchMintForm({ onSubmit, onCancel }) {
    const [uploadMethod, setUploadMethod] = useState('manual'); // manual or csv
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [autoPublish, setAutoPublish] = useState(false);
    const fileInputRef = useRef(null);

    // Handle CSV upload
    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csv = event.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

                const uploadedNFTs = [];

                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;

                    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                    const nft = {};

                    for (let j = 0; j < headers.length; j++) {
                        nft[headers[j]] = values[j] || '';
                    }

                    if (nft.name && nft.description) {
                        uploadedNFTs.push({
                            name: nft.name,
                            description: nft.description,
                            image: nft['image url'] || nft.image || '',
                            royaltyPercentage: parseInt(nft['royalty %']) || 0,
                            attributes: []
                        });
                    }
                }

                if (uploadedNFTs.length === 0) {
                    throw new Error('No valid NFTs found in CSV');
                }

                if (uploadedNFTs.length > 1000) {
                    throw new Error('Maximum 1000 NFTs per batch');
                }

                setNfts(uploadedNFTs);
                setError('');
                setSuccess(`${uploadedNFTs.length} NFTs loaded from CSV`);
            } catch (err) {
                setError(err.message);
            }
        };

        reader.readAsText(file);
    };

    // Handle manual NFT addition
    const addManualNFT = () => {
        if (nfts.length >= 1000) {
            setError('Maximum 1000 NFTs per batch');
            return;
        }

        setNfts([...nfts, {
            name: '',
            description: '',
            image: '',
            royaltyPercentage: 0,
            attributes: []
        }]);
    };

    // Handle NFT field change
    const handleNFTChange = (index, field, value) => {
        const updatedNFTs = [...nfts];
        updatedNFTs[index][field] = value;
        setNfts(updatedNFTs);
    };

    // Remove NFT
    const removeNFT = (index) => {
        setNfts(nfts.filter((_, i) => i !== index));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (nfts.length === 0) {
            setError('Add at least one NFT');
            return;
        }

        // Validate all NFTs
        for (let i = 0; i < nfts.length; i++) {
            if (!nfts[i].name || !nfts[i].description) {
                setError(`NFT ${i + 1}: Name and description required`);
                return;
            }
        }

        setLoading(true);
        setError('');

        try {
            await onSubmit({
                nfts,
                autoPublish
            });

            setSuccess('Batch mint created successfully!');
            setTimeout(() => {
                setNfts([]);
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to create batch mint');
        } finally {
            setLoading(false);
        }
    };

    // Download template
    const downloadTemplate = async () => {
        try {
            const response = await fetch('/api/batch-mint/template');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'batch-template.csv';
            a.click();
        } catch (err) {
            setError('Failed to download template');
        }
    };

    return (
        <div className="batch-mint-form">
            <div className="form-container">
                <div className="form-header">
                    <h2>Batch Mint NFTs</h2>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {/* Upload Method Selection */}
                <div className="upload-method-selector">
                    <div className="method-option">
                        <input
                            type="radio"
                            id="manual"
                            name="method"
                            value="manual"
                            checked={uploadMethod === 'manual'}
                            onChange={(e) => setUploadMethod(e.target.value)}
                        />
                        <label htmlFor="manual">Manual Entry</label>
                    </div>
                    <div className="method-option">
                        <input
                            type="radio"
                            id="csv"
                            name="method"
                            value="csv"
                            checked={uploadMethod === 'csv'}
                            onChange={(e) => setUploadMethod(e.target.value)}
                        />
                        <label htmlFor="csv">CSV Upload</label>
                    </div>
                </div>

                {/* CSV Upload */}
                {uploadMethod === 'csv' && (
                    <div className="csv-upload-section">
                        <div className="csv-info">
                            <p>Upload a CSV file with your NFT data</p>
                            <button type="button" className="download-template-btn" onClick={downloadTemplate}>
                                📥 Download Template
                            </button>
                        </div>

                        <div className="file-input-wrapper">
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".csv"
                                onChange={handleCSVUpload}
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                className="file-upload-btn"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                📁 Choose CSV File
                            </button>
                        </div>
                    </div>
                )}

                {/* Manual Entry */}
                {uploadMethod === 'manual' && (
                    <button type="button" className="add-nft-btn" onClick={addManualNFT}>
                        + Add NFT ({nfts.length}/1000)
                    </button>
                )}

                {/* NFT List */}
                {nfts.length > 0 && (
                    <div className="nfts-list">
                        <h3>NFTs to Mint ({nfts.length})</h3>

                        <div className="nfts-grid">
                            {nfts.map((nft, idx) => (
                                <div key={idx} className="nft-item">
                                    <div className="nft-index">#{idx + 1}</div>

                                    <div className="nft-fields">
                                        <input
                                            type="text"
                                            placeholder="NFT Name"
                                            value={nft.name}
                                            onChange={(e) => handleNFTChange(idx, 'name', e.target.value)}
                                            maxLength={100}
                                        />

                                        <textarea
                                            placeholder="Description"
                                            value={nft.description}
                                            onChange={(e) => handleNFTChange(idx, 'description', e.target.value)}
                                            maxLength={500}
                                            rows={2}
                                        />

                                        <input
                                            type="url"
                                            placeholder="Image URL"
                                            value={nft.image}
                                            onChange={(e) => handleNFTChange(idx, 'image', e.target.value)}
                                        />

                                        <div className="royalty-input">
                                            <label>Royalty %</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={nft.royaltyPercentage}
                                                onChange={(e) => handleNFTChange(idx, 'royaltyPercentage', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="remove-nft-btn"
                                        onClick={() => removeNFT(idx)}
                                        title="Remove NFT"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Options */}
                {nfts.length > 0 && (
                    <div className="options-section">
                        <div className="option-item">
                            <input
                                type="checkbox"
                                id="autoPublish"
                                checked={autoPublish}
                                onChange={(e) => setAutoPublish(e.target.checked)}
                            />
                            <label htmlFor="autoPublish">
                                Auto-publish NFTs after minting
                            </label>
                        </div>
                    </div>
                )}

                {/* Form Actions */}
                <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading || nfts.length === 0}
                        onClick={handleSubmit}
                    >
                        {loading ? 'Creating Batch...' : `Create Batch (${nfts.length} NFTs)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
