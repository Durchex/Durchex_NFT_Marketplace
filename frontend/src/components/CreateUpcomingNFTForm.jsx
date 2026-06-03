import { useContext, useEffect, useState } from 'react';
import { ICOContent } from '../Context';
import { Toaster, toast } from 'react-hot-toast';
import { nftAPI } from '../services/api';
import { uploadToIPFS } from '../services/ipfs';
import { SUPPORTED_NETWORKS } from '../Context/constants';
import { ethers } from 'ethers';

/**
 * Build and sign a MultiPieceLazyMintNFT voucher for one phase.
 * pricePerPieceWei must already include the additive minting fee.
 * Mirrors MultiPieceLazyMintNFT.getListingId / getListingMessageHash.
 */
async function signLazyMintVoucher({ creator, ipfsURI, royaltyBps, pricePerPieceWei, maxSupply }) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet provider found. Connect MetaMask.');
  }
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const listingId = ethers.utils.solidityKeccak256(
    ['address', 'string', 'uint256', 'uint256', 'uint256'],
    [creator, ipfsURI, royaltyBps, pricePerPieceWei, maxSupply]
  );
  const messageHash = ethers.utils.solidityKeccak256(['bytes32'], [listingId]);
  const signature = await signer.signMessage(ethers.utils.arrayify(messageHash));
  return { messageHash, signature };
}

const NFT_CATEGORIES = [
  'Art', 'Collectibles', 'Music', 'Photography',
  'Sports', 'Trading Cards', 'Utility', 'Virtual Worlds',
];

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

