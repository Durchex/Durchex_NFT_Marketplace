import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { ICOContent } from "./Context";
import { lazy, Suspense } from "react";
import Loading from "./components/Loader";
import AboutUs from "./FooterComponents/AboutUs";
import FAQ from "./FooterComponents/FAQ";
import MultipleMint from "./pages/MultipleMint";
import CollectionPage from "./pages/CollectionPage";

// Lazy-loaded components
const Hero = lazy(() => import("./pages/Hero"));
const Create = lazy(() => import("./pages/Create"));
const Explore = lazy(() => import("./pages/Explore"));
const NftCreatorForm = lazy(() => import("./components/NftCreatorForm"));
const CreateNFTCollection = lazy(() =>
  import("./components/CreateNFTCollection")
);
const NftInfo = lazy(() => import("./components/NftInfo"));
const NftInfo2 = lazy(() => import("./components/NftInfo2"));
const Stats = lazy(() => import("./pages/Stats"));
const Admin = lazy(() => import("./pages/Admin"));
const MyNfts = lazy(() => import("./pages/MyNfts"));
const ListNft = lazy(() => import("./pages/ListNft"));
const Studio = lazy(() => import("./pages/Studio"));
const Profile = lazy(() => import("./pages/Profile"));
const TradingPage = lazy(() => import("./pages/TradingPage"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ShoppingCart = lazy(() => import("./components/ShoppingCart"));

export default function App() {
  const { address } = useContext(ICOContent) || {};
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        {/* <Suspense fallback={<div className="bg-black justify-center items-center w-full ">Loading...</div>}> */}
        <Routes>
          <Route
            path="/"
            element={
              typeof window !== "undefined" && address && !localStorage.getItem("durchex_onboarding_completed") ? (
                <Navigate to="/onboarding" replace />
              ) : (
                <Hero />
              )
            }
          />
          <Route path="/mynfts" element={<MyNfts />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/create" element={<Create />} />
          <Route path="/trading" element={<TradingPage />} />
          <Route path="/cart" element={<ShoppingCart />} />
          <Route path="/multiplemint" element={<MultipleMint />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/listnft" element={<ListNft />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/onboarding" element={<Onboarding />} />

          <Route path="/nftcreatorform" element={<NftCreatorForm />} />
          <Route
            path="/createnftcollection"
            element={<CreateNFTCollection />}
          />
          <Route path="/nft/:tokenId/:itemId/:price/:collection" element={<NftInfo />} />
          <Route path="/nft/:tokenId/:itemId/:price/" element={<NftInfo2 />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/collection/:collection" element={<CollectionPage/>} />
          <Route path="/profile" element={<Profile />} />
          {/* FOOTER ROUTES SECTION */}
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
