import { toast } from "react-hot-toast";

const SuccessToast = (message) =>
  toast.custom((t) => (
    <div
      id="toast-default"
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } flex items-center w-full max-w-xs p-4 text-gray-300 bg-gray-900 rounded-lg shadow backdrop-blur-lg border-gray-700 border-[1px]`}
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-400 bg-green-900 rounded-lg">
        <svg
          className="w-5 h-5"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
        </svg>
        <span className="sr-only">Success icon</span>
      </div>
      <div className="ms-5 text-xl font-bold">{message}</div>
      <button
        type="button"
        className="ms-auto -mx-1.5 -my-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg focus:ring-2 focus:ring-transparent p-1.5 hover:bg-gray-700 inline-flex items-center justify-center h-8 w-8 transition-all"
        onClick={() => toast.dismiss(t.id)}
      >
        <svg
          className="w-3 h-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 14 14"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
          />
        </svg>
      </button>
    </div>
  ));

export { SuccessToast };
