import React from "react";
import { Star, CheckCircle, XCircle } from "lucide-react";

const MyPoints = ({ userPoints, isEligible }) => {
  return (
    <div className="px-4 md:px-12 py-8 flex justify-center">
      <div className="w-full max-w-md bg-[#1f1f1f] rounded-2xl shadow-lg p-6 md:p-8 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">🎯 My Points Dashboard</h2>

        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-full bg-purple-700/20">
            <Star className="text-purple-400 h-6 w-6" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Points</p>
            <p className="text-2xl font-bold text-white">{userPoints}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${isEligible ? "bg-green-700/20" : "bg-red-700/20"}`}>
            {isEligible ? (
              <CheckCircle className="text-green-400 h-6 w-6" />
            ) : (
              <XCircle className="text-red-400 h-6 w-6" />
            )}
          </div>
          <div>
            <p className="text-gray-400 text-sm">Eligibility</p>
            <p className={`text-lg font-semibold ${isEligible ? "text-green-400" : "text-red-400"}`}>
              {isEligible ? "Eligible for Rewards" : "Not Eligible"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPoints;
