import { useState } from "react";
import { Palette, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";

const Create = () => {
  const [formData, setFormData] = useState({
    contractName: "",
    tokenSymbol: "",
    blockchain: "Polygon",
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (file) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/svg+xml",
      "image/gif",
    ];
    const maxSize = 20 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        "Unsupported file type. Please upload JPG, PNG, SVG, or GIF."
      );
      return;
    }
    if (file.size > maxSize) {
      setErrorMessage("File size exceeds the 20 MB limit.");
      return;
    }

    setUploadedFile(file);
    setErrorMessage("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFileChange(file);
  };

  return (
    <div className="min-h-screen bg-[#0C0B0E] text-white">
      <Header />
      <main className="max-w-3xl mx-auto py-6 px-4">
        {/* Back Navigation Icon */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold mb-4 text-center">
          Start by creating a new Collection for your NFT
        </h1>
        <p className="text-gray-400 mb-8 text-center">
          Youll need to deploy an ERC-1155 contract on the blockchain to create
          a collection for your NFT.{" "}
          <a
            href="https://www.coinbase.com/learn/crypto-basics/what-is-a-smart-contract"
            target="_blank"
            className="text-purple-500 hover:text-purple-400"
          >
            What is a contract?
          </a>
        </p>

        <div className="space-y-5">
          {/* Collection Logo Upload */}
          <div>
            <label className="block text-gray-300 mb-2">Collection Logo</label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer transition-colors"
            >
              <Palette className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-300 mb-2">
                Drag and drop or click to upload
              </p>
              <p className="text-gray-500 text-sm">
                Supported file types: JPG, PNG, SVG or GIF.
                <br />
                Max size: 20mb
              </p>
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
              {uploadedFile && (
                <p className="text-green-500 mt-2">
                  {uploadedFile.name} uploaded successfully.
                </p>
              )}
              {errorMessage && (
                <p className="text-red-500 mt-2">{errorMessage}</p>
              )}
            </div>
          </div>

          {/* Contract Name */}
          <div>
            <label htmlFor="contractName" className="block text-gray-300 mb-2">
              Contract name
            </label>
            <input
              type="text"
              id="contractName"
              name="contractName"
              placeholder="NFT Collection name"
              value={formData.contractName}
              onChange={handleInputChange}
              className="w-full bg-transparent border border-[#4A4554] rounded-lg py-3 px-4 text-white placeholder-gray-500"
            />
          </div>

          {/* Token Symbol */}
          <div>
            <label htmlFor="tokenSymbol" className="block text-gray-300 mb-2">
              Token Symbol
            </label>
            <input
              type="text"
              id="tokenSymbol"
              name="tokenSymbol"
              placeholder="NCn"
              value={formData.tokenSymbol}
              onChange={handleInputChange}
              className="w-full bg-transparent border border-[#4A4554] rounded-lg py-3 px-4 text-white placeholder-gray-500"
            />
          </div>

          {/* Blockchain Select */}
          <div>
            <label htmlFor="blockchain" className="block text-gray-300 pb-2">
              Blockchain
            </label>
            <div className="relative">
              <select
                id="blockchain"
                name="blockchain"
                value={formData.blockchain}
                onChange={handleInputChange}
                className="w-full bg-transparent border border-[#4A4554] rounded-lg py-3 px-4 text-white appearance-none cursor-pointer"
              >
                <option className="text-black" value="Polygon">
                  Polygon
                </option>
                <option className="text-black" value="Ethereum">
                  Ethereum
                </option>
                <option className="text-black" value="Binance">
                  Binance
                </option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <Link to="/nftcreatorform">
            <button className="w-full bg-[#8149F4] hover:bg-purple-700 text-white rounded-lg py-3 px-4 mt-5 transition-colors">
              Continue
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Create;
