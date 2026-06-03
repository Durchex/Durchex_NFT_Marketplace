/**
 * NFTCard — Orbital design-system canonical card.
 * Replaces NFTCard, NFTCard2, NFTCard3.
 *
 * Usage:
 *   <NFTCard nft={nftObj} />
 *   <NFTCard nft={nftObj} variant="compact" rank={1} />
 *   <NFTCard nft={nftObj} variant="featured" />
 *
 * Legacy props (name, price, image, …) are also accepted for backward compat.
 */
import PropTypes from "prop-types";
import { useState } from "react";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Share2, Tag, Layers, Zap } from "lucide-react";
import { ICOContent } from "../Context";
import { useCart } from "../Context/CartContext";
import { ethers } from "ethers";
import { ErrorToast } from "../app/Toast/Error";
import { SuccessToast } from "../app/Toast/Success";

/* ── Network currency symbols ── */
const NETWORK_SYMBOL = {
  ethereum: 'ETH', polygon: 'MATIC', base: 'ETH',
  bsc: 'BNB', arbitrum: 'ETH', optimism: 'ETH',
  avalanche: 'AVAX', solana: 'SOL',
};

/* ── Normalise price: if > 1e9 treat as wei ── */
function fmtPrice(raw) {
  if (raw == null || raw === '') return null;
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n === 0) return null;
  if (n > 1e9) {
    try { return parseFloat(ethers.utils.formatEther(String(raw))).toFixed(4); } catch (_) {}
  }
  return n >= 1 ? n.toFixed(2) : n.toFixed(4);
}

/* ════════════════════════════════════════════════
   NFTCard — Orbital design
   ════════════════════════════════════════════════ */
