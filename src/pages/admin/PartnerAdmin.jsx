import React, { useEffect } from "react";
import { useAdmin } from "../../Context/AdminContext";
import { ErrorToast } from "../../app/Toast/Error";
import { useNavigate, Routes, Route } from "react-router-dom";
import { AdminLayout, PartnerDashboard, PartnerUsers } from "../../components/DualAdminPortal";
import PartnerNFTs from "./PartnerNFTs";
import PartnerTransactions from "./PartnerTransactions";
import PartnerOrders from "./PartnerOrders";
import PartnerAnalytics from "./PartnerAnalytics";
import PartnerReports from "./PartnerReports";

const PartnerAdmin = () => {
  const navigate = useNavigate();
  const { hasAdminAccess } = useAdmin();

  // Partner authentication check
  useEffect(() => {
    if (!hasAdminAccess()) {
      ErrorToast("Partner authentication required");
      navigate("/admin-login");
      return;
    }
  }, [hasAdminAccess, navigate]);

  // Redirect to partner dashboard if on partner admin root
  useEffect(() => {
    if (hasAdminAccess() && window.location.pathname === '/admin/partner') {
      navigate('/admin/partner/dashboard', { replace: true });
    }
  }, [hasAdminAccess, navigate]);

  return (
    <AdminLayout isPartner={true}>
      <Routes>
        <Route path="/dashboard" element={<PartnerDashboard />} />
        <Route path="/users" element={<PartnerUsers />} />
        <Route path="/nfts" element={<PartnerNFTs />} />
        <Route path="/transactions" element={<PartnerTransactions />} />
        <Route path="/orders" element={<PartnerOrders />} />
        <Route path="/analytics" element={<PartnerAnalytics />} />
        <Route path="/reports" element={<PartnerReports />} />
      </Routes>
    </AdminLayout>
  );
};

export default PartnerAdmin;
