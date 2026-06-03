/**
 * Profile — user dashboard with Orbital design system.
 * Tabs: My NFTs · Collections · Points · List NFT · Withdrawals · Settings · Verification
 */
import { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wallet, Copy, Check, Share2, ExternalLink,
  Image, Layers, Star, Tag, ArrowDownToLine,
  Settings, ShieldCheck, ChevronRight,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../FooterComponents/Footer";
import { ICOContent } from "../Context/index.jsx";
import { Toaster } from "react-hot-toast";
import { engagementAPI } from "../services/api.js";
import toast from "react-hot-toast";
import { SuccessToast } from "../app/Toast/Success";
import { ErrorToast } from "../app/Toast/Error.jsx";
import ListNftForm from "../components/ListNftForm.jsx";
import ListingRequestForm from "../components/ListingRequestForm.jsx";
import MyCollections from "../components/MyCollections.jsx";
import MyPoints from "../components/MyPoints.jsx";
import MyProfile from "../components/MyProfile.jsx";
import VerificationSubmission from "../components/VerificationSubmission.jsx";
import MyMintedNFTs from "./MyMintedNFTs.jsx";
import WithdrawalSystem from "./WithdrawalSystem.jsx";

/* ─── Tab definitions ─── */
const TABS = [
  { id: "My NFTs",      label: "My NFTs",       icon: Image      },
  { id: "My Collections",label:"Collections",   icon: Layers     },
  { id: "My Points",    label: "Points",         icon: Star       },
  { id: "List NFT",     label: "List NFT",       icon: Tag        },
  { id: "Withdrawals",  label: "Withdrawals",    icon: ArrowDownToLine },
  { id: "MyProfile",    label: "Settings",       icon: Settings   },
  { id: "Verification", label: "Verification",   icon: ShieldCheck},
];

/* ─── Short address ─── */
const shorten = (addr) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';

export default function Profile() {
  const { address, getUserStatu } = useContext(ICOContent) || {};
  const [activeTab, setActiveTab] = useState("My NFTs");
  const [copied,    setCopied]    = useState(false);
  const [userPoints,setUserPoints]= useState("0");
  const [isEligible,setIsEligible]= useState(false);
  const tabRef = useRef(null);
  const navigate = useNavigate();

  /* ── Points loader ── */
  useEffect(() => {
    if (activeTab !== "My Points" || !address || !getUserStatu) return;
    getUserStatu(address)
      .then(res => {
        if (res?.length >= 2) { setUserPoints(String(res[0])); setIsEligible(res[1]); }
      })
      .catch(() => {});
  }, [activeTab, address, getUserStatu]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareProfile = () => {
    const url = `${window.location.origin}/creator/${address}`;
    if (navigator.share) {
      navigator.share({ title: 'My Durchex Profile', url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Profile link copied!");
    }
  };

  /* ── Require wallet ── */
  if (!address) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-void)' }}>
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 mx-auto"
            style={{ background: 'linear-gradient(135deg,rgba(192,132,252,0.15),rgba(124,58,237,0.15))' }}>
            <Wallet size={36} className="text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-ink-100 mb-3">Connect Your Wallet</h2>
          <p className="text-ink-400 max-w-sm mb-6">
            Connect your wallet to access your profile, NFTs, collections and account settings.
          </p>
          <p className="text-sm text-ink-600">Use the wallet button in the header to get started.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-void)' }}>
      <Header />
      <Toaster />

      {/* ── Profile hero ── */}
      <div className="relative">
        {/* Banner */}
        <div className="h-36 md:h-48 w-full overflow-hidden"
          style={{ background: 'linear-gradient(135deg,rgba(192,132,252,0.18),rgba(124,58,237,0.22))' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 30% 50%,rgba(192,132,252,0.12),transparent 60%)' }} />
        </div>

        {/* Avatar row */}
        <div className="page-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 pb-6">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 overflow-hidden shrink-0"
                style={{ borderColor: 'var(--c-void)', background: 'var(--c-surface)' }}>
                <img
                  src={`https://api.dicebear.com/7.x/identicon/svg?seed=${address}`}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pb-1">
                <h1 className="text-xl md:text-2xl font-extrabold text-ink-100 mb-1">
                  My Profile
                </h1>
                <button onClick={copyAddress}
                  className="flex items-center gap-2 text-sm text-ink-400 hover:text-ink-100 transition-colors font-mono">
                  {shorten(address)}
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pb-1">
              <button onClick={shareProfile}
                className="btn-secondary gap-2 text-sm">
                <Share2 size={14} /> Share
              </button>
              <Link to={`/creator/${address}`}
                className="btn-secondary gap-2 text-sm">
                <ExternalLink size={14} /> Public page
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar (horizontal scroll on mobile) ── */}
      <div className="page-container border-b border-border sticky top-[68px] sm:top-[104px] z-30"
        style={{ background: 'rgba(5,5,13,0.95)', backdropFilter: 'blur(16px)' }}>
        <div ref={tabRef}
          className="flex gap-0.5 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap
                border-b-2 transition-all duration-200 shrink-0
                ${activeTab === id
                  ? 'border-violet-400 text-violet-300'
                  : 'border-transparent text-ink-400 hover:text-ink-200 hover:border-border'
                }`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <main className="flex-1 page-container py-6 md:py-8">
        {activeTab === "MyProfile"      && <MyProfile />}
        {activeTab === "My NFTs"        && <MyMintedNFTs />}
        {activeTab === "My Collections" && <MyCollections placeholder="Collection" />}
        {activeTab === "My Points"      && <MyPoints userPoints={userPoints} isEligible={isEligible} />}
        {activeTab === "List NFT"       && (
          <div className="max-w-2xl mx-auto space-y-6">
            <ListNftForm />
            <ListingRequestForm />
          </div>
        )}
        {activeTab === "Withdrawals"    && <WithdrawalSystem />}
        {activeTab === "Verification"   && (
          <div className="max-w-2xl mx-auto">
            <VerificationSubmission />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
