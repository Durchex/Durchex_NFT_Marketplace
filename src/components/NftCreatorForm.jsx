import { Link, Navigate } from "react-router-dom";
import { useContext, useState } from "react";
import { Upload, SearchIcon } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { BsStars } from "react-icons/bs";
import { TiUpload } from "react-icons/ti";
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success";
import { FaArrowLeftLong } from "react-icons/fa6";
import axios from "axios";
import { ICOContent } from "../Context";

export default function NftCreatorForm() {
  const contexts = useContext(ICOContent);
  const {
    shortenAddress,
    isAuthorizedVendor,
    address,
    vendorMint,
    publicMint,
    connectWallet,
  } = contexts;

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [formNftData, setFormNftData] = useState({
    price: "",
    name: "",
    creator: "",
    image: "",
    description: "",
    properties: "",
    category: "",
  });
  const [imageURL, setimageURL] = useState(
    "https://copper-leading-yak-964.mypinata.cloud/ipfs/Qma7g6tpfB1zAyfRFVkBgb8Cms6Vd2wpEjvN8p3MJ1ekaJ"
  );

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
    uploadToIPFS(file);
    if (file) {
      readImageAsDataURL(file, (imageDataUrl) => {
        const blobImage = dataURLtoBlob(imageDataUrl);

        if (!blobImage.type.includes("image/")) {
          ErrorToast("please upload correct format !");
          return null;
        }

        if (5242880 < blobImage.size) {
          ErrorToast("5MB size required !");
          return null;
        }

        const NFTPreview = document.getElementById("NFTPreview");
        const imageBox = document.getElementById("Upload-ui");
        imageBox.style.display = "none";
        NFTPreview.style.display = "block";
        NFTPreview.src = imageDataUrl;
        setFormNftData({ ...formNftData, image: blobImage });
      });
    }
  };

  const readImageAsDataURL = (file, callback) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const imageDataUrl = reader.result;
      callback(imageDataUrl);
    };

    reader.readAsDataURL(file);
  };

  const dataURLtoBlob = (dataURL) => {
    const splitDataUrl = dataURL.split(",");
    const byteString = atob(splitDataUrl[1]);
    const mimeString = splitDataUrl[0].split(":")[1].split(";")[0];

    const arrayBuffer = new ArrayBuffer(byteString?.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString?.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: mimeString });
  };

  const uploadToIPFS = async (file) => {
    if (file) {
      try {
        // setLoader(true);
        const formData = new FormData();
        formData.append("file", file);
        // console.log("🚀 ~ uploadToIPFS ~ formData:", formData.file);
        console.log(
          "🚀 ~ uploadJSONToIPFS ~ .env.VITE_APP_PINATA_SECRET_KEY:",
          import.meta.env.VITE_APP_PINATA_SECRECT_KEY
        );
        console.log(
          "🚀 ~ uploadJSONToIPFS ~ process.env.VITE_APP_PINATA_API_KEY,:",
          import.meta.env.VITE_APP_PINATA_API_KEY
        );

        //   https://copper-leading-yak-964.mypinata.cloud/ipfs/Qma7g6tpfB1zAyfRFVkBgb8Cms6Vd2wpEjvN8p3MJ1ekaJ

        const response = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          maxBodyLength: "Infinity",
          headers: {
            pinata_api_key: import.meta.env.VITE_APP_PINATA_API_KEY,
            pinata_secret_api_key: import.meta.env.VITE_APP_PINATA_SECRECT_KEY,
            "Content-Type": "multipart/form-data",
          },
        });
        console.log("🚀 ~ uploadToIPFS ~ response:", response);

        const url = `https://copper-leading-yak-964.mypinata.cloud/ipfs/${response.data.IpfsHash}`;
        console.log("🚀 ~ uploadToIPFS ~ url:", url);

        setimageURL(url);
        console.log("🚀 ~ uploadToIPFS ~ imageURL:", imageURL);
        // setLoader(false);
        // notifySuccess("Logo uploaded successfully");
      } catch (error) {
        // setLoader(false);
        // notifyError("check your pinata keys");
        console.log(error);
      }
    }
  };

  const uploadJSONToIPFS = async (metadata) => {
    console.log(
      "🚀 ~ uploadJSONToIPFS ~ metadata:",
      metadata.name,
      metadata.properties,
      metadata.category
    );
    if (
      !metadata.name ||
      !metadata.description ||
      !metadata.creator ||
      !imageURL ||
      !metadata.properties ||
      !metadata.category
    )
      return;

    if (imageURL) {
      console.log("🚀 ~ uploadJSONToIPFS ~ imageURL:", imageURL);
      try {
        // setLoader(true);
        const data = JSON.stringify({
          name: metadata.name,
          description: metadata.description,
          creator: metadata.creator,
          image: imageURL,
          category: metadata.category,
          properties: metadata.properties,
        });
        const formData = new FormData();
        formData.append("file", data);

        const response = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
          // https://api.pinata.cloud/pinning/pinJSONToIPFS
          data: formData,
          // maxBodyLength: "Infinity",
          headers: {
            // pinata_api_key: import.meta.env.VITE_APP_PINATA_API_KEY,
            // pinata_secret_api_key: import.meta.env.VITE_APP_PINATA_SECRECT_KEY,
            pinata_api_key: "cda41ff9c74b92ca5f74",
            pinata_secret_api_key:
              "13ced76249fd7e159accb105ff9d52ec589e1acf60d9ce44ce35a329993234a9",
            "Content-Type": "application/json",
          },
        });

        console.log("🚀 ~ uploadToIPFS ~ response:", response);

        // const url = `https://copper-leading-yak-964.mypinata.cloud/ipfs/${response.data.IpfsHash}`;
        // const urls = "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash
        const urls =
          "https://copper-leading-yak-964.mypinata.cloud/ipfs/" +
          response.data.IpfsHash;
        console.log("🚀 ~ uploadToIPFS ~ url:", urls);

        // setLoader(false);
        // notifySuccess("Logo uploaded successfully");
        return urls;
      } catch (error) {
        // setLoader(false);
        // notifyError("check your pinata keys");
        console.log(error);
      }
    }
  };

  const HandleMintNFT = async (event) => {
    event.preventDefault();
    if (!formNftData.image) {
      return ErrorToast("Upload a NFT image !");
    }
    try {
      console.log("🚀 ~ HandleMintNFT ~ formNftData:", formNftData);
      const Uri = await uploadJSONToIPFS(formNftData);
      console.log("🚀 ~ HandleMintNFT ~ Uri :", Uri);
      // const metaData =
      //   "https://copper-leading-yak-964.mypinata.cloud/ipfs/QmPhv27ETCX9xcKuF1AiExZPdhVxqEZgiHT1N9rSocKncN";
      // console.log("🚀 ~ HandleMintNFT ~ metaData:", metaData);
      // console.log(
      //   "🚀 ~ awaitpublicMint ~ process.env.REACT_APP_NFTMARKETPLACE_CONTRACT_ADDRESS:",
      //   import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS
      // );

      const nftmarketplace = import.meta.env
        .VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS;

      const reallyTrue = await isAuthorizedVendor(address);
      // const reallyTrue = await isAuthorizedVendor(UserEthAccount.account);
      console.log("🚀 ~ HandleMintNFT ~ reallyTrue:", reallyTrue);

      if (reallyTrue) {
        await vendorMint(
          Uri,
          nftmarketplace
          // metaData,
          // "0xBd41795def27c74870364e2e1Ed9aC7A4166A68A"
        )
          .then((response) => {
            SuccessToast(
              <div>
                NFT Mint successfully 🎉 ! <br />
              </div>
            );
            setTimeout(() => {
              Navigate("/");
            }, 3000);
          })
          .catch((error) => {
            console.error(error);
            ErrorToast(<div>Something error happen try agin 💔 !</div>);
          });
      } else {
        await publicMint(
          Uri,
          nftmarketplace
          // metaData,
          // "0xBd41795def27c74870364e2e1Ed9aC7A4166A68A"
        )
          .then((response) => {
            SuccessToast(
              <div>
                NFT Mint successfully 🎉 ! <br />
              </div>
            );
            setTimeout(() => {
              Navigate("/");
            }, 3000);
          })
          .catch((error) => {
            console.error(error);
            ErrorToast(<div>Something error happen try agin 💔 !</div>);
          });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const HandleOnChange = (e) => {
    setFormNftData({
      ...formNftData,
      [e.target.name]: e.target.value,
    });
  };

  const HandleProperties = (e) => {
    const arrayOfProperties = e.target.value.split(" ");
    const FilterArray = arrayOfProperties.filter((item) => item !== "");
    setFormNftData({ ...formNftData, properties: FilterArray });
  };

  // const handleDrop = (e) => {
  //   e.preventDefault();
  //   handleImageChange(e);
  // };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleImageChange(e);
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      if (files[0].size <= 20 * 1024 * 1024) {
        // 20MB max
        setFile(files[0]);
      } else {
        alert("File size must be less than 20MB");
      }
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files[0]) {
      if (files[0].size <= 20 * 1024 * 1024) {
        // 20MB max
        setFile(files[0]);
      } else {
        alert("File size must be less than 20MB");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (file) {
      formData.append("file", file);
    }

    console.log("Form submitted:", Object.fromEntries(formData));
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
              className="w-full bg-transparent border border-[#79718A] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-gray-300 hover:text-white">Explore</button>
          <button className="text-gray-300 hover:text-white">Create</button>
          <button className="text-gray-300 hover:text-white">Sell</button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500" />
        </div>
      </nav>
      {/* <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8 text-center">Create new NFT</h1>
        <div className="flex items-center space-x-3">
          <Link to="/create">
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
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  dragActive ? "border-[#ffffff]" : "border-[#4A4554]"
                } ${file ? "border-[#8149F4]" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".png,.jpg,.svg,.mp4,.gif"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  {file ? (
                    <div className="text-sm">{file.name}</div>
                  ) : (
                    <>
                      <Upload className="h-40 w-8 text-gray-400" />
                      <div className="text-sm">
                        Click or drag and drop to upload files
                      </div>
                      <div className="text-xs text-gray-500">
                        PNG, JPG, SVG, MP4, GIF (20MB max)
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  placeholder="Name"
                  required
                  className="w-full p-2 bg-transparent border border-[#4A4554] rounded-md text-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="collection">
                  Collection <span className="text-red-500">*</span>
                </label>
                <input
                  id="collection"
                  name="collection"
                  placeholder="Add NFT to a Collection"
                  required
                  className="w-full p-2 bg-transparent border border-[#4A4554] rounded-md text-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="supply">
                  Supply <span className="text-red-500">*</span>
                </label>
                <input
                  id="supply"
                  name="supply"
                  placeholder="1"
                  type="number"
                  min="1"
                  required
                  className="w-full p-2 bg-transparent border border-[#4A4554] rounded-md text-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="royalty">
                  Royalty <span className="text-red-500">*</span>
                </label>
                <input
                  id="royalty"
                  name="royalty"
                  placeholder="Between 1-20%"
                  required
                  pattern="^([1-9]|1[0-9]|20)$"
                  className="w-full p-2 bg-transparent border border-[#4A4554] rounded-md text-white"
                />
              </div>

              <div className="space-y-2 pb-4">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="w-full p-2 bg-transparent border border-[#4A4554] rounded-md text-white min-h-[100px]"
                />
              </div>

              <a
                href="/createnftcollection"
                type="submit"
                className="p-2 bg-[#8149F4] hover:bg-purple-700 text-white rounded-md justify-center flex"
                disabled={!file}
              >
                Create NFT
              </a>
            </div>
          </form>
        </div>
      </main> */}

      <div className="flex flex-col p-2 sm:p-5 gap-5 overflow-y-auto h-[89%] w-full">
        <Toaster position="left" />
        <h1 className="text-white/90 font-semibold text-xl sm:text-2xl mt-4">
          Create New NFT
        </h1>
        <div className="flex flex-row gap-2 items-center text-sm sm:text-base sm:mt-4  text-white/70">
          <BsStars />
          <p>You have to pay a gas for update the NFT</p>
        </div>
        <div className="flex lg:flex-row flex-col gap-8">
          <label
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => e.preventDefault()}
            onDrop={handleDrop}
            htmlFor="imageUpload"
            id="image-box"
            className="flex-1 xl:mx-10 xl:my-10 xl:w-[35%] w-full h-[40pc] rounded-xl outline-dashed outline-pink-500/30 flex overflow-hidden flex-col dark:bg-darkBlue-500 p-3 gap-3 items-center justify-center"
          >
            <img
              src=""
              id="NFTPreview"
              className="rounded-xl hidden w-full h-max"
              alt=""
            />
            <div
              id="Upload-ui"
              className="gap-3 items-center justify-center flex flex-col"
            >
              <TiUpload className="text-purple-500 text-2xl" />
              <b className="text-white/80 text-sm sm:text-base">Upload File</b>
              <span className="text-white/70 text-sm sm:text-base">
                Drag or choose your file to upload
              </span>
              <p className="text-white/50 text-sm sm:text-base">
                PNG, GIF, JPEG or SVG. Max 5MB.
              </p>
              {/* <button
              className="py-3 px-10 flex flex-row items-center gap-2 text-white/90 font-semibold justify-center xs:justify-start text-sm sm:text-base w-full xs:w-auto bg-gradient-to-tr from-pink-500 to-purple-500 rounded-xl "
              // onClick={HandleMintNFT}
            >
              Create <FaArrowLeftLong className="-rotate-[-140deg]" />
            </button> */}
            </div>
          </label>
          <input
            id="imageUpload"
            type="file"
            accept=".svg, .png, .jpg, .jpeg, .gif"
            name="image"
            onChange={handleImageChange}
            hidden
          />
          <div className="flex-1">
            <form onSubmit={HandleMintNFT} className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <label
                  htmlFor=""
                  className="text-white/70 font-semibold text-sm sm:text-base"
                >
                  NFT title *
                </label>
                <input
                  className=" bg-gray-950 text-gray-100 rounded-lg focus:ring-0 focus:dark:border-pink-500 block w-full p-2.5 dark:bg-darkBlue-600 dark:border-gray-600/30 dark:placeholder-gray-500 dark:text-white/70 text-sm sm:text-base"
                  type="text"
                  placeholder="Nft title"
                  name="name"
                  onChange={HandleOnChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-4">
                <label
                  htmlFor=""
                  className="text-white/70 font-semibold text-sm sm:text-base"
                >
                  NFT description *
                </label>
                <textarea
                  rows={5}
                  className="bg-gray-950 text-gray-100 rounded-lg focus:ring-0 focus:dark:border-pink-500 block w-full p-2.5 dark:bg-darkBlue-600 dark:border-gray-600/30 dark:placeholder-gray-500 dark:text-white/70 text-sm sm:text-base"
                  required
                  type="text"
                  name="description"
                  onChange={HandleOnChange}
                  placeholder="Please describe your NFT"
                />
              </div>
              <div className="flex flex-col gap-4">
                <label
                  htmlFor=""
                  className="text-white/70 font-semibold text-sm sm:text-base"
                >
                  Creator
                </label>
                <input
                  className=" bg-gray-950 text-gray-100 rounded-lg focus:ring-0 focus:dark:border-pink-500 block w-full p-2.5 dark:bg-darkBlue-600 dark:border-gray-600/30 dark:placeholder-gray-500 dark:text-white/70 text-sm sm:text-base"
                  type="text"
                  placeholder="name of NFT creator"
                  name="creator"
                  onChange={HandleOnChange}
                  required
                />
              </div>
              <div className="flex justify-between gap-6 flex-col sm:flex-row">
                <div className="flex flex-1 flex-col gap-4">
                  <label
                    htmlFor=""
                    className="text-white/70 font-semibold text-sm sm:text-base"
                  >
                    Price ( in USD )*
                  </label>
                  <input
                    className="bg-gray-950 text-gray-100 rounded-lg focus:ring-0 focus:dark:border-pink-500 block w-full p-2.5 dark:bg-darkBlue-600 dark:border-gray-600/30 dark:placeholder-gray-500 dark:text-white/70 text-sm sm:text-base"
                    type="number"
                    placeholder="Price"
                    name="price"
                    step="0.0001"
                    min="0"
                    // pattern="[0-9]*"
                    onChange={HandleOnChange}
                    required
                  />
                </div>
                {/* <div className="flex flex-1 flex-col gap-4">
                <label
                  htmlFor=""
                  className="text-white/70 font-semibold text-sm sm:text-base"
                >
                  Royalties ( in % ) *
                </label>
                <input
                  className="bg-gray-50 text-gray-900 rounded-lg focus:ring-0 focus:dark:border-pink-500 block w-full p-2.5 dark:bg-darkBlue-600 dark:border-gray-600/30 dark:placeholder-gray-500 dark:text-white/70 text-sm sm:text-base"
                  type="number"
                  placeholder="Royalties ex. 4%"
                  name="royalties"
                  pattern="[0-9]*"
                  onChange={HandleOnChange}
                  required
                />
              </div> */}
              </div>

              <div className="flex flex-col gap-4">
                <label
                  htmlFor=""
                  className="text-white/70 font-semibold text-sm sm:text-base"
                >
                  Select a category
                </label>
                <select
                  id="countries"
                  className="bg-gray-950 text-gray-100 rounded-lg focus:ring-0 focus:dark:border-pink-500 block w-full p-2.5 dark:bg-darkBlue-600 dark:border-gray-600/30 dark:placeholder-gray-500 dark:text-white/70 text-sm sm:text-base"
                  name="category"
                  onChange={HandleOnChange}
                  required
                >
                  <option value="gaming">Gaming</option>
                  <option value="sports">Sports</option>
                  <option value="music">Music</option>
                  <option value="art">Art</option>
                  <option value="photography">Photography</option>
                  <option value="utility">Utility</option>
                </select>
              </div>

              <div className="flex flex-col gap-4">
                <label
                  htmlFor=""
                  className="text-white/70 font-semibold text-sm sm:text-base"
                >
                  Properties
                </label>
                <input
                  className="bg-gray-950 text-gray-100 rounded-lg focus:ring-0 focus:dark:border-pink-500 block w-full p-2.5 dark:bg-darkBlue-600 dark:border-gray-600/30 dark:placeholder-gray-500 dark:text-white/70 text-sm sm:text-base"
                  type="text"
                  placeholder="Properties ex. red,blue,sky"
                  onChange={HandleProperties}
                  required
                />
              </div>
              <div className="flex gap-5 mb-5">
                <button
                  type="submit"
                  className="text-white bg-[#8149F4] hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-pink-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-[#8149F4] dark:hover:bg-purple-700 dark:focus:ring-purple-800"
                >
                  Submit
                </button>
                <Link
                  type="submit"
                  to="/myProfile"
                  className="text-white bg-darkBlue-700 hover:bg-darkBlue-800 focus:ring-4 focus:outline-none focus:ring-pink-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 cursor-pointer text-center dark:bg-darkBlue-500 dark:hover:bg-darkBlue-600 dark:focus:ring-darkBlue-400"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
