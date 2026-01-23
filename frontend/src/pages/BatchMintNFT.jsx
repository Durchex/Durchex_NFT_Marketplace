import React, { useState } from 'react';
import Header from '../components/Header';
import BatchMintForm from '../components/BatchMint/BatchMintForm';
import { batchMintAPI } from '../services/api';

/**
 * BatchMintNFT - Batch minting page for multiple NFTs at once
 * Wraps the functional component with Header for global display
 */
const BatchMintNFT = () => {
  const [showForm, setShowForm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleBatchSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const result = await batchMintAPI.createBatch(data);
      
      if (result.message) {
        setSuccess(result.message);
        // Optionally close form or redirect after success
        setTimeout(() => {
          setShowForm(false);
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create batch mint');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <section className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Batch Mint NFTs</h1>
            <p className="text-gray-400">Mint multiple NFTs at once to save time and gas costs</p>
          </section>

          {showForm ? (
            <BatchMintForm 
              onSubmit={handleBatchSubmit}
              onCancel={handleCancel}
            />
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400 mb-4">Batch mint form closed</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded font-semibold"
              >
                Create New Batch
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-900/30 border border-green-700 rounded-lg p-4 text-green-300">
              {success}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BatchMintNFT;
