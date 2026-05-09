import { useContext, useState, useEffect, useMemo } from "react";
import { ICOContent } from "../Context";
import { Toaster, toast } from "react-hot-toast";
import { nftAPI } from "../services/api";
import { uploadToIPFS, uploadMetadataToIPFS } from "../services/ipfs";
import { SUPPORTED_NETWORKS } from "../Context/constants";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ACCEPTED_FILE_PREFIXES = ["image/", "video/", "audio/"];
const ACCEPTED_FILE_EXTENSIONS = [".glb", ".gltf", ".fbx", ".stl", ".zip", ".obj"];

const cardStyle = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '22px',
  padding: 'clamp(16px, 3.5vw, 24px)',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.35)',
};

const fieldStyle = {
  width: '100%',
  border: '1px solid #475569',
  borderRadius: '14px',
  padding: '14px 16px',
  fontSize: '1rem',
  background: '#111827',
  color: '#e2e8f0',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontWeight: 600,
  marginBottom: '10px',
  color: '#cbd5e1',
};

// Auto-wrapping grids — collapse to one column when there isn't room for the minimum.
const twoColGrid = {
  display: 'grid',
  gap: '12px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
  alignItems: 'flex-end',
};

const threeColGrid = {
  display: 'grid',
  gap: '12px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))',
  alignItems: 'flex-end',
};

