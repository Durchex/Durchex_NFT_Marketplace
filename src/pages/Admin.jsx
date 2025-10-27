import { useEffect } from "react";
import { useAdmin } from "../Context/AdminContext";
import { ErrorToast } from "../app/Toast/Error";
import { useNavigate, Routes, Route } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import Dashboard from "./admin/Dashboard";
import Users from "./admin/Users";
import NFTs from "./admin/NFTs";
import Transactions from "./admin/Transactions";
import Orders from "./admin/Orders";
import Analytics from "./admin/Analytics";
import Activity from "./admin/Activity";
import Reports from "./admin/Reports";
import Settings from "./admin/Settings";

const Admin = () => {
  const navigate = useNavigate();
  const { hasAdminAccess } = useAdmin();

  // Admin authentication check
  useEffect(() => {
    if (!hasAdminAccess()) {
      ErrorToast("Admin authentication required");
      navigate("/admin-login");
      return;
    }
  }, [hasAdminAccess, navigate]);

  // Redirect to dashboard if on admin root
  useEffect(() => {
    if (hasAdminAccess() && window.location.pathname === '/admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [hasAdminAccess, navigate]);

  return (
    <AdminLayout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/nfts" element={<NFTs />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AdminLayout>
  );
};

export default Admin;