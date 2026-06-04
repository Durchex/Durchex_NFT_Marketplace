import { useContext, useEffect, useState } from "react";
import { ICOContent } from "../Context";
import { Toaster, toast } from "react-hot-toast";
import { nftAPI } from "../services/api";
import { uploadToIPFS } from "../services/ipfs";
import { SUPPORTED_NETWORKS } from "../Context/constants";

const cardStyle = {
  background: 'var(--c-surface,#0d0d1a)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '22px',
  padding: 'clamp(16px, 3.5vw, 24px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
};

const fieldStyle = {
  width: '100%',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '14px',
  padding: '14px 16px',
  fontSize: '1rem',
  background: 'var(--c-raised,#13131f)',
  color: '#f0f0ff',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontWeight: 600,
  marginBottom: '10px',
  color: '#c8c8e8',
};

export default function CreateCollectionForm({ onCreated }) {
  const { address, selectedChain } = useContext(ICOContent);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [network, setNetwork] = useState(selectedChain || 'polygon');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const networkOptions = SUPPORTED_NETWORKS.map((n) => ({
    value: n.id,
    label: n.name,
    isEVM: n.isEVM,
  }));

  useEffect(() => {
    if (selectedChain) setNetwork(selectedChain);
  }, [selectedChain]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Collection image must be an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Collection image must be under 10MB.');
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!address) nextErrors.wallet = 'Connect a wallet before creating a collection.';
    if (!name.trim()) nextErrors.name = 'Collection name is required.';
    if (!network) nextErrors.network = 'Pick a network.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      let imageUrl;
      if (imageFile) {
        try {
          const cid = await uploadToIPFS(imageFile);
          imageUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
        } catch (uploadError) {
          console.error('Collection image upload failed:', uploadError);
          toast.error('Image upload failed – try again or skip the image.');
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        network,
        creatorWallet: address,
        creator: address,
        ...(imageUrl ? { image: imageUrl } : {}),
      };

      const response = await nftAPI.createCollection(payload);
      const collection = response?.collection || response;
      toast.success('Collection created.');
      setName('');
      setDescription('');
      removeImage();
      onCreated?.(collection);
    } catch (error) {
      console.error('Standalone collection create failed:', error);
      toast.error(error.message || 'Could not create collection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toaster position="top-right" />
      <>
        <section style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', margin: 0, color: '#f0f0ff' }}>Create a collection</h1>
          <p style={{ margin: '12px 0 0', color: '#8888aa' }}>
            Set up an empty collection now. You can mint NFTs into it later from the Create NFT tab or your profile.
          </p>
        </section>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '22px' }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: '#f0f0ff' }}>Collection details</h2>
            <div style={{ display: 'grid', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Collection name *</label>
                <input
                  style={fieldStyle}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="My Collection"
                  maxLength={100}
                />
                {errors.name && <div style={{ marginTop: '8px', color: '#f87171' }}>{errors.name}</div>}
              </div>

              <div>
                <label style={labelStyle}>Collection image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="collection preview"
                      style={{ width: '108px', height: '108px', borderRadius: '14px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.07)' }}
                    />
                  ) : (
                    <div style={{ width: '108px', height: '108px', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5c5b7a', fontSize: '0.8rem', textAlign: 'center', padding: '8px' }}>
                      No image
                    </div>
                  )}
                  <label htmlFor="standalone-collection-image" style={{ padding: '12px 18px', borderRadius: '12px', background: 'var(--c-raised,#13131f)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', color: '#f0f0ff' }}>
                    {imageFile ? 'Replace image' : 'Choose image'}
                  </label>
                  <input
                    id="standalone-collection-image"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  {imageFile && (
                    <button
                      type="button"
                      onClick={removeImage}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div style={{ marginTop: '8px', color: '#8888aa', fontSize: '0.85rem' }}>
                  Optional. Stored on IPFS via Pinata. Max 10MB.
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  rows={4}
                  style={{ ...fieldStyle, minHeight: '120px', resize: 'vertical' }}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What's this collection about?"
                />
              </div>

              <div>
                <label style={labelStyle}>Network *</label>
                <select
                  style={fieldStyle}
                  value={network}
                  onChange={(event) => {
                    setNetwork(event.target.value);
                    setErrors((prev) => ({ ...prev, network: '' }));
                  }}
                >
                  {networkOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}{!option.isEVM ? ' (non-EVM)' : ''}
                    </option>
                  ))}
                </select>
                {errors.network && <div style={{ marginTop: '8px', color: '#f87171' }}>{errors.network}</div>}
              </div>
            </div>
          </div>

          {errors.wallet && (
            <div style={{ color: '#fbbf24', fontWeight: 600 }}>{errors.wallet}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '16px 0',
              borderRadius: '16px',
              border: 'none',
              background: submitting ? '#93c5fd' : '#7c3aed',
              color: '#ffffff',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            {submitting ? 'Creating...' : 'Create collection'}
          </button>
        </form>
      </>
    </div>
  );
}




