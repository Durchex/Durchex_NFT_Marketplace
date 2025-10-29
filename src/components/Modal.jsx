import { X } from "react-feather";

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#19171C] p-6 rounded-lg shadow-lg w-[400px] relative">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-white" onClick={onClose}>
          <X size={20} />
        </button>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
