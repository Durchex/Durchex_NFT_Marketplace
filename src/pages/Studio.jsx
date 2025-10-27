import { Link } from "react-router-dom";

export default function Studio() {
  return (
    <div className="min-h-screen bg-black">
      <div className="my-20 flex items-center justify-center">
        <div className="w-full max-w-4xl bg-[#111111] rounded-2xl border border-gray-800">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-black"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-white text-lg font-medium">
                  You have not created any collections yet
                </h2>
                <p className="text-gray-400 text-sm">
                  Start earning by creating your own NFTs
                </p>
              </div>
            </div>
            <Link to="/create">
              <button className="px-6 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium rounded-lg transition-colors">
                Create
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
