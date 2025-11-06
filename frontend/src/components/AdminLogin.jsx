import React, { useState, useEffect } from 'react';
import { useAdmin } from '../Context/AdminContext';
import { FiShield, FiEye, FiEyeOff, FiUser, FiLock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const { adminLogin, isLoading, isAdminLoggedIn, isPartner } = useAdmin();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (isAdminLoggedIn) {
      if (isPartner()) {
        navigate('/admin/partner/dashboard', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [isAdminLoggedIn, isPartner, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email or username is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const success = await adminLogin(formData.email, formData.password);
    if (success) {
      // Check if user is a partner and redirect accordingly
      // Note: isPartner() might not be immediately available, so we check the role from the login
      // The useEffect above will handle the redirect based on the actual role
      setTimeout(() => {
        if (isPartner()) {
          navigate('/admin/partner/dashboard', { replace: true });
        } else {
          navigate('/admin/dashboard', { replace: true });
        }
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="font-display text-gray-400">Access the admin dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email/Username Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-display font-medium text-gray-300 mb-2">
                Email or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.email ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Enter email or username"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400 font-display">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-display font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-xl bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.password ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400 font-display">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-xl text-sm font-display font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
            <h3 className="text-sm font-display font-medium text-gray-300 mb-2">Demo Credentials:</h3>
            <div className="space-y-1 text-xs text-gray-400 font-display">
              <p><strong>Super Admin:</strong> admin@durchex.com / admin123</p>
              <p><strong>Moderator:</strong> moderator@durchex.com / mod123</p>
              <p><strong>Partner/Investor:</strong> partner@durchex.com / partner123</p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white font-display text-sm transition-colors duration-200"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
