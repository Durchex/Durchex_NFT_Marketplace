import { useState, useEffect } from 'react';
import Modal from './Modal';

const AntiScreenshotWarning = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show warning on component mount
    setIsOpen(true);

    // Prevent copy events
    const preventCopy = (e) => {
      e.preventDefault();
      alert('Copying text is not allowed on this platform.');
      return false;
    };

    // Prevent right-click
    const preventRightClick = (e) => {
      e.preventDefault();
      alert('Right-click is disabled for security reasons.');
      return false;
    };

    // Prevent keyboard shortcuts for copy
    const preventKeyboardCopy = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        alert('Copying is not allowed on this platform.');
        return false;
      }
    };

    document.addEventListener('copy', preventCopy);
    document.addEventListener('contextmenu', preventRightClick);
    document.addEventListener('keydown', preventKeyboardCopy);

    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('contextmenu', preventRightClick);
      document.removeEventListener('keydown', preventKeyboardCopy);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Security Notice">
      <div className="text-white">
        <p className="mb-4">
          <strong>Warning:</strong> Screenshots and screen recordings are strictly prohibited on this platform.
        </p>
        <p className="mb-4">
          Copying text or content from this platform is not allowed.
        </p>
        <p className="mb-4">
          Violation of these rules may result in account suspension or legal action.
        </p>
        <p>
          By continuing to use this platform, you agree to abide by these security measures.
        </p>
        <button
          onClick={handleClose}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          I Understand
        </button>
      </div>
    </Modal>
  );
};

export default AntiScreenshotWarning;