function isValidUploadFile(file) {
  if (!file) return false;
  const name = (file.name || '').toLowerCase();
  if (ACCEPTED_FILE_PREFIXES.some((prefix) => file.type.startsWith(prefix))) {
    return true;
  }
  return ACCEPTED_FILE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(1)} ${units[index]}`;
}

function validateUrl(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch (error) {
    return false;
  }
}

export default function CreateNFTForm() {
  const { address, selectedChain, connectWallet } = useContext(ICOContent);

  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [uploadingCollection, setUploadingCollection] = useState(false);

  const [form, setForm] = useState({
    file: null,
    filePreview: '',
    name: '',
    externalUrl: '',
    description: '',
    category: 'Art',
    price: '',
    properties: [{ type: '', value: '' }],
    levels: [{ name: 'Strength', value: '80', max: '100' }],
    stats: [{ name: 'Power', value: '250' }],
    unlockableEnabled: false,
    unlockableContent: '',
    explicitContent: false,
    supply: 1,
    network: selectedChain || 'polygon',
  });

  const NFT_CATEGORIES = ['Art', 'Collectibles', 'Music', 'Photography', 'Sports', 'Trading Cards', 'Utility', 'Virtual Worlds'];

  const [errors, setErrors] = useState({});
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Show every supported network. Non-EVM networks (Tezos, Solana) won't deploy
  // an EVM contract, so the deployContract path falls back to off-chain save.
  const networkOptions = SUPPORTED_NETWORKS.map((network) => ({
    value: network.id,
    label: network.name,
    isEVM: network.isEVM,
  }));

  useEffect(() => {
    if (selectedChain) {
      setForm((prev) => ({ ...prev, network: selectedChain }));
    }
  }, [selectedChain]);

  useEffect(() => {
    fetchCollections(address, form.network);
    // Reset selection if it no longer belongs to the current network/user.
    setSelectedCollection('');
  }, [address, form.network]);

  useEffect(() => {
    return () => {
      if (form.filePreview) {
        URL.revokeObjectURL(form.filePreview);
      }
    };
  }, [form.filePreview]);

  const fetchCollections = async (wallet, network) => {
    if (!wallet) {
      // No connected wallet — no collections to show.
      setCollections([]);
      return;
    }
    try {
      const data = await nftAPI.getUserCollections(wallet);
      const list = Array.isArray(data) ? data : (data?.collections || []);
      // Show only collections that belong to the selected network.
      const filtered = network
        ? list.filter((c) => !c.network || c.network === network)
        : list;
      setCollections(filtered);
    } catch (error) {
      console.error('Failed to fetch user collections:', error);
      setCollections([]);
    }
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleFileChange = (file) => {
    if (!file) return;
    if (!isValidUploadFile(file)) {
      setErrors((prev) => ({ ...prev, file: 'Must be an image, video, audio, or supported 3D file.' }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, file: `File size must be 100MB or less; current size ${formatBytes(file.size)}.` }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({
      ...prev,
      file,
      filePreview: previewUrl,
    }));
    setErrors((prev) => ({ ...prev, file: '' }));
  };

  const handleFileInput = (event) => {
    const file = event.target.files?.[0];
    handleFileChange(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    handleFileChange(file);
  };

  const handleCollectionCreate = async () => {
    if (!address) {
      toast.error('Please connect your wallet before creating a collection.');
      return null;
    }
    if (!newCollectionName.trim()) {
      setErrors((prev) => ({ ...prev, newCollectionName: 'Collection name is required.' }));
      return null;
    }

    setUploadingCollection(true);
    try {
      const payload = {
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim(),
        network: form.network,
        creatorWallet: address,
        creator: address,
      };
      const response = await nftAPI.createCollection(payload);
      const collection = response.collection || response;
      const value = collection.collectionId || collection._id || '';
      if (value) {
        setCollections((prev) => [collection, ...prev]);
        setSelectedCollection(value);
        setShowNewCollectionForm(false);
        setNewCollectionName('');
        setNewCollectionDescription('');
        toast.success('Collection created. You can now mint to this collection.');
        return value;
      }
      return null;
    } catch (error) {
      console.error('Create collection failed:', error);
      toast.error(error.message || 'Unable to create collection.');
      return null;
    } finally {
      setUploadingCollection(false);
    }
  };

  const handlePropertyChange = (index, field, value) => {
    setForm((prev) => {
      const nextProperties = [...prev.properties];
      nextProperties[index] = { ...nextProperties[index], [field]: value };
      return { ...prev, properties: nextProperties };
    });
  };

  const handleLevelChange = (index, field, value) => {
    setForm((prev) => {
      const nextLevels = [...prev.levels];
      nextLevels[index] = { ...nextLevels[index], [field]: value };
      return { ...prev, levels: nextLevels };
    });
  };

  const handleStatChange = (index, field, value) => {
    setForm((prev) => {
      const nextStats = [...prev.stats];
      nextStats[index] = { ...nextStats[index], [field]: value };
      return { ...prev, stats: nextStats };
    });
  };

  const addProperty = () => {
    setForm((prev) => ({ ...prev, properties: [...prev.properties, { type: '', value: '' }] }));
  };

  const removeProperty = (index) => {
    setForm((prev) => ({ ...prev, properties: prev.properties.filter((_, i) => i !== index) }));
  };

  const addLevel = () => {
    setForm((prev) => ({ ...prev, levels: [...prev.levels, { name: '', value: '0', max: '100' }] }));
  };

  const removeLevel = (index) => {
    setForm((prev) => ({ ...prev, levels: prev.levels.filter((_, i) => i !== index) }));
  };

  const addStat = () => {
    setForm((prev) => ({ ...prev, stats: [...prev.stats, { name: '', value: '0' }] }));
  };

  const removeStat = (index) => {
    setForm((prev) => ({ ...prev, stats: prev.stats.filter((_, i) => i !== index) }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.file) {
      nextErrors.file = 'A media file is required.';
    }
    if (!form.name.trim()) {
      nextErrors.name = 'Name is required.';
    }
    if (form.externalUrl && !validateUrl(form.externalUrl.trim())) {
      nextErrors.externalUrl = 'External URL must be a valid http or https link.';
    }
    if (!selectedCollection && !showNewCollectionForm) {
      nextErrors.collection = 'Select an existing collection or create a new one.';
    }
    if (showNewCollectionForm && !newCollectionName.trim()) {
      nextErrors.newCollectionName = 'Name is required for the new collection.';
    }
    if (form.unlockableEnabled && !form.unlockableContent.trim()) {
      nextErrors.unlockableContent = 'Unlockable content is required when enabled.';
    }
    if (!form.supply || Number(form.supply) < 1) {
      nextErrors.supply = 'Supply must be at least 1.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getMetadataForPreview = useMemo(() => {
    return {
      name: form.name.trim() || 'My NFT Name',
      description: form.description.trim() || 'NFT description goes here.',
      image: form.filePreview || 'Preview will appear after upload',
      external_url: form.externalUrl.trim() || undefined,
      attributes: form.properties.filter((item) => item.type.trim() || item.value.trim()).map((item) => ({ trait_type: item.type.trim(), value: item.value.trim() })),
      levels: form.levels.filter((item) => item.name.trim()).map((item) => ({ name: item.name.trim(), value: Number(item.value) || 0, max: Number(item.max) || 0 })),
      stats: form.stats.filter((item) => item.name.trim()).map((item) => ({ name: item.name.trim(), value: Number(item.value) || 0 })),
      unlockable_content: form.unlockableEnabled ? form.unlockableContent.trim() : undefined,
      explicit_content: form.explicitContent,
      supply: Number(form.supply),
      blockchain: form.network,
    };
  }, [form]);

  const buildMetadataForMint = (fileCID) => {
    return {
      name: form.name.trim(),
      description: form.description.trim(),
      image: `ipfs://${fileCID}`,
      external_url: form.externalUrl.trim() || undefined,
      attributes: form.properties.filter((item) => item.type.trim() || item.value.trim()).map((item) => ({ trait_type: item.type.trim(), value: item.value.trim() })),
      levels: form.levels.filter((item) => item.name.trim()).map((item) => ({ name: item.name.trim(), value: Number(item.value) || 0, max: Number(item.max) || 0 })),
      stats: form.stats.filter((item) => item.name.trim()).map((item) => ({ name: item.name.trim(), value: Number(item.value) || 0 })),
      unlockable_content: form.unlockableEnabled ? form.unlockableContent.trim() : undefined,
      explicit_content: form.explicitContent,
      supply: Number(form.supply),
      external_url: form.externalUrl.trim() || undefined,
      blockchain: form.network,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setSuccessMessage('');
    if (!validateForm()) {
      return;
    }

    if (!address) {
      try {
        await connectWallet?.('metamask');
      } catch (connectError) {
        setSubmitError('Please connect your wallet before submitting.');
        return;
      }
    }

    setSubmitting(true);
    try {
      let collectionId = selectedCollection;

      if (showNewCollectionForm) {
        const createdCollectionId = await handleCollectionCreate();
        collectionId = createdCollectionId || selectedCollection;
      }

      if (!collectionId) {
        throw new Error('Please choose or create a collection before minting.');
      }

      setFileUploadProgress(0);
      const fileCID = await uploadToIPFS(form.file, (progressEvent) => {
        if (progressEvent?.loaded && progressEvent?.total) {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setFileUploadProgress(progress);
        }
      });

      const metadata = buildMetadataForMint(fileCID);
      const metadataCID = await uploadMetadataToIPFS(metadata);
      const metadataURI = `ipfs://${metadataCID}`;
      const imageURI = `ipfs://${fileCID}`;

      // For unminted drafts the chain hasn't issued a tokenId yet — generate
      // a unique itemId so the Mongoose required check passes. Once the
      // collection contract deploys, mintNFT will fill in tokenId.
      const generateId = () =>
        (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? `draft-${crypto.randomUUID()}`
          : `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const priceString = String(form.price ?? '').trim() || '0';
      const isListed = priceString !== '0' && Number(priceString) > 0;

      const nftPayload = {
        // Required by nftModel.js
        itemId: generateId(),
        name: form.name.trim(),
        description: form.description.trim(),
        image: imageURI,
        category: form.category || 'Art',
        owner: address,
        seller: address,
        price: priceString,
        currentlyListed: isListed,
        network: form.network,
        properties: {
          attributes: metadata.attributes,
          levels: metadata.levels,
          stats: metadata.stats,
        },
        // Optional / extra context
        creator: address,
        collection: collectionId,
        metadataURI,
        supply: Number(form.supply),
        attributes: metadata.attributes,
        levels: metadata.levels,
        stats: metadata.stats,
        unlockableContent: form.unlockableEnabled ? form.unlockableContent.trim() : undefined,
        explicitContent: form.explicitContent,
        external_url: form.externalUrl.trim() || undefined,
        blockchain: form.network,
        deployContract: true,
      };

      let createResult;
      try {
        createResult = await nftAPI.createNft(nftPayload);
      } catch (error) {
        const message = error.message || String(error);
        if (message.includes('Collection contract not found') || message.includes('not deployed')) {
          createResult = await nftAPI.createNft({ ...nftPayload, deployContract: false });
          toast.success('NFT saved to the database. Minting will complete once the collection contract is deployed.');
        } else {
          throw error;
        }
      }

      const mintedId = createResult.nft?.tokenId || createResult.nft?._id || 'saved';
      setSuccessMessage(`NFT created successfully (${mintedId})`);
      setForm({
        file: null,
        filePreview: '',
        name: '',
        externalUrl: '',
        description: '',
        category: 'Art',
        price: '',
        properties: [{ type: '', value: '' }],
        levels: [{ name: 'Strength', value: '80', max: '100' }],
        stats: [{ name: 'Power', value: '250' }],
        unlockableEnabled: false,
        unlockableContent: '',
        explicitContent: false,
        supply: 1,
        network: selectedChain || 'polygon',
      });
      setSelectedCollection(collectionId);
      setFileUploadProgress(0);
    } catch (error) {
      console.error('Create NFT failed:', error);
      setSubmitError(error.message || 'Failed to create NFT.');
    } finally {
      setSubmitting(false);
    }
  };

  const imagePreview = useMemo(() => {
    if (!form.filePreview) return null;
    if (form.file?.type?.startsWith('image/')) {
      return <img src={form.filePreview} alt="file preview" style={{ width: '100%', borderRadius: '18px' }} />;
    }
    if (form.file?.type?.startsWith('video/')) {
      return <video controls src={form.filePreview} style={{ width: '100%', borderRadius: '18px' }} />;
    }
    if (form.file?.type?.startsWith('audio/')) {
      return <audio controls src={form.filePreview} style={{ width: '100%' }} />;
    }
    return (
      <div style={{ padding: '18px', borderRadius: '16px', background: '#111827', color: '#cbd5e1' }}>
        <strong>{form.file?.name || 'Uploaded file'}</strong>
        <div>{form.file?.type || 'Preview unavailable for this file type'}</div>
      </div>
    );
  }, [form.filePreview, form.file]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)' }}>
      <Toaster position="top-right" />
      <main style={{ maxWidth: '1140px', margin: '0 auto', padding: 'clamp(12px, 3vw, 24px) clamp(12px, 3vw, 20px) 40px' }}>
        <section style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', margin: 0, color: '#e2e8f0' }}>Create new NFT</h1>
            <p style={{ margin: 0, color: '#4b5563', maxWidth: '760px' }}>
              Upload your artwork, select a collection, add traits, stats, and metadata, then mint your NFT with a live metadata preview.
            </p>
          </div>
        </section>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '22px' }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>1. File Upload</h2>
            <p style={{ color: '#4b5563' }}>Supported image, video, audio, and 3D files. Max file size: 100MB.</p>
            <div
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDrop={handleDrop}
              style={{
                border: dragActive ? '2px dashed #3b82f6' : '2px dashed #d1d5db',
                borderRadius: '18px',
                padding: '32px',
                textAlign: 'center',
                background: dragActive ? '#0f172a' : '#111827',
                transition: 'border-color 150ms ease',
              }}
            >
              <p style={{ margin: 0, color: '#374151', fontWeight: 600 }}>Drag and drop your file here</p>
              <p style={{ margin: '10px 0 0', color: '#6b7280' }}>or</p>
              <label htmlFor="nft-file" style={{ display: 'inline-block', marginTop: '12px', padding: '12px 22px', borderRadius: '12px', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
                Choose file
              </label>
              <input id="nft-file" type="file" accept="image/*,video/*,audio/*,.glb,.gltf,.fbx,.stl,.zip,.obj" onChange={handleFileInput} style={{ display: 'none' }} />
              {errors.file && <div style={{ marginTop: '14px', color: '#dc2626' }}>{errors.file}</div>}
            </div>
            {form.filePreview && (
              <div style={{ marginTop: '18px' }}>
                {imagePreview}
                {fileUploadProgress > 0 && fileUploadProgress < 100 && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ width: '100%', height: '10px', background: '#e5e7eb', borderRadius: '999px' }}>
                      <div style={{ width: `${fileUploadProgress}%`, height: '100%', background: '#2563eb', borderRadius: '999px' }} />
                    </div>
                    <div style={{ marginTop: '6px', color: '#4b5563' }}>{fileUploadProgress}% uploaded</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>2. Name & Description</h2>
            <div style={{ display: 'grid', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  style={fieldStyle}
                  maxLength={100}
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Enter NFT title"
                />
                {errors.name && <div style={{ marginTop: '8px', color: '#dc2626' }}>{errors.name}</div>}
              </div>

              <div>
                <label style={labelStyle}>External Link</label>
                <input
                  style={fieldStyle}
                  value={form.externalUrl}
                  onChange={(event) => updateField('externalUrl', event.target.value)}
                  placeholder="https://" 
                />
                {errors.externalUrl && <div style={{ marginTop: '8px', color: '#dc2626' }}>{errors.externalUrl}</div>}
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  rows={6}
                  style={{ ...fieldStyle, minHeight: '170px', resize: 'vertical' }}
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Add a description. Markdown supported."
                />
              </div>

              <div>
                <label style={labelStyle}>Category *</label>
                <select
                  style={fieldStyle}
                  value={form.category}
                  onChange={(event) => updateField('category', event.target.value)}
                >
                  {NFT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>3. Collection</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Choose collection</label>
                <select
                  style={fieldStyle}
                  value={selectedCollection}
                  onChange={(event) => setSelectedCollection(event.target.value)}
                  disabled={!address}
                >
                  <option value="">
                    {!address
                      ? 'Connect your wallet to see your collections'
                      : collections.length === 0
                        ? `No collections on ${form.network} yet — create one below`
                        : 'Select one of your collections'}
                  </option>
                  {collections.map((collection) => (
                    <option key={collection.collectionId || collection._id} value={collection.collectionId || collection._id}>
                      {collection.name} ({collection.network || form.network})
                    </option>
                  ))}
                </select>
                {errors.collection && <div style={{ marginTop: '8px', color: '#dc2626' }}>{errors.collection}</div>}
              </div>

              <button
                type="button"
                onClick={() => setShowNewCollectionForm((prev) => !prev)}
                style={{
                  width: 'fit-content',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: '#1f2937',
                  cursor: 'pointer',
                  border: '1px solid #475569',
                  color: '#e2e8f0',
                }}
              >
                {showNewCollectionForm ? 'Hide new collection' : 'Create a new collection'}
              </button>

              {showNewCollectionForm && (
                <div style={{ display: 'grid', gap: '18px', paddingTop: '12px' }}>
                  <div>
                    <label style={labelStyle}>Collection name *</label>
                    <input
                      style={fieldStyle}
                      value={newCollectionName}
                      onChange={(event) => {
                        setNewCollectionName(event.target.value);
                        setErrors((prev) => ({ ...prev, newCollectionName: '' }));
                      }}
                      placeholder="New collection title"
                    />
                    {errors.newCollectionName && <div style={{ marginTop: '8px', color: '#dc2626' }}>{errors.newCollectionName}</div>}
                  </div>

                  <div>
                    <label style={labelStyle}>Collection description</label>
                    <textarea
                      rows={4}
                      style={{ ...fieldStyle, minHeight: '120px' }}
                      value={newCollectionDescription}
                      onChange={(event) => setNewCollectionDescription(event.target.value)}
                      placeholder="Optional collection description"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCollectionCreate}
                    disabled={uploadingCollection}
                    style={{
                      width: 'fit-content',
                      padding: '12px 20px',
                      borderRadius: '12px',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      cursor: uploadingCollection ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {uploadingCollection ? 'Creating collection…' : 'Create collection'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>4. Properties, Levels & Stats</h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <h3 style={{ marginBottom: '12px' }}>Properties</h3>
                {form.properties.map((property, index) => (
                  <div key={index} style={{ display: 'grid', gap: '12px', marginBottom: '12px' }}>
                    <div style={twoColGrid}>
                      <div>
                        <label style={labelStyle}>Type</label>
                        <input
                          style={fieldStyle}
                          value={property.type}
                          onChange={(event) => handlePropertyChange(index, 'type', event.target.value)}
                          placeholder="e.g. Rarity"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Value</label>
                        <input
                          style={fieldStyle}
                          value={property.value}
                          onChange={(event) => handlePropertyChange(index, 'value', event.target.value)}
                          placeholder="e.g. Legendary"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProperty(index)}
                      style={{ color: '#ef4444', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      Remove trait
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addProperty} style={{ padding: '12px 18px', borderRadius: '12px', background: '#1f2937', border: '1px solid #475569', cursor: 'pointer', color: '#e2e8f0' }}>
                  Add trait
                </button>
              </div>

              <div>
                <h3 style={{ marginBottom: '12px' }}>Levels</h3>
                {form.levels.map((level, index) => (
                  <div key={index} style={{ display: 'grid', gap: '12px', marginBottom: '12px' }}>
                    <div style={threeColGrid}>
                      <div>
                        <label style={labelStyle}>Name</label>
                        <input
                          style={fieldStyle}
                          value={level.name}
                          onChange={(event) => handleLevelChange(index, 'name', event.target.value)}
                          placeholder="e.g. Strength"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Value</label>
                        <input
                          style={fieldStyle}
                          type="number"
                          min={0}
                          value={level.value}
                          onChange={(event) => handleLevelChange(index, 'value', event.target.value)}
                          placeholder="80"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Max</label>
                        <input
                          style={fieldStyle}
                          type="number"
                          min={1}
                          value={level.max}
                          onChange={(event) => handleLevelChange(index, 'max', event.target.value)}
                          placeholder="100"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (Number(level.value) / Math.max(1, Number(level.max))) * 100)}%`, height: '100%', background: '#2563eb' }} />
                      </div>
                      <button type="button" onClick={() => removeLevel(index)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addLevel} style={{ padding: '12px 18px', borderRadius: '12px', background: '#1f2937', border: '1px solid #475569', cursor: 'pointer', color: '#e2e8f0' }}>
                  Add level
                </button>
              </div>

              <div>
                <h3 style={{ marginBottom: '12px' }}>Stats</h3>
                {form.stats.map((stat, index) => (
                  <div key={index} style={{ display: 'grid', gap: '12px', marginBottom: '12px' }}>
                    <div style={twoColGrid}>
                      <div>
                        <label style={labelStyle}>Name</label>
                        <input
                          style={fieldStyle}
                          value={stat.name}
                          onChange={(event) => handleStatChange(index, 'name', event.target.value)}
                          placeholder="e.g. Power"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Value</label>
                        <input
                          style={fieldStyle}
                          type="number"
                          min={0}
                          value={stat.value}
                          onChange={(event) => handleStatChange(index, 'value', event.target.value)}
                          placeholder="250"
                        />
                      </div>
                    </div>
                    <button type="button" onClick={() => removeStat(index)} style={{ color: '#ef4444', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
                      Remove stat
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addStat} style={{ padding: '12px 18px', borderRadius: '12px', background: '#1f2937', border: '1px solid #475569', cursor: 'pointer', color: '#e2e8f0' }}>
                  Add stat
                </button>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>5. Advanced settings</h2>
            <div style={{ display: 'grid', gap: '18px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Unlockable Content</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.unlockableEnabled}
                      onChange={(event) => updateField('unlockableEnabled', event.target.checked)}
                    />
                    Restrict content to owner only
                  </label>
                </div>
                {form.unlockableEnabled && (
                  <textarea
                    rows={4}
                    style={{ ...fieldStyle, minHeight: '120px' }}
                    value={form.unlockableContent}
                    onChange={(event) => updateField('unlockableContent', event.target.value)}
                    placeholder="Secret content only visible to the owner"
                  />
                )}
                {errors.unlockableContent && <div style={{ marginTop: '8px', color: '#dc2626' }}>{errors.unlockableContent}</div>}
              </div>

              <div>
                <label style={labelStyle}>Explicit Content</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.explicitContent}
                    onChange={(event) => updateField('explicitContent', event.target.checked)}
                  />
                  Mark this NFT as explicit content
                </label>
              </div>

              <div style={{ ...twoColGrid, gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Supply</label>
                  <input
                    type="number"
                    min={1}
                    style={fieldStyle}
                    value={form.supply}
                    onChange={(event) => updateField('supply', Number(event.target.value) || 1)}
                  />
                  {errors.supply && <div style={{ marginTop: '8px', color: '#dc2626' }}>{errors.supply}</div>}
                </div>
                <div>
                  <label style={labelStyle}>List price (optional)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.0001"
                    style={fieldStyle}
                    value={form.price}
                    onChange={(event) => updateField('price', event.target.value)}
                    placeholder="0 (leave blank to mint unlisted)"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Blockchain</label>
                  <select
                    style={fieldStyle}
                    value={form.network}
                    onChange={(event) => updateField('network', event.target.value)}
                  >
                    {networkOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}{!option.isEVM ? ' (non-EVM)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>6. Metadata preview</h2>
            <p style={{ color: '#4b5563', marginBottom: '16px' }}>Review the NFT metadata JSON before submitting. The image field will point to the IPFS file CID after upload.</p>
            <pre style={{ background: '#111827', color: '#f9fafb', borderRadius: '18px', padding: '18px', overflowX: 'auto', maxHeight: '420px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85rem' }}>
              {JSON.stringify(getMetadataForPreview, null, 2)}
            </pre>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {submitError && <div style={{ color: '#b91c1c', fontWeight: 600 }}>{submitError}</div>}
            {successMessage && <div style={{ color: '#047857', fontWeight: 600 }}>{successMessage}</div>}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '16px 0',
                borderRadius: '16px',
                border: 'none',
                background: submitting ? '#93c5fd' : '#2563eb',
                color: '#ffffff',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              {submitting ? 'Processing your NFT…' : 'Mint NFT'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
