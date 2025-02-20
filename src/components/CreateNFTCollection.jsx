import { SearchIcon, ArrowRightIcon, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

export default function CreateNFTCollection() {
  const [logo, setLogo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const logoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const handleDrop = (event, type) => {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0], type);
    }
  };

  const handleFileInput = (event, type) => {
    const files = event.target.files;
    if (files && files[0]) {
      handleFile(files[0], type);
    }
  };

  const handleFile = (file, type) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        if (type === "logo") {
          setLogo(e.target.result);
        } else {
          setThumbnail(e.target.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const FileUploadArea = ({ type, file, inputRef }) => (
    <div
      className="border-2 border-dashed border-gray-600 rounded-lg p-4 flex justify-center items-center cursor-pointer"
      onDrop={(e) => handleDrop(e, type)}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
    >
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        onChange={(e) => handleFileInput(e, type)}
        accept="image/*"
      />
      {file ? (
        <img
          src={file}
          alt={`${type} preview`}
          className="max-w-full max-h-40 object-contain"
        />
      ) : (
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto mb-2 text-gray-500" />
          <p>Click or drag and drop to add a {type}</p>
          <p className="text-xs text-gray-400">Recommended: PNG, JPG, SVG.</p>
        </div>
      )}
    </div>
  );

  FileUploadArea.propTypes = {
    type: PropTypes.string.isRequired,
    file: PropTypes.string,
    inputRef: PropTypes.shape({
      current: PropTypes.instanceOf(Element),
    }).isRequired,
  };

  return (
    <div className="min-h-screen bg-[#18161D] text-white">
      <nav className="flex items-center justify-between p-4 border-gray-800">
        <Link to="/">
          <div className="text-xl font-bold">DURCHEX LOGO</div>
        </Link>
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search for collections, NFTs or Artists"
              className="w-full bg-transparent border border-[#79718A] rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-gray-300 hover:text-white">Explore</button>
          <button className="text-gray-300 hover:text-white">Create</button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500" />
        </div>
      </nav>

      <h1 className="text-2xl font-bold my-6 text-center">
        Create new NFT Collection
        <div className="px-96">
          <Link to="/nftcreatorform">
            <svg
              className="w-6 h-6 text-white cursor-pointer"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </Link>
        </div>
      </h1>
      <div>
        <div className="container mx-auto px-96 py-8">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Collection Name *
            </label>
            <input
              type="text"
              placeholder="e.g Dancing Monkey"
              className="w-full bg-transparent border border-[#4A4554] text-white rounded-lg px-4 py-2"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Collection Logo
            </label>
            <p>This photo will be used to represent your collection</p>
            <FileUploadArea type="logo" file={logo} inputRef={logoInputRef} />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Collection Thumbnail
            </label>
            <p>This will act as a cover image for your collection</p>
            <FileUploadArea
              type="thumbnail"
              file={thumbnail}
              inputRef={thumbnailInputRef}
            />
          </div>
          <button className="w-full bg-purple-600 text-white rounded-lg px-4 py-2 mt-4 flex items-center justify-center gap-2">
            Continue
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