const NFTCard = ({
  /* new unified prop */
  nft,
  /* legacy flat props (backward compat) */
  collectionName, currentlyListed, itemId, nftContract, image, metadata,
  owner, price, seller, tokenId, name, network, pieces, remainingPieces,
  isLazyMint,
  /* behaviour */
  onClick, onLike, onAddToCart, isLiked = false, isInCart: isInCartProp,
  variant = 'default', showBadge = true, rank,
}) => {
  /* ── Merge nft object + legacy flat props ── */
  const n = nft || {};
  const _itemId          = n.itemId   || itemId   || (n._id && String(n._id)) || '';
  const _name            = n.name     || name     || 'Untitled NFT';
  const _image           = n.image    || n.imageURL || image || '';
  const _price           = n.price    || price;
  const _network         = String(n.network  || network  || 'base');
  const _collection      = n.collection || collectionName || '';
  const _isLazyMint      = n.isLazyMint ?? isLazyMint ?? false;
  const _pieces          = Number(n.pieces          ?? pieces ?? 1);
  const _remainingPieces = n.remainingPieces != null ? Number(n.remainingPieces)
                           : remainingPieces  != null ? Number(remainingPieces)
                           : _pieces;
  const _listed          = n.currentlyListed ?? currentlyListed ?? false;
  const _tokenId         = n.tokenId || tokenId || _itemId;
  const _nftContract     = n.nftContract || n.contractAddress || nftContract;
  const _likes           = typeof n.likes === 'number' ? n.likes : (n.likes?.length ?? 0);

  const soldOut = _isLazyMint && _remainingPieces <= 0;
  const isListed = _listed || (_isLazyMint && !soldOut);

  /* ── Context + cart ── */
  const contexts = useContext(ICOContent);
  const { addToCart, isInCart: checkInCart, removeFromCart } = useCart();
  const { buyNFT, address } = contexts || {};

  const [imgError, setImgError] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [buyLoading, setBuyLoading] = useState(false);

  const inCart = isInCartProp ?? checkInCart?.(_itemId, _nftContract) ?? false;
  const priceDisplay = fmtPrice(_price);
  const symbol = NETWORK_SYMBOL[String(_network).toLowerCase()] || 'ETH';

  // Always go to NFT details first — user can mint/buy from there
  const href = `/nft/${_itemId}`;
  const imgSrc = imgError ? '' : _image;

  /* ── Handlers ── */
  const handleLike = (e) => {
    e.preventDefault(); e.stopPropagation();
    setLiked(p => !p);
    onLike?.();
  };

  const handleAddToCart = async (e) => {
    e?.preventDefault(); e?.stopPropagation();
    if (onAddToCart) { onAddToCart(); return; }
    if (!address) { ErrorToast('Connect your wallet first'); return; }
    const nftData = { itemId: _itemId, tokenId: _tokenId, nftContract: _nftContract,
                      price: _price, name: _name, image: _image, network: _network };
    if (inCart) {
      await removeFromCart?.(address, _itemId, _nftContract);
    } else {
      await addToCart?.(nftData, address);
    }
  };

  const handleBuy = async (e) => {
    e?.preventDefault(); e?.stopPropagation();
    if (!address)  { ErrorToast('Connect your wallet first'); return; }
    if (soldOut)   { ErrorToast('This NFT is sold out'); return; }
    if (!_listed && !_isLazyMint) { ErrorToast('This NFT is not listed'); return; }
    setBuyLoading(true);
    try {
      const resp = await buyNFT?.(_nftContract || _itemId, _itemId, priceDisplay, _network);
      SuccessToast(<span>Purchased! Tx: {resp?.transactionHash?.slice(0, 10)}…</span>);
      setTimeout(() => window.location.reload(), 1800);
    } catch (err) {
      ErrorToast(err?.message || 'Purchase failed');
    } finally { setBuyLoading(false); }
  };

  const handleShare = (e) => {
    e?.preventDefault(); e?.stopPropagation();
    navigator.clipboard?.writeText(window.location.origin + href).catch(() => {});
  };

  /* ═══════════════════════════════════════
     FEATURED VARIANT
     ═══════════════════════════════════════ */
  if (variant === 'featured') {
    return (
      <Link to={`/nft/${_itemId}`} onClick={onClick}
        className="group relative block rounded-3xl overflow-hidden cursor-pointer"
        style={{ aspectRatio: '4/5' }}>
        {imgSrc
          ? <img src={imgSrc} alt={_name} onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          : <div className="w-full h-full bg-raised flex items-center justify-center">
              <Layers size={48} className="text-ink-600" />
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {_collection && <p className="text-xs text-cyan-400 font-medium mb-1 truncate">{_collection}</p>}
          <h3 className="text-xl font-bold text-white mb-3 truncate">{_name}</h3>
          <div className="flex items-center justify-between">
            {priceDisplay && (
              <div>
                <p className="text-[10px] text-ink-400 mb-0.5">Price</p>
                <p className="text-lg font-bold text-white">
                  {priceDisplay} <span className="text-sm text-ink-300">{symbol}</span>
                </p>
              </div>
            )}
            <button onClick={handleBuy} disabled={buyLoading || soldOut}
              className="btn-primary btn-sm gap-1.5 disabled:opacity-50">
              <Zap size={14} />
              {buyLoading ? '…' : _isLazyMint ? 'Mint' : 'Buy'}
            </button>
          </div>
        </div>
        {showBadge && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {_isLazyMint && !soldOut && <span className="badge-violet"><Layers size={9}/> Lazy</span>}
            {soldOut && <span className="badge-gray">Sold Out</span>}
            {!_isLazyMint && isListed && <span className="badge-green"><Tag size={9}/> Listed</span>}
          </div>
        )}
      </Link>
    );
  }

  /* ═══════════════════════════════════════
     COMPACT VARIANT
     ═══════════════════════════════════════ */
  if (variant === 'compact') {
    return (
      <Link to={href} onClick={onClick}
        className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border
                   hover:border-cyan-400/25 hover:bg-raised transition-all duration-200 cursor-pointer group">
        {rank && <span className="w-7 text-center text-sm font-bold text-ink-600 shrink-0">{rank}</span>}
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-raised shrink-0">
          {imgSrc
            ? <img src={imgSrc} alt={_name} onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center">
                <Layers size={20} className="text-ink-600" />
              </div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink-100 truncate">{_name}</p>
          {_collection && <p className="text-xs text-ink-400 truncate">{_collection}</p>}
        </div>
        {priceDisplay && (
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-ink-100">{priceDisplay}</p>
            <p className="text-[10px] text-ink-400">{symbol}</p>
          </div>
        )}
      </Link>
    );
  }

  /* ═══════════════════════════════════════
     DEFAULT VARIANT
     ═══════════════════════════════════════ */
  return (
    <Link to={href} onClick={onClick}
      className="nft-card group block">

      {/* ── Image area ── */}
      <div className="nft-card-image">
        {imgSrc
          ? <img src={imgSrc} alt={_name} onError={() => setImgError(true)} loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center bg-raised"
              style={{ aspectRatio: '1' }}>
              <Layers size={40} className="text-ink-600" />
            </div>
        }

        {/* Hover action overlay */}
        <div className="nft-card-overlay">
          <button onClick={_isLazyMint ? handleAddToCart : handleBuy}
            disabled={buyLoading || soldOut}
            className="btn-primary btn-sm w-full gap-1.5 disabled:opacity-50">
            {buyLoading ? 'Processing…'
              : _isLazyMint
                ? (soldOut ? 'Sold Out' : `Mint · ${priceDisplay || '—'} ${symbol}`)
                : `Buy · ${priceDisplay || '—'} ${symbol}`}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleLike}
              className={`w-9 h-9 rounded-lg flex items-center justify-center backdrop-blur-sm
                          transition-all duration-200
                          ${liked ? 'bg-red-500/20 text-red-400' : 'bg-black/40 text-ink-200 hover:text-red-400'}`}>
              <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={handleAddToCart}
              className={`w-9 h-9 rounded-lg flex items-center justify-center backdrop-blur-sm
                          transition-all duration-200
                          ${inCart ? 'bg-cyan-400/20 text-cyan-400' : 'bg-black/40 text-ink-200 hover:text-cyan-400'}`}>
              <ShoppingCart size={15} />
            </button>
            <button onClick={handleShare}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm
                         text-ink-200 hover:text-ink-100 transition-colors">
              <Share2 size={15} />
            </button>
          </div>
        </div>

        {/* Status badges */}
        {showBadge && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
            {_isLazyMint && !soldOut && (
              <span className="badge-violet text-[10px]">
                <Layers size={9}/> Lazy
                {_pieces > 1 && ` · ${_remainingPieces}/${_pieces}`}
              </span>
            )}
            {soldOut && <span className="badge-gray text-[10px]">Sold Out</span>}
            {!_isLazyMint && isListed && <span className="badge-green text-[10px]"><Tag size={9}/> Listed</span>}
          </div>
        )}

        {rank && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center
                          text-sm font-bold text-void pointer-events-none"
            style={{ background: 'var(--g-orbital)' }}>
            #{rank}
          </div>
        )}
      </div>

      {/* ── Card body ── */}
      <div className="nft-card-body">
        {_collection && (
          <p className="text-[11px] text-ink-400 mb-1 truncate font-medium">{_collection}</p>
        )}
        <h3 className="text-sm font-semibold text-ink-100 mb-3 truncate
                        group-hover:text-cyan-400 transition-colors duration-200">
          {_name}
        </h3>
        <div className="flex items-end justify-between">
          <div>
            {priceDisplay
              ? <>
                  <p className="text-[10px] text-ink-600 mb-0.5">
                    {_isLazyMint ? 'Mint Price' : 'Price'}
                  </p>
                  <p className="text-base font-bold text-ink-100">
                    {priceDisplay}
                    <span className="text-xs text-ink-400 ml-1 font-normal">{symbol}</span>
                  </p>
                </>
              : <p className="text-sm text-ink-600">Not listed</p>
            }
          </div>
          <div className="flex items-center gap-1 text-xs text-ink-600">
            <Heart size={11} />
            <span>{_likes}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ── Skeleton ── */
export function NFTCardSkeleton({ variant = 'default' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border">
        <div className="w-12 h-12 rounded-xl skeleton shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 skeleton rounded w-3/4" />
          <div className="h-2.5 skeleton rounded w-1/2" />
        </div>
        <div className="h-4 w-16 skeleton rounded" />
      </div>
    );
  }
  return (
    <div className="rounded-2xl overflow-hidden bg-surface border border-border">
      <div className="skeleton" style={{ aspectRatio: '1' }} />
      <div className="p-4 space-y-3">
        <div className="h-2.5 skeleton rounded w-1/3" />
        <div className="h-4 skeleton rounded w-2/3" />
        <div className="h-3.5 skeleton rounded w-1/4" />
      </div>
    </div>
  );
}

NFTCard.propTypes = {
  nft: PropTypes.object,
  name: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'compact', 'featured']),
};

export default NFTCard;