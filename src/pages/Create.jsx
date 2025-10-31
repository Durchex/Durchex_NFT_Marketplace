import { Link, Navigate } from "react-router-dom";
import { useContext, useState } from "react";
import { Upload, SearchIcon } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { BsStars } from "react-icons/bs";
import { TiUpload } from "react-icons/ti";
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success";
import axios from "axios";
import { ICOContent } from "../Context";
import { PINATA_API_KEY, PINATA_SECRET_KEY } from "../Context/constants";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function Create() {
  const contexts = useContext(ICOContent);
  const navigate = useNavigate();
  const {
    shortenAddress,
    fetchMetadataFromPinata,
    isAuthorizedVendor,
    address,
    vendorMint,
    publicMint,
    vendorBatchMintMint,
    connectWallet,
    contractAddressMarketplace,
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
    collection: "",
  });

  const [imageURL, setimageURL] = useState(
    // "https://copper-leading-yak-964.mypinata.cloud/ipfs/Qma7g6tpfB1zAyfRFVkBgb8Cms6Vd2wpEjvN8p3MJ1ekaJ"
    " "
  );

  const [isBatchMinting, setIsBatchMinting] = useState(false);
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchImageURLs, setBatchImageURLs] = useState([]);

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
        console.log("Pinata keys present:", Boolean(PINATA_API_KEY), Boolean(PINATA_SECRET_KEY));

        //   https://copper-leading-yak-964.mypinata.cloud/ipfs/Qma7g6tpfB1zAyfRFVkBgb8Cms6Vd2wpEjvN8p3MJ1ekaJ

        const response = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          maxBodyLength: "Infinity",
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
            "Content-Type": "multipart/form-data",
          },
        });
        const url = `https://silver-solid-beetle-367.mypinata.cloud/ipfs/${response.data.IpfsHash}`;

        setimageURL(url);
        console.log("🚀 ~ uploadToIPFS ~ imageURL:", url);
        // setLoader(false);
        // notifySuccess("Logo uploaded successfully");
      } catch (error) {
        // setLoader(false);
        // notifyError("check your pinata keys");
        console.log(error);
      }
    }
  };

  const upload_________JSONToIPFS = async (metadata) => {
    if (!imageURL && !batchImageURLs.length) {
      ErrorToast("Image URL is missing! Please ensure the image is uploaded.");
      return;
    }

    if (isBatchMinting) {
      console.log(
        "🚀 ~ uploadJSONToIPFS ~ batchImageURLs:",
        Boolean(batchImageURLs)
      );
      if (
        !metadata.name ||
        !metadata.description ||
        !metadata.creator ||
        !metadata.image ||
        !metadata.properties ||
        !metadata.collection ||
        !metadata.category
      )
        return;
    }
    console.log("i got here", imageURL);

    if (!isBatchMinting) {
      if (
        !metadata.name ||
        !metadata.description ||
        !metadata.creator ||
        !imageURL ||
        !metadata.properties ||
        !metadata.category
      )
        return;
    }

    if (imageURL) {
      console.log("🚀 ~ uploadJSONToIPFS ~ imageURL:", imageURL);
      try {
        const data = {
          name: metadata.name,
          description: metadata.description,
          creator: metadata.creator,
          image: isBatchMinting ? metadata.image : imageURL,
          category: metadata.category,
          properties: metadata.properties,
          collection: metadata.collection,
        };

        const response = await axios.post(
          "https://api.pinata.cloud/pinning/pinJSONToIPFS",
          data,
          {
            headers: {
              pinata_api_key: PINATA_API_KEY,
              pinata_secret_api_key: PINATA_SECRET_KEY,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("🚀 ~ ~~~~~~~~~~~~~uploadToIPFS ~ response:", response);

        // const url = `https://copper-leading-yak-964.mypinata.cloud/ipfs/${response.data.IpfsHash}`;
        // const urls = "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash
        const urls = "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash;
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

  const uploadJSONToIPFS = async (metadata) => {
    if (!imageURL && !batchImageURLs.length) {
      ErrorToast("Image URL is missing! Please ensure the image is uploaded.");
      return;
    }

    if (isBatchMinting) {
  
      if (
        !metadata.name ||
        !metadata.description ||
        !metadata.creator ||
        !metadata.image ||
        !metadata.properties ||
        !metadata.collection ||
        !metadata.category
      )
        return;
    }

    console.log("i got here", imageURL);

    if (!isBatchMinting) {
      if (
        !metadata.name ||
        !metadata.description ||
        !metadata.creator ||
        !imageURL ||
        !metadata.properties ||
        !metadata.category
      )
        return;
    }

    if (imageURL) {
      console.log("🚀 ~ uploadJSONToIPFS ~ imageURL:", imageURL);

      try {
        // Prepare metadata to be uploaded
        const data = JSON.stringify({
          name: metadata.name,
          description: metadata.description,
          creator: metadata.creator,
          image: isBatchMinting ? metadata.image : imageURL, // Use batch image URL or single image URL
          category: metadata.category,
          properties: metadata.properties,
          collection: metadata.collection,
        });

        console.log("🚀 ~ Data to be uploaded to Pinata:", data); // Log data to ensure correctness

        // Create FormData for uploading to Pinata
        // Upload the metadata to Pinata
        const response = await axios.post(
          "https://api.pinata.cloud/pinning/pinJSONToIPFS",
          JSON.parse(data),
          {
            headers: {
              pinata_api_key: PINATA_API_KEY,
              pinata_secret_api_key: PINATA_SECRET_KEY,
              "Content-Type": "application/json",
            },
          }
        );

        // Log the Pinata response to inspect it
        console.log("🚀 ~ Pinata response:", response.data);

        // Get the IPFS hash from the response and construct the URL
        const ipfsUrl = `https://silver-solid-beetle-367.mypinata.cloud/ipfs/${response.data.IpfsHash}`;
        console.log("🚀 ~ Metadata uploaded to IPFS. URL:", ipfsUrl);

        // Optionally fetch and log the metadata from IPFS for inspection
        const fetchedMetadata = await fetch(ipfsUrl).then((res) => res.json());
        console.log("🚀 ~ Fetched Metadata from IPFS:", fetchedMetadata);

        // Return the IPFS URL
        return ipfsUrl;
      } catch (error) {
        console.error("Error uploading metadata to Pinata:", error);
        ErrorToast("Failed to upload metadata. Please try again.");
        return null;
      }
    }
  };

  const HandleMintNF = async (event) => {
    event.preventDefault();
    if (!formNftData.image) {
      return ErrorToast("Upload a NFT image !");
    }
    try {
      console.log("🚀 ~ HandleMintNFT ~ formNftData:", formNftData);
      const Uri = await uploadJSONToIPFS(formNftData);
      console.log("🚀 ~ HandleMintNFT ~ Uri :", Uri);
      // const metaData = "https://copper-leading-yak-964.mypinata.cloud/ipfs/QmPhv27ETCX9xcKuF1AiExZPdhVxqEZgiHT1N9rSocKncN";
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
          // metaData,
          Uri,
          nftmarketplace
          // "0xBd41795def27c74870364e2e1Ed9aC7A4166A68A"
        )
          .then((response) => {
            if (response.status === 1) {
              SuccessToast(
                <div>
                  NFT Mint successfully 🎉 ! <br />
                </div>
              );
              setTimeout(() => {
                navigate("/");
              }, 3000);
            } else {
              ErrorToast(<div>Something went wrong, try again 💔 !</div>);
              // return null;
            }
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
              navigate("/");
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

  const handleBatchImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setBatchFiles(files);
    console.log("🚀 ~ handleBatchImageChange ~ files:", files);
    
    const uploadedURLs = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await axios({
            method: "post",
            url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
            data: formData,
            maxBodyLength: "Infinity",
            headers: {
              pinata_api_key: import.meta.env.VITE_APP_PINATA_API_KEY,
              pinata_secret_api_key: import.meta.env
              .VITE_APP_PINATA_SECRECT_KEY,
              "Content-Type": "multipart/form-data",
            },
          });
          console.log("🚀 ~ handleBatchImageChange ~ formData:", formData);

          const url = `https://silver-solid-beetle-367.mypinata.cloud/ipfs/${response.data.IpfsHash}`;
          console.log("🚀 ~ files.map ~ url:", url)
          return url;
        } catch (error) {
          console.error("Error uploading file:", error);
          return null;
        }
      })
    );

    setBatchImageURLs(uploadedURLs.filter((url) => url !== null)); // Filter out null URLs
  };

  const HandleMintNFT = async (event) => {
    event.preventDefault();
    // const nftmarketplace = import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS;
    const nftmarketplace = contractAddressMarketplace;
    if (!nftmarketplace) return ErrorToast("No contract Address");
    console.log("🚀 ~ HandleMintNFT ~ nftmarketplace:", nftmarketplace);

    if (isBatchMinting) {
      if (batchImageURLs.length === 0) {
        return ErrorToast("Upload at least one NFT image for batch minting!");
      }

      try {
        const reallyTrue = await isAuthorizedVendor(address);

        const metadataURIs = [];

        for (let i = 0; i < batchImageURLs.length; i++) {
          const metadata = {
            name: `${formNftData.name} #${i + 1}`,
            description: formNftData.description,
            creator: formNftData.creator,
            image: batchImageURLs[i],
            category: formNftData.category,
            properties: formNftData.properties,
            collection: formNftData.collection,
          };

          const uri = await uploadJSONToIPFS(metadata);
          console.log("🚀 ~ HandleMintNFT ~ uri:", uri);
          if (uri) {
            metadataURIs.push(uri);
          } else {
            console.error(`Failed to upload metadata for file ${i + 1}`);
          }
        }

        if (metadataURIs.length === 0) {
          return ErrorToast("Metadata upload failed for all images!");
        }

        if (reallyTrue) {
          await vendorBatchMintMint(metadataURIs)
            .then((response) => {
              if (response.status === 1) {
                SuccessToast(<div>Batch NFT Minted successfully 🎉!</div>);
                setTimeout(() => navigate("/"), 3000);
              } else {
                ErrorToast(<div>Batch Minting failed 💔!</div>);
              }
            })
            .catch((error) => {
              console.error(error);
              ErrorToast(
                <div>Something went wrong during batch minting 💔!</div>
              );
            });
        } else {
          ErrorToast("You are not authorized for batch minting!");
        }
      } catch (error) {
        console.error(error);
        ErrorToast(<div>Unexpected error during batch minting 💔!</div>);
      }
    } else {
      // Existing single mint code...
      if (!formNftData.image) {
        return ErrorToast("Upload an NFT image!");
      }
      try {
        const Uri = await uploadJSONToIPFS(formNftData);
        if (!Uri || Uri.length === 0) {
          console.log("Invalid URI:", Uri);
          return ErrorToast("Metadata upload failed. Please try again!");
        }
        console.log("🚀 ~ HandleMintNFT ~ Uri:", Uri);
        const nftmarketplace = contractAddressMarketplace;
        const reallyTrue = await isAuthorizedVendor(address);

        if (reallyTrue) {
          await vendorMint(Uri, nftmarketplace)
            .then((response) => {
              if (response.status === 1) {
                SuccessToast(<div>NFT Minted successfully 🎉!</div>);
                setTimeout(() => navigate("/"), 3000);
              } else {
                ErrorToast(<div>Minting failed 💔!</div>);
              }
            })
            .catch((error) => {
              console.error(error);
              ErrorToast(<div>Something went wrong 💔!</div>);
            });
        } else {
          await publicMint(Uri, nftmarketplace)
            .then((response) => {
              SuccessToast(<div>NFT Minted successfully 🎉!</div>);
              setTimeout(() => navigate("/"), 3000);
            })
            .catch((error) => {
              console.error(error);
              ErrorToast(<div>Something went wrong 💔!</div>);
            });
        }
      } catch (error) {
        console.error(error);
      }
    }
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
        ErrorToast("File size must be less than 20MB");
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
        ErrorToast("File size must be less than 20MB");
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
    <div className="min-h-screen w-full flex flex-col bg-black text-white">
      <Header />
      <div className="flex flex-col p-4 sm:p-5 gap-5 overflow-y-auto h-[89%] bg-black">
        <Toaster position="left" />
        <h1 className="text-white/90 mx-auto font-semibold text-xl text-center sm:text-2xl mt-4 w-full max-w-[400px]">
          Create New NFT
        </h1>
        {/* <Link to={"/multiplemint"} className="flex items-center space-x-2">
        <h1 className="text-center text-xl font-semibold">Mint NFT Collection</h1>
        </Link> */}

        <div className="flex flex-row gap-2 mx-auto items-center text-sm sm:text-base sm:mt-4 text-white/70 mb-5 md:text-lg">
          <BsStars />
          <p>You have to pay a gas fee to update the NFT</p>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            type="button"
            onClick={() => setIsBatchMinting(false)}
            className={`px-4 py-2 rounded-lg ${
              !isBatchMinting ? "bg-purple-600" : "bg-gray-600"
            }`}
          >
            Single Mint
          </button>
          <button
            type="button"
            onClick={() => setIsBatchMinting(true)}
            className={`px-4 py-2 rounded-lg ${
              isBatchMinting ? "bg-purple-600" : "bg-gray-600"
            }`}
          >
            Batch Mint
          </button>
        </div>

        {/* Responsive Container */}
        <div className="flex flex-col lg:flex-row mx-auto w-full max-w-[900px] gap-8">
          {/* Image Upload Box */}
          <div className="w-full">
            {!isBatchMinting ? (
              // Single Mint Upload
              <>
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  htmlFor="imageUpload"
                  className="w-full h-[200px] sm:h-[250px] rounded-xl outline-dashed outline-pink-500/30 flex flex-col items-center justify-center p-3 gap-3 dark:bg-darkBlue-500"
                >
                  <img
                    src=""
                    id="NFTPreview"
                    className="rounded-xl hidden w-full h-max bg"
                    alt=""
                  />
                  <div
                    id="Upload-ui"
                    className="gap-3 flex flex-col items-center"
                  >
                    <TiUpload className="text-purple-500 text-4xl" />
                    <b className="text-white/80 text-sm sm:text-base">
                      Upload File
                    </b>
                    <span className="text-white/70 text-sm sm:text-base">
                      Drag or choose your file to upload
                    </span>
                    <p className="text-white/50 text-sm sm:text-base w-full">
                      PNG, GIF, JPEG, or SVG. Max 5MB.
                    </p>
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
              </>
            ) : (
              // Batch Mint Upload
              <>
                <label
                  htmlFor="batchUpload"
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files);
                    const fakeEvent = { target: { files } };
                    handleBatchImageChange(fakeEvent); // simulate input event
                  }}
                  className="w-full h-[200px] sm:h-[250px] rounded-xl outline-dashed outline-blue-500/30 flex flex-col items-center justify-center p-3 gap-3 dark:bg-darkBlue-500"
                >
                  <div className="gap-3 flex flex-col items-center">
                    <TiUpload className="text-purple-500 text-4xl" />
                    <b className="text-white/80 text-sm sm:text-base">
                      Upload Multiple Files
                    </b>
                    <span className="text-white/70 text-sm sm:text-base">
                      Drag or choose your files to upload
                    </span>
                    <p className="text-white/50 text-sm sm:text-base w-full">
                      PNG, GIF, JPEG, or SVG. Max 5MB each.
                    </p>
                  </div>
                </label>
                <input
                  id="batchUpload"
                  type="file"
                  accept=".svg, .png, .jpg, .jpeg, .gif"
                  multiple
                  onChange={handleBatchImageChange}
                  hidden
                />
                {batchImageURLs.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {batchImageURLs.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`NFT ${index}`}
                        className="w-full h-auto rounded"
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Form Section */}
          <div className="w-full">
            <form onSubmit={HandleMintNFT} className="flex flex-col gap-6 px-2">
              {isBatchMinting && (
                <div className="flex flex-col gap-4">
                  <label className="text-white/70 font-semibold text-sm sm:text-base">
                    Collection Name *
                  </label>
                  <input
                    className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                    type="text"
                    placeholder="Enter collection name"
                    name="collection"
                    onChange={HandleOnChange}
                    required
                  />
                </div>
              )}

              <div className="flex flex-col gap-4">
                <label className="text-white/70 font-semibold text-sm sm:text-base">
                  NFT title *
                </label>
                <input
                  className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                  type="text"
                  placeholder="NFT title"
                  name="name"
                  onChange={HandleOnChange}
                  required
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-white/70 font-semibold text-sm sm:text-base">
                  NFT description *
                </label>
                <textarea
                  rows={4}
                  className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                  required
                  name="description"
                  onChange={HandleOnChange}
                  placeholder="Describe your NFT"
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-white/70 font-semibold text-sm sm:text-base">
                  Creator
                </label>
                <input
                  className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                  type="text"
                  placeholder="Name of NFT creator"
                  name="creator"
                  onChange={HandleOnChange}
                  required
                />
              </div>

              {/* Price Input */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* <div className="flex-1">
                  <label className="text-white/70 font-semibold text-sm sm:text-base">
                    Price (in POL) *
                  </label>
                  <input
                    className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                    type="number"
                    placeholder="Price"
                    name="price"
                    step="0.0001"
                    min="0"
                    onChange={HandleOnChange}
                    required
                  />
                </div> */}
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-white/70 font-semibold text-sm sm:text-base">
                  Select a category
                </label>
                <select
                  className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
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
                <label className="text-white/70 font-semibold text-sm sm:text-base">
                  Properties
                </label>
                <input
                  className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                  type="text"
                  placeholder="Properties ex. red, blue, sky"
                  onChange={HandleProperties}
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-white bg-gradient-to-tr from-[#8149F4] to-[#fc08c7] hover:bg-purple-700"
                >
                  Submit
                </button>
                <Link
                  to="/"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-white bg-gradient-to-tr from-[#8149F4] to-[#fc08c7] font-semibold hover:bg-darkBlue-800 text-center"
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
