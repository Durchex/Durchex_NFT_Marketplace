import { X, Facebook, Twitter, Link as LinkIcon } from "react-feather";

const ShareModal = ({ onClose }) => {
  const shareOptions = [
    { name: "Facebook", icon: <Facebook size={20} />, color: "bg-blue-600" },
    { name: "Twitter", icon: <Twitter size={20} />, color: "bg-sky-500" },
    { name: "Copy Link", icon: <LinkIcon size={20} />, color: "bg-gray-600" },
  ];

  const handleShare = (platform) => {
    if (platform === "Copy Link") {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    } else {
      // In a real app, you would implement actual sharing functionality
      console.log(`Sharing to ${platform}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#312E38] rounded-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-6">Share this collection</h2>

        <div className="space-y-3">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={() => handleShare(option.name)}
              className={`flex items-center gap-3 w-full p-3 rounded-lg ${option.color} text-white`}
            >
              {option.icon}
              <span>{option.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
