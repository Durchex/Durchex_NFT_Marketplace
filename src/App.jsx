import { BrowserRouter, Routes, Route } from "react-router-dom";
import Hero from "./pages/Hero";
import Create from "./pages/Create";
import Explore from "./pages/Explore";
import NftCreatorForm from "../src/components/NftCreatorForm";
import CreateNFTCollection from "./components/CreateNFTCollection";
import NftInfo from "./components/NftInfo";
import Stats from "./pages/Stats";
import Admin from "./pages/Admin";
import MyNfts from "./pages/MyNfts";
import ListNft from "./pages/ListNft";
import Studio from "./pages/Studio";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/mynfts" element={<MyNfts />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/create" element={<Create />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/listnft" element={<ListNft />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/nftcreatorform" element={<NftCreatorForm />} />
        <Route path="/createnftcollection" element={<CreateNFTCollection />} />
        <Route path="/nft/:id" element={<NftInfo />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}
