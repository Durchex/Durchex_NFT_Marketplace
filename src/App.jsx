import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./pages/Hero";
import Create from "./pages/Create";
import Explore from "./pages/Explore";
import NftCreatorForm from "./components/NftCreatorForm";
import CreateNFTCollection from "./components/CreateNFTCollection";
import NftInfo from "./components/NftInfo";
import Stats from "./pages/Stats";
import Admin from "./pages/Admin";
import MyNfts from "./pages/MyNfts";
import ListNft from "./pages/ListNft";
import Studio from "./pages/Studio";
import Profile from "./pages/Profile";
import UserProfile from "./components/UserProfile";
import ShoppingCart from "./components/ShoppingCart";
import WelcomePage from "./pages/WelcomePage";
import TradingPage from "./pages/TradingPage";
import NFTMintingInterface from "./components/NFTMintingInterface";
import SmartContractHealthMonitor from "./components/SmartContractHealthMonitor";
import AdminLogin from "./components/AdminLogin";
import PartnerAdmin from "./pages/admin/PartnerAdmin";
import NotificationSystem from "./components/NotificationSystem";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <Header />
        <NotificationSystem />
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/mynfts" element={<MyNfts />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/create" element={<NFTMintingInterface />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/listnft" element={<ListNft />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/nftcreatorform" element={<NftCreatorForm />} />
          <Route path="/createnftcollection" element={<CreateNFTCollection />} />
          <Route path="/nft/:id" element={<NftInfo />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/admin/partner/*" element={<PartnerAdmin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/cart" element={<ShoppingCart />} />
          <Route path="/trading" element={<TradingPage />} />
          <Route path="/contract-health" element={<SmartContractHealthMonitor />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
