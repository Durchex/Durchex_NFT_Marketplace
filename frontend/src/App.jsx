import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { ICOContent } from "./Context";
import { lazy, Suspense } from "react";
import Loading from "./components/Loader";
import AboutUs from "./FooterComponents/AboutUs";
import FAQ from "./FooterComponents/FAQ";
import CollectionPage from "./pages/CollectionPage";
import CollectionDetails from "./pages/CollectionDetails";
import AntiScreenshotWarning from "./components/AntiScreenshotWarning";
import Sidebar from "./components/Sidebar/Sidebar";

// Lazy-loaded components
const Hero = lazy(() => import("./pages/Hero"));
const Create = lazy(() => import("./pages/Create"));
const Explore = lazy(() => import("./pages/Explore"));
const Collections = lazy(() => import("./pages/Collections"));
const NftDetailsPage = lazy(() => import("./pages/NftDetailsPage"));
const NftCreatorForm = lazy(() => import("./components/NftCreatorForm"));
const CreateNFTCollection = lazy(() =>
  import("./components/CreateNFTCollection")
);
const NftInfo = lazy(() => import("./components/NftInfo"));
const NftInfo2 = lazy(() => import("./components/NftInfo2"));
const Stats = lazy(() => import("./pages/Stats"));
const Admin = lazy(() => import("./pages/Admin"));
const MyNfts = lazy(() => import("./pages/MyNfts"));
const MyMintedNFTs = lazy(() => import("./pages/MyMintedNFTs"));
const ListNft = lazy(() => import("./pages/ListNft"));
const Studio = lazy(() => import("./pages/Studio"));
const Profile = lazy(() => import("./pages/Profile"));
const CreatorProfile = lazy(() => import("./pages/CreatorProfile"));
const TradingPage = lazy(() => import("./pages/TradingPage"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ShoppingCart = lazy(() => import("./components/ShoppingCart"));
const Welcome = lazy(() => import("./pages/Welcome"));
const AdminLogin = lazy(() => import("./components/AdminLogin"));
const PartnerAdmin = lazy(() => import("./pages/admin/PartnerAdmin"));

// NEW Feature Pages
const FeaturesHub = lazy(() => import("./pages/FeaturesHub"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const RentalNFT = lazy(() => import("./pages/RentalNFT"));
const AdvancedTrading = lazy(() => import("./pages/AdvancedTrading"));
const Financing = lazy(() => import("./pages/Financing"));
const GovernanceDAO = lazy(() => import("./pages/GovernanceDAO"));
const MonetizationHub = lazy(() => import("./pages/MonetizationHub"));
const AuctionNFT = lazy(() => import("./pages/AuctionNFT"));
const LazyMintNFT = lazy(() => import("./pages/LazyMintNFT"));
const BatchMintNFT = lazy(() => import("./pages/BatchMintNFT"));
const BridgeNFT = lazy(() => import("./pages/BridgeNFT"));
const Staking = lazy(() => import("./pages/Staking"));
const Notifications = lazy(() => import("./pages/Notifications"));
const MintingHub = lazy(() => import("./pages/MintingHub"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const Games = lazy(() => import("./pages/Games"));
const ExploreDebug = lazy(() => import("./pages/Explore_DEBUG"));

export default function App() {
  const { address } = useContext(ICOContent) || {};
  
  // Helper function to check if should redirect to onboarding
  // Only applies to specific routes, not all routes
  const shouldRedirectToOnboarding = () => {
    if (typeof window === "undefined") return false;
    if (!address) return false;
    
    const restrictedRoutes = ["/mynfts", "/studio", "/explore"];
    const currentPath = window.location.pathname;
    
    // Don't redirect on these pages - always allow access
    if (currentPath === "/onboarding" || currentPath === "/profile" || currentPath === "/") {
      return false;
    }
    
    // Only enforce onboarding for specific routes
    const isRestrictedRoute = restrictedRoutes.some(route => 
      currentPath.startsWith(route)
    );
    
    if (!isRestrictedRoute) return false;
    
    const onboardingCompleted = localStorage.getItem("durchex_onboarding_completed");
    return onboardingCompleted !== "true";
  };
  
  return (
    <BrowserRouter>
      <AntiScreenshotWarning />
      <div className="flex min-h-screen bg-black">
        {/* Fixed Sidebar */}
        <Sidebar />
        
        {/* Main Content Area - Adjusted for Sidebar */}
        <div className="flex-1 ml-20">
          <Suspense fallback={<Loading />}>
            <Routes>
          <Route
            path="/"
            element={<Explore />}
          />
          <Route
            path="/mynfts"
            element={
              shouldRedirectToOnboarding() ? (
                <Navigate to="/onboarding" replace />
              ) : (
                <MyNfts />
              )
            }
          />
          <Route
            path="/my-minted-nfts"
            element={
              shouldRedirectToOnboarding() ? (
                <Navigate to="/onboarding" replace />
              ) : (
                <MyMintedNFTs />
              )
            }
          />
          <Route
            path="/studio"
            element={
              shouldRedirectToOnboarding() ? (
                <Navigate to="/onboarding" replace />
              ) : (
                <Studio />
              )
            }
          />
          <Route path="/create" element={<Create />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/trading" element={<TradingPage />} />
          <Route path="/cart" element={<ShoppingCart />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/listnft" element={<ListNft />} />
          <Route
            path="/explore"
            element={
              shouldRedirectToOnboarding() ? (
                <Navigate to="/onboarding" replace />
              ) : (
                <Explore />
              )
            }
          />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/welcome" element={<Welcome />} />

          <Route path="/nftcreatorform" element={<NftCreatorForm />} />
          <Route
            path="/createnftcollection"
            element={<CreateNFTCollection />}
          />
          <Route path="/nft/:tokenId/:itemId/:price/:collection" element={<NftInfo />} />
          <Route path="/nft/:tokenId/:itemId/:price/" element={<NftInfo2 />} />
          <Route path="/nft/:id" element={<NftDetailsPage />} />
          {/* Admin Routes - Partner routes must come before general admin routes */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin/partner/*" element={<PartnerAdmin />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/collection/:collectionId" element={<CollectionDetails/>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:walletAddress" element={<Profile />} />
          <Route path="/creator/:walletAddress" element={<CreatorProfile />} />
          
          {/* NEW FEATURE ROUTES */}
          <Route path="/features" element={<FeaturesHub />} />
          <Route path="/features/trading" element={<AdvancedTrading />} />
          <Route path="/features/auction" element={<AuctionNFT />} />
          <Route path="/features/lazy-mint" element={<LazyMintNFT />} />
          <Route path="/features/batch-mint" element={<BatchMintNFT />} />
          <Route path="/features/rental" element={<RentalNFT />} />
          <Route path="/features/staking" element={<Staking />} />
          <Route path="/features/financing" element={<Financing />} />
          <Route path="/features/bridge" element={<BridgeNFT />} />
          <Route path="/features/governance" element={<GovernanceDAO />} />
          <Route path="/features/monetization" element={<MonetizationHub />} />
          <Route path="/features/analytics" element={<AnalyticsDashboard />} />
          <Route path="/features/notifications" element={<Notifications />} />
          <Route path="/minting" element={<MintingHub />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/games" element={<Games />} />
          <Route path="/explore-debug" element={<ExploreDebug />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          
          {/* FOOTER ROUTES SECTION */}
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/faq" element={<FAQ />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>
  );
}
