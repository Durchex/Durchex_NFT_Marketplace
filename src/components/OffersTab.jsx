import { useState } from "react";
import { ErrorToast } from "../app/Toast/Error";
import Button from "./Button";
import Modal from "./Modal";

const OffersTab = ({
  offers,
  placeOffer,
  editOffers,
  cancelOffer,
  acceptOffer,
  address,
  nftContract,
  itemId,
  tokenId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // "place" or "edit"
  const [offerDetails, setOfferDetails] = useState({ price: "", id: null });
  // const [nftContract, setNftContract] = useState(null);

  const openModal = (type, offer = null) => {
    if (!address) return ErrorToast("Connect you Wallet");
    setModalType(type);
    if (offer) {
      setOfferDetails({ price: offer.price, id: offer.offerId });
    } else {
      // setOfferDetails({ price: "", id: null });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = () => {
    if (!address) return ErrorToast("Connect you Wallet");
    if (modalType === "place") {
      placeOffer(nftContract, offerDetails.price);
    } else if (modalType === "edit") {
      editOffers(nftContract, offerDetails.id, offerDetails.price);
    }
    closeModal();
  };

  return (
    <div className="p-6 w-full  xl:w-[1500px] flex flex-col justify-center items-center mx-auto">
      <h2 className="text-2xl w-full mx-auto text-center font-semibold bg-gradient-to-tr from-purple-600 to-pink-300  bg-clip-text text-transparent   mb-4">
        Offers
      </h2>

      {/* If no offers, show message and center Place Offer button */}
      {offers?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 w-full mx-auto">
          <p className="text-gray-400 text-lg text-center">No Offer Yet</p>
          <Button className="mt-4" onClick={() => openModal("place")}>
            Place Offer
          </Button>
        </div>
      ) : (
        <>
          {/* Place Offer Button */}
          <div className="flex justify-center text-center  w-full my-6">
            <Button onClick={() => openModal("place")}>Place Offer</Button>
          </div>
          {/* Table for Offers */}
          {offers && offers?.length > 0 && (
            <div className="overflow-x-auto md:w-[1000px] lg:w-[1200px] mx-auto ">
              <table className="w-full border-collapse border border-gray-700">
                <thead>
                  <tr className="bg-[#1E1B24] text-white">
                    <th className="p-2 border border-gray-700 text-xs sm:text-sm md:text-base">
                      Offer Price (ETH)
                    </th>
                    <th className="p-2 border border-gray-700 text-xs sm:text-sm md:text-base">
                      Offer Placer
                    </th>
                    <th className="p-2 border border-gray-700 text-right text-xs sm:text-sm md:text-base">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {offers?.map((offer, i) => (
                    <tr key={i} className="border border-gray-700 bg-[#15121A]">
                      <td className="p-2 text-center text-xs sm:text-sm md:text-base">
                        {offer.amount.toString()}
                      </td>
                      <td className="p-2 text-center break-all text-xs sm:text-sm md:text-base">
                        {offer.buyer.toString()}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {address === null ||
                          offer.buyer.toString().toLowerCase() !==
                            address.toString().toLowerCase() ? (
                            <Button
                              className="bg-green-500 px-2 py-1 text-xs sm:text-sm"
                              onClick={() =>
                                acceptOffer(
                                  nftContract,
                                  itemId.toString(),
                                  tokenId.toString()
                                )
                              }
                            >
                              Accept
                            </Button>
                          ) : (
                            <>
                              <Button
                                className="bg-blue-500 px-2 py-1 text-xs sm:text-sm"
                                onClick={() => openModal("edit", offer)}
                              >
                                Edit
                              </Button>
                              <Button
                                className="bg-red-500 px-2 py-1 text-xs sm:text-sm"
                                onClick={() =>
                                  cancelOffer(
                                    nftContract,
                                    offer.offerId.toString()
                                  )
                                }
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal for Place/Edit Offer */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalType === "place" ? "Place Offer" : "Edit Offer"}
      >
        <input
          type="number"
          placeholder="Enter offer price"
          value={offerDetails.price}
          onChange={(e) =>
            setOfferDetails({ ...offerDetails, price: e.target.value })
          }
          className="w-full p-2 bg-[#312E38] rounded-lg text-white"
        />
        <Button className="mt-4 w-full" onClick={handleSubmit}>
          {modalType === "place" ? "Submit Offer" : "Update Offer"}
        </Button>
      </Modal>
    </div>
  );
};

export default OffersTab;