const generateDraftId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? `draft-${crypto.randomUUID()}`
    : `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function CreateUpcomingNFTForm({ onCreated }) {
  const { address, selectedChain } = useContext(ICOContent);

  const [form, setForm] = useState({
    name: '',
    description: '',
    externalUrl: '',
    category: 'Art',
    network: selectedChain || 'polygon',
    supply: 1,
    royaltyPercent: 5, // creator royalty % on secondary sales
    // Pricing
    whitelistFree: false,
    whitelistPrice: '0',
    mintingFee: '0',
    whitelistMode: 'open', // 'open' | 'allowlist'
    whitelistAddressesText: '',
    publicLaunchAt: '', // datetime-local string
    publicPrice: '',
    maxPerWalletWhitelist: 0, // 0 = unlimited
    maxPerWalletPublic: 0,    // 0 = unlimited
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (selectedChain) setForm((f) => ({ ...f, network: selectedChain }));
  }, [selectedChain]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('NFT image must be an image file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('NFT image must be under 50MB.');
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const next = {};
    if (!address) next.wallet = 'Connect a wallet before creating an upcoming NFT.';
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!imageFile) next.image = 'Upload an image.';
    if (!form.network) next.network = 'Pick a network.';
    if (Number(form.supply) < 1) next.supply = 'Supply must be at least 1.';
    if (!form.whitelistFree) {
      const wp = Number(form.whitelistPrice);
      if (Number.isNaN(wp) || wp < 0) next.whitelistPrice = 'Enter a valid whitelist price.';
    }
    const mf = Number(form.mintingFee);
    if (Number.isNaN(mf) || mf < 0) next.mintingFee = 'Enter a valid minting fee.';
    if (form.publicPrice) {
      const pp = Number(form.publicPrice);
      if (Number.isNaN(pp) || pp < 0) next.publicPrice = 'Enter a valid public price.';
    }
    if (form.whitelistMode === 'allowlist') {
      const addrs = form.whitelistAddressesText.split(/[\s,]+/).filter(Boolean);
      const bad = addrs.filter((a) => !/^0x[a-fA-F0-9]{40}$/.test(a));
      if (bad.length) next.whitelistAddressesText = `Invalid address: ${bad[0]}`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // 1. Upload image to IPFS via Pinata.
      let imageCid;
      try {
        imageCid = await uploadToIPFS(imageFile);
      } catch (err) {
        console.error('Image upload failed:', err);
        toast.error('Image upload failed.');
        setSubmitting(false);
        return;
      }
      const imageGateway = `https://gateway.pinata.cloud/ipfs/${imageCid}`;
      const imageIpfsURI = `ipfs://${imageCid}`;

      // 2. Upload metadata JSON to IPFS so we have an ipfsURI to bind into the voucher.
      const metadata = {
        name: form.name.trim(),
        description: form.description.trim(),
        image: imageIpfsURI,
        external_url: form.externalUrl.trim() || undefined,
        category: form.category,
      };
      let metadataCid;
      try {
        const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
        const metadataFile = new File([metadataBlob], `${form.name.trim() || 'metadata'}.json`, { type: 'application/json' });
        metadataCid = await uploadToIPFS(metadataFile);
      } catch (err) {
        console.error('Metadata upload failed:', err);
        toast.error('Metadata upload failed.');
        setSubmitting(false);
        return;
      }
      const ipfsURI = `ipfs://${metadataCid}`;

      const allowlist = form.whitelistMode === 'allowlist'
        ? form.whitelistAddressesText.split(/[\s,]+/).filter(Boolean)
        : [];

      // 3. Build voucher inputs. pricePerPieceWei bakes the additive minting fee
      //    into the on-chain price, so creator receives (price+fee) per mint
      //    (minus the platform fee deducted by the contract).
      const royaltyBps = Math.max(0, Math.min(5000, Math.round(Number(form.royaltyPercent || 0) * 100)));
      const maxSupply = Number(form.supply);
      const mintingFeeEth = Number(form.mintingFee || '0');
      const whitelistEth = form.whitelistFree ? 0 : Number(form.whitelistPrice || '0');
      const whitelistEffectiveEth = whitelistEth + mintingFeeEth;
      const whitelistPriceWei = ethers.utils.parseEther(whitelistEffectiveEth.toString()).toString();

      // 4. Sign whitelist voucher with creator wallet.
      toast('Sign the whitelist voucher in your walletâ€¦');
      let whitelistVoucher;
      try {
        const sig = await signLazyMintVoucher({
          creator: address,
          ipfsURI,
          royaltyBps,
          pricePerPieceWei: whitelistPriceWei,
          maxSupply,
        });
        whitelistVoucher = {
          pricePerPieceWei: whitelistPriceWei,
          royaltyBps,
          uri: ipfsURI,
          maxSupply,
          messageHash: sig.messageHash,
          signature: sig.signature,
          signedAt: new Date().toISOString(),
        };
      } catch (err) {
        console.error('Whitelist signing failed:', err);
        toast.error(err.message || 'Whitelist signature rejected.');
        setSubmitting(false);
        return;
      }

      // 5. If a public price is provided, sign a SECOND voucher for the public phase.
      let publicVoucher = null;
      if (form.publicPrice && Number(form.publicPrice) >= 0) {
        const publicEffectiveEth = Number(form.publicPrice) + mintingFeeEth;
        const publicPriceWei = ethers.utils.parseEther(publicEffectiveEth.toString()).toString();
        toast('Sign the public voucher in your walletâ€¦');
        try {
          const sig2 = await signLazyMintVoucher({
            creator: address,
            ipfsURI,
            royaltyBps,
            pricePerPieceWei: publicPriceWei,
            maxSupply,
          });
          publicVoucher = {
            pricePerPieceWei: publicPriceWei,
            royaltyBps,
            uri: ipfsURI,
            maxSupply,
            messageHash: sig2.messageHash,
            signature: sig2.signature,
            signedAt: new Date().toISOString(),
          };
        } catch (err) {
          console.error('Public signing failed:', err);
          toast.error(err.message || 'Public signature rejected.');
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        itemId: generateDraftId(),
        name: form.name.trim(),
        description: form.description.trim(),
        image: imageGateway,
        metadataURI: ipfsURI,
        category: form.category,
        owner: address,
        seller: address,
        creator: address,
        network: form.network,
        blockchain: form.network,
        supply: Number(form.supply),
        pieces: Number(form.supply),
        remainingPieces: Number(form.supply),
        royaltyBps,
        external_url: form.externalUrl.trim() || undefined,
        // Upcoming-specific:
        whitelistMode: form.whitelistMode,
        whitelistPrice: form.whitelistFree ? '0' : String(form.whitelistPrice),
        mintingFee: String(form.mintingFee || '0'),
        whitelistAddresses: allowlist,
        publicLaunchAt: form.publicLaunchAt ? new Date(form.publicLaunchAt).toISOString() : null,
        publicPrice: form.publicPrice ? String(form.publicPrice) : null,
        maxPerWalletWhitelist: Number(form.maxPerWalletWhitelist) || 0,
        maxPerWalletPublic: Number(form.maxPerWalletPublic) || 0,
        whitelistVoucher,
        publicVoucher,
      };

      const result = await nftAPI.createUpcomingNft(payload);
      toast.success('Upcoming NFT created.');
      // Reset form
      setForm({
        name: '', description: '', externalUrl: '', category: 'Art',
        network: selectedChain || 'polygon', supply: 1,
        whitelistFree: false, whitelistPrice: '0', mintingFee: '0',
        whitelistMode: 'open', whitelistAddressesText: '',
        publicLaunchAt: '', publicPrice: '',
      });
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(null);
      setImagePreview('');
      onCreated?.(result?.nft);
    } catch (err) {
      console.error('Upcoming NFT create failed:', err);
      toast.error(err.message || 'Could not create upcoming NFT.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toaster position="top-right" />
      <>
        <section style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', margin: 0, color: '#f0f0ff' }}>Create upcoming NFT</h1>
          <p style={{ margin: '12px 0 0', color: '#8888aa' }}>
            Schedule a launch. Whitelisted collectors can mint early at your whitelist price (free or paid).
            At your chosen launch time, the NFT auto-flips to public pricing.
          </p>
        </section>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '22px' }}>
          {/* DETAILS */}
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: '#f0f0ff' }}>NFT details</h2>
            <div style={{ display: 'grid', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input style={fieldStyle} value={form.name}
                  onChange={(e) => setField('name', e.target.value)} placeholder="My Drop" maxLength={120} />
                {errors.name && <div style={{ marginTop: 8, color: '#f87171' }}>{errors.name}</div>}
              </div>

              <div>
                <label style={labelStyle}>Image *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" style={{ width: 130, height: 130, borderRadius: 14, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.07)' }} />
                  ) : (
                    <div style={{ width: 130, height: 130, borderRadius: 14, border: '1px dashed rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5c5b7a' }}>
                      No image
                    </div>
                  )}
                  <label htmlFor="upcoming-nft-image" style={{ padding: '12px 18px', borderRadius: 12, background: 'var(--c-raised,#13131f)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', color: '#f0f0ff' }}>
                    {imageFile ? 'Replace image' : 'Choose image'}
                  </label>
                  <input id="upcoming-nft-image" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                </div>
                {errors.image && <div style={{ marginTop: 8, color: '#f87171' }}>{errors.image}</div>}
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea rows={4} style={{ ...fieldStyle, minHeight: 120, resize: 'vertical' }}
                  value={form.description} onChange={(e) => setField('description', e.target.value)}
                  placeholder="What's this drop about?" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select style={fieldStyle} value={form.category} onChange={(e) => setField('category', e.target.value)}>
                    {NFT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Network *</label>
                  <select style={fieldStyle} value={form.network} onChange={(e) => setField('network', e.target.value)}>
                    {SUPPORTED_NETWORKS.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}{!n.isEVM ? ' (non-EVM)' : ''}</option>
                    ))}
                  </select>
                  {errors.network && <div style={{ marginTop: 8, color: '#f87171' }}>{errors.network}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Supply</label>
                  <input style={fieldStyle} type="number" min={1} value={form.supply}
                    onChange={(e) => setField('supply', e.target.value)} />
                  {errors.supply && <div style={{ marginTop: 8, color: '#f87171' }}>{errors.supply}</div>}
                </div>
                <div>
                  <label style={labelStyle}>External URL</label>
                  <input style={fieldStyle} value={form.externalUrl}
                    onChange={(e) => setField('externalUrl', e.target.value)} placeholder="https://" />
                </div>
              </div>
            </div>
          </div>

          {/* WHITELIST + PRICING */}
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: '#f0f0ff' }}>Whitelist phase</h2>
            <div style={{ display: 'grid', gap: 18 }}>
              <div>
                <label style={labelStyle}>Who can mint during whitelist?</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {['open', 'allowlist'].map((mode) => (
                    <button key={mode} type="button" onClick={() => setField('whitelistMode', mode)}
                      style={{
                        padding: '12px 18px', borderRadius: 12,
                        background: form.whitelistMode === mode ? '#7c3aed' : 'var(--c-raised,#13131f)',
                        border: form.whitelistMode === mode ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.07)',
                        color: '#f0f0ff', cursor: 'pointer', fontWeight: 600,
                      }}>
                      {mode === 'open' ? 'Open pre-sale (any wallet)' : 'Restricted allowlist'}
                    </button>
                  ))}
                </div>
              </div>

              {form.whitelistMode === 'allowlist' && (
                <div>
                  <label style={labelStyle}>Allowlist addresses (one per line, or comma-separated)</label>
                  <textarea rows={5} style={{ ...fieldStyle, minHeight: 130, fontFamily: 'monospace' }}
                    value={form.whitelistAddressesText}
                    onChange={(e) => setField('whitelistAddressesText', e.target.value)}
                    placeholder={'0x1234...abcd\n0xabcd...5678'} />
                  {errors.whitelistAddressesText && <div style={{ marginTop: 8, color: '#f87171' }}>{errors.whitelistAddressesText}</div>}
                </div>
              )}

              <div>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" checked={form.whitelistFree}
                    onChange={(e) => setField('whitelistFree', e.target.checked)} />
                  Free for whitelist (mint at 0)
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Whitelist price (native token)</label>
                  <input style={fieldStyle} type="number" step="0.000001" min={0}
                    disabled={form.whitelistFree} value={form.whitelistFree ? '0' : form.whitelistPrice}
                    onChange={(e) => setField('whitelistPrice', e.target.value)} placeholder="0.0" />
                  {errors.whitelistPrice && <div style={{ marginTop: 8, color: '#f87171' }}>{errors.whitelistPrice}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Minting fee (paid to creator, on top of price)</label>
                  <input style={fieldStyle} type="number" step="0.000001" min={0} value={form.mintingFee}
                    onChange={(e) => setField('mintingFee', e.target.value)} placeholder="0.0" />
                  {errors.mintingFee && <div style={{ marginTop: 8, color: '#f87171' }}>{errors.mintingFee}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* PUBLIC LAUNCH */}
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: '#f0f0ff' }}>Public launch (optional)</h2>
            <p style={{ margin: '0 0 16px', color: '#8888aa', fontSize: '0.92rem' }}>
              When the launch time passes AND a public price is set, the NFT auto-flips to public mint pricing.
              You can leave these blank now and edit later from your profile's Upcoming NFTs section.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <label style={labelStyle}>Public launch date & time</label>
                <input style={fieldStyle} type="datetime-local"
                  value={form.publicLaunchAt} onChange={(e) => setField('publicLaunchAt', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Public mint price (native token)</label>
                <input style={fieldStyle} type="number" step="0.000001" min={0} value={form.publicPrice}
                  onChange={(e) => setField('publicPrice', e.target.value)} placeholder="0.0 (optional)" />
                {errors.publicPrice && <div style={{ marginTop: 8, color: '#f87171' }}>{errors.publicPrice}</div>}
              </div>
            </div>
          </div>

          {errors.wallet && <div style={{ color: '#fbbf24', fontWeight: 600 }}>{errors.wallet}</div>}

          <button type="submit" disabled={submitting}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 16, border: 'none',
              background: submitting ? '#93c5fd' : '#7c3aed',
              color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '1rem',
            }}>
            {submitting ? 'Creatingâ€¦' : 'Create upcoming NFT'}
          </button>
        </form>
      </>
    </div>
  );
}




