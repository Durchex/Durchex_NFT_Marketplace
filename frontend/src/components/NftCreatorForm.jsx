import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Image, ArrowLeft } from "lucide-react";

function App() {
  const [price, setPrice] = useState("");
  const [listOnMarketplace, setListOnMarketplace] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();
  const calculateFee = (price) => {
    return price * 0.02; // 2% fee
  };

  const calculateReceived = (price) => {
    return price - calculateFee(price);
  };

  const handleFileChange = (file) => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/svg+xml",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/x-icon",
      "image/tiff",
    ];
    if (
      file &&
      validTypes.includes(file.type) &&
      file.size <= 20 * 1024 * 1024
    ) {
      setSelectedFile(file);
    } else {
      alert(
        "Please upload a valid image file (JPG, PNG, SVG, GIF, WebP, BMP, ICO, or TIFF) under 20MB"
      );
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFileChange(file);
  };

  return (
    <div className="min-h-screen bg-[#0C0B0E] text-white">
      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py8">
        {/* Back Navigation Icon */}
        <button
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span>Back</span>
        </button>
        <h1 className="mb-3 text-3xl font-bold">Create your NFT</h1>

        <div className="grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <p className="mb-2">Upload file</p>
              <div className="flex h-[300px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-600">
                {selectedFile ? (
                  <p className="text-sm text-gray-300">{selectedFile.name}</p>
                ) : (
                  <>
                    <Image className="mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-300">
                      Drag and drop or click to upload
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Supported: JPG, PNG, SVG, GIF, WebP, BMP, ICO, TIFF
                    </p>
                    <p className="text-xs text-gray-500">Max size: 20mb</p>
                  </>
                )}
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="fileInput"
                />
                <label
                  htmlFor="fileInput"
                  className="text-purple-500 hover:underline cursor-pointer"
                >
                  Browse Files
                </label>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p>List on Marketplace</p>
                <button
                  onClick={() => setListOnMarketplace(!listOnMarketplace)}
                  className={`relative h-6 w-12 rounded-full transition-colors ${
                    listOnMarketplace ? "bg-purple-600" : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`absolut h-5 w-5 rounded-full bg-white transition-transform ${
                      listOnMarketplace ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Your NFT will be automatically listed on the Marketplace
              </p>
            </div>

            <div>
              <p className="mb-2">Price</p>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter a price"
                  className="w-full rounded-lg bg-transparent border border-[#4A4554] px-4 py-2 pr-16 text-white"
                />
                <span className="absolute right-4 top-2 text-gray-500">
                  ETH
                </span>
              </div>
              <div className="mt-4 space-y-2 rounded-lg bg-transparent p-4">
                <div className="flex justify-between">
                  <span className="text-gray-400 ">Price</span>
                  <span>{price || "0"} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fee</span>
                  <span>2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">You receive</span>
                  <span>
                    {price ? calculateReceived(parseFloat(price)) : "0"} ETH
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <div>
              <p className="mb-2">Choose collection</p>
              <input
                type="text"
                placeholder="Start typing to show your collection"
                className="w-full rounded-lg border-b border-[#4A4554] bg-transparent px-4 py-2 text-white"
              />
              <div className="mt-4 grid grid-cols-2 gap-4 ">
                <div className="flex h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg bg-transparent border border-[#4A4554]">
                  <div className="mb-2 text-2xl">+</div>
                  <p className="text-sm font-medium">Create new</p>
                  <p className="text-xs text-gray-500">ERC - 1155</p>
                </div>
                <div className="flex h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg bg-transparent border border-[#4A4554]">
                  <div className="mb-2 h-12 w-12 rounded-full bg-gray-100" />
                  <p className="text-sm font-medium">Happy Pigeons area</p>
                  <p className="text-xs text-gray-500">HaPa</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2">Name</p>
              <input
                type="text"
                placeholder="NFT name"
                className="w-full rounded-lg bg-transparent border border-[#4A4554] px-4 py-2 text-white"
              />
            </div>

            <div>
              <p className="mb-2">Description</p>
              <textarea
                placeholder="Write something..."
                className="h-[100px] w-full rounded-lg bg-transparent border border-[#4A4554] px-4 py-2 text-white"
              />
            </div>

            <div>
              <p className="mb-2">Supply</p>
              <input
                type="number"
                placeholder="1"
                className="w-full rounded-lg bg-transparent border border-[#4A4554] px-4 py-2 text-white"
              />
            </div>

            <div>
              <p className="mb-2">Royalties</p>
              <input
                type="text"
                placeholder="1-50%"
                className="w-full rounded-lg bg-transparent border border-[#4A4554] px-4 py-2 text-white"
              />
            </div>

            <button className="w-full rounded-lg bg-purple-600 py-3 font-medium hover:bg-purple-700">
              Continue
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;