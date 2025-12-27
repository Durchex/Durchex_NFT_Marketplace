import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { ICOContent } from "./Context";
import { lazy, Suspense } from "react";
import Loading from "./components/Loader";
import AboutUs from "./FooterComponents/AboutUs";
import FAQ from "./FooterComponents/FAQ";
import CollectionPage from "./pages/CollectionPage";
import AntiScreenshotWarning from "./components/AntiScreenshotWarning";

// Lazy-loaded components
const Hero = lazy(() => import("./pages/Hero"));
const Create = lazy(() => import("./pages/Create"));
const Explore = lazy(() => import("./pages/Explore"));
const Collections = lazy(() => import("./pages/Collections"));
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
const TradingPage = lazy(() => import("./pages/TradingPage"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ShoppingCart = lazy(() => import("./components/ShoppingCart"));
const Welcome = lazy(() => import("./pages/Welcome"));
const AdminLogin = lazy(() => import("./components/AdminLogin"));
const PartnerAdmin = lazy(() => import("./pages/admin/PartnerAdmin"));

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
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route
            path="/"
            element={<Hero />}
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
          {/* Admin Routes - Partner routes must come before general admin routes */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin/partner/*" element={<PartnerAdmin />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/collection/:collection" element={<CollectionPage/>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:walletAddress" element={<Profile />} />
          {/* FOOTER ROUTES SECTION */}
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
