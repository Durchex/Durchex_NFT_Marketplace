import { Link, useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { Search, User } from "lucide-react";
import nft from "../assets/nft.png";
import nftrainbowfur from "../assets/nftrainbowfur.png";
import nftbeaniemonkey from "../assets/nftbeaniemonkey.png";
import nftgoldenmonkey from "../assets/nftgoldenmonkey.png";
import { ICOContent } from "../Context";

function NftInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const contexts = useContext(ICOContent);
  const {
    getNFTById_,
    buyNFT,
    fetchMetadataFromPinata,
  } = contexts;

  const [NFTsItems, setNFTsItems] = useState([]);
  const [nftDatas, setNftData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [ComponentLoad, setComponentLoad] = useState(0);

  const nftData = {
    totalVolume: "2.41 ETH",
    floorPrice: "2.41 ETH",
    bestOffer: "2.41 ETH",
    bestOfferPrice: "2.41 ETH",
    minted: "5%",
  };

  useEffect(() => {
    const fetching = async () => {
      try {
        const response = await getNFTById_(id.toString());
        setNftData(response);
        if (!response) {
          navigate("/");
          return null;
        } else {
          // Fetch metadata using tokeNURI from the NFT data
          if (response && response.tokeNURI) {
            const parsedFile = await fetchMetadataFromPinata(response.tokeNURI);
            const metadata = JSON.parse(parsedFile.file);
            console.log("🚀 ~ fetching ~ metadata:", metadata);
            // const metadataData = await metadataResponse.json();
            setMetadata(metadata);
          }
        }
        setNFTsItems(response);
      } catch (error) {
        console.log(error);
      }
    };
    fetching();
  }, [id, ComponentLoad]);

  return (
    <div className="min-h-screen bg-[#18161D] text-white">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-20 py-4">
        <Link to="/">
          <div className="text-xl font-bold">DURCHEX LOGO</div>
        </Link>

        <div className="flex-1 max-w-2xl mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for collections, NFTs or Artists"
              className="w-full bg-transparent border text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-gray-300 hover:text-white">Explore</button>
          <button className="text-gray-300 hover:text-white">Create</button>
          <button className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-green-500">
            <User className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="containe mx-auto px6 py-8">
        {" "}
        {/* Release 1 */}
        {/* Featured NFT */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-t from-[#19171C] to-transparent z-10"></div>
          <img
            src={metadata?.image ?? nft}
            alt="Featured Dancing Monkey"
            className="w-full h-[400px] mt-5 object-cover roundedxl"
          />{" "}
          {/* Release 3 */}
        </div>
        <div className="space-y-6 containe px-20">
          {" "}
          {/* Release 2 */}
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 text-sm bg-[#2A382C] rounded-full text-[#09FF82]">
              Bidding
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{metadata?.category}</h1>
              <p className="text-gray-400">{metadata?.name}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-5 gap-8 py-6">
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">Total Volume</p>
                <p className="text-xl font-bold">{nftData.totalVolume}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">Floor Price</p>
                <p className="text-xl font-bold">{nftData.floorPrice}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">Best Offer</p>
                <p className="text-xl font-bold">${nftDatas?.price} ETH</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">Best Offer</p>
                <p className="text-xl font-bold">{nftData.bestOfferPrice}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">Minted</p>
                <p className="text-xl font-bold">{nftData.minted}</p>
              </div>
            </div>
          </div>
          {/* Description */}
          <div className="space-y-4">
            <p className="text-gray-300">{metadata?.description}</p>

            <div className="space-y-2">
              <p className="font-semibold">Key Features:</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li>
                  High-Resolution Art: Meticulously crafted with stunning
                  visuals and intricate details.
                </li>
                <li>
                  Blockchain Security: Secured on the Ethereum blockchain,
                  ensuring authenticity and ownership.
                </li>
                <li>
                  Limited Edition: A limited supply of NFTs, making each piece
                  truly exclusive.
                </li>
                <li>
                  Community Benefits: Join a vibrant community of collectors and
                  artists, unlocking exclusive perks and rewards.
                </li>
              </ul>
            </div>
            {/* mynft1 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftrainbowfur}
                  alt="Colorful monkey NFT with rainbow fur"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftbeaniemonkey}
                  alt="Monkey NFT wearing a beanie hat"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftgoldenmonkey}
                  alt="Golden monkey NFT holding drink"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftgoldenmonkey}
                  alt="Golden monkey NFT variation"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* <div className="rounded-xl overflow-hidden">
                <img
                  src={nftgoldenmonkey}
                  alt="Golden monkey NFT variation"
                  className="w-full h-full object-cover"
                />
              </div> */}
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftrainbowfur}
                  alt="Golden monkey NFT variation"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftbeaniemonkey}
                  alt="Monkey NFT wearing a beanie hat"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftbeaniemonkey}
                  alt="Monkey NFT wearing a beanie hat"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          {/* mynft */}
          {/* <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftrainbowfur}
                  alt="Colorful monkey NFT with rainbow fur"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftbeaniemonkey}
                  alt="Monkey NFT wearing a beanie hat"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftgoldenmonkey}
                  alt="Golden monkey NFT holding drink"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftgoldenmonkey}
                  alt="Golden monkey NFT variation"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftgoldenmonkey}
                  alt="Golden monkey NFT variation"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftrainbowfur}
                  alt="Golden monkey NFT variation"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftbeaniemonkey}
                  alt="Monkey NFT wearing a beanie hat"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src={nftbeaniemonkey}
                  alt="Monkey NFT wearing a beanie hat"
                  className="w-full h-full object-cover"
                />
              </div>
            </div> */}
        </div>
      </main>
    </div>
  );
}

export default NftInfo;
