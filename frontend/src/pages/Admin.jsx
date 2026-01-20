import React, { useEffect } from "react";
import { useAdmin } from "../Context/AdminContext";
import { ErrorToast } from "../app/Toast/Error";
import { useNavigate, Routes, Route } from "react-router-dom";
import { AdminLayout } from "../components/DualAdminPortal";
import Dashboard from "./admin/Dashboard";
import Users from "./admin/Users";
import NFTs from "./admin/NFTs";
import Transactions from "./admin/Transactions";
import Orders from "./admin/Orders";
import Analytics from "./admin/Analytics";
import Activity from "./admin/Activity";
import Reports from "./admin/Reports";
import Settings from "./admin/Settings";
import ContractManagement from "./admin/ContractManagement";
import PartnerManagement from "./admin/PartnerManagement";
import Verifications from "./admin/Verifications";
import GasFeeRegulations from "./admin/GasFeeRegulations";
import UnmintedNFTManager from "./admin/UnmintedNFTManager";
import GiveawayCenter from "./admin/GiveawayCenter";
import FeeSubsidyDashboard from "./admin/FeeSubsidyDashboard";
import WithdrawalAdmin from "./admin/WithdrawalAdmin";
import ListingRequests from "./admin/ListingRequests";
import AdminLogin from "../components/AdminLogin";

const Admin = () => {
  const navigate = useNavigate();
  const { hasAdminAccess, isAdminLoggedIn, isPartner } = useAdmin();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAdminLoggedIn && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin-login') {
      navigate('/admin-login', { replace: true });
    }
  }, [isAdminLoggedIn, navigate]);

  // Redirect to dashboard if on admin root
  useEffect(() => {
    if (hasAdminAccess() && window.location.pathname === '/admin') {
      // If user is a partner, redirect to partner dashboard
      if (isPartner()) {
        navigate('/admin/partner/dashboard', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [hasAdminAccess, isPartner, navigate]);

  // If not logged in, show login page
  if (!isAdminLoggedIn) {
    return <AdminLogin />;
  }

  // If logged in but doesn't have access, show error
  if (!hasAdminAccess()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You don't have permission to access the admin dashboard.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout isPartner={false}>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="nfts" element={<NFTs />} />
        <Route path="unminted-nfts" element={<UnmintedNFTManager />} />
        <Route path="giveaways" element={<GiveawayCenter />} />
        <Route path="fee-subsidies" element={<FeeSubsidyDashboard />} />
        <Route path="listing-requests" element={<ListingRequests />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="orders" element={<Orders />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="activity" element={<Activity />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="contracts" element={<ContractManagement />} />
        <Route path="partners" element={<PartnerManagement />} />
        <Route path="verifications" element={<Verifications />} />
        <Route path="gas-fees" element={<GasFeeRegulations />} />
        <Route path="withdrawals" element={<WithdrawalAdmin />} />
        {/* Default redirect to dashboard */}
        <Route path="" element={<Dashboard />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </AdminLayout>
  );
};

export default Admin;
