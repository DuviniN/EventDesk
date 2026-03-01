import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { resetPassword } from "../features/auth/authApi";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validatePassword = (password) => {
    const passwordErrors = [];
    if (password.length < 8) passwordErrors.push('at least 8 characters');
    if (!/[a-z]/.test(password)) passwordErrors.push('a lowercase letter');
    if (!/[A-Z]/.test(password)) passwordErrors.push('an uppercase letter');
    if (!/[0-9]/.test(password)) passwordErrors.push('a number');
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password)) {
      passwordErrors.push('a special character');
    }
    return passwordErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    
    if (!token) {
      newErrors.submit = 'Invalid reset token. Please request a new password reset link.';
      setErrors(newErrors);
      return;
    }
    
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      newErrors.password = `Password must contain ${passwordErrors.join(', ')}`;
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      console.log('Sending reset request with token:', token);
      await resetPassword({ token, password: formData.password });
      setSuccess(true);
      toast.success("Password reset successful!");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.message || "Failed to reset password");
      setErrors({ submit: error.message || "Failed to reset password. The token may be invalid or expired." });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Invalid Reset Link</h2>
          <p className="text-gray-400 mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password">
            <Button variant="primary">Request New Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left Column - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-purple-600"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold mb-6">Create New Password</h1>
            <p className="text-xl mb-8 text-purple-100">
              Choose a strong password to secure your account.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-900">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/login" className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 mb-8">
              <ArrowLeft size={20} />
              <span>Back to Login</span>
            </Link>
            
            <Link to="/" className="flex items-center space-x-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="text-white text-2xl font-bold">EventDesk</span>
            </Link>
            
            <h2 className="text-3xl font-bold text-white mb-2">Set New Password</h2>
            <p className="text-gray-400">Enter your new password below.</p>
            {token && (
              <p className="text-xs text-green-500 mt-2">✓ Reset token verified</p>
            )}
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.submit && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {errors.submit}
                </div>
              )}

              <Input
                label="New Password"
                type="password"
                name="password"
                placeholder="Enter new password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
              />

              {formData.password && (
                <div className="text-xs text-gray-400 -mt-2 mb-4 space-y-1">
                  <p className="font-semibold mb-1">Password must include:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <p className={formData.password.length >= 8 ? 'text-green-500' : 'text-gray-500'}>
                      ✓ 8+ characters
                    </p>
                    <p className={/[a-z]/.test(formData.password) ? 'text-green-500' : 'text-gray-500'}>
                      ✓ Lowercase (a-z)
                    </p>
                    <p className={/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-500'}>
                      ✓ Uppercase (A-Z)
                    </p>
                    <p className={/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-gray-500'}>
                      ✓ Number (0-9)
                    </p>
                    <p className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-500' : 'text-gray-500'}>
                      ✓ Special char (!@#$...)
                    </p>
                  </div>
                </div>
              )}

              <Input
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
              />

              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>
          ) : (
            <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-6 rounded-lg text-center">
              <CheckCircle size={48} className="mx-auto mb-4" />
              <h3 className="font-semibold text-xl mb-2">Password Reset Successful!</h3>
              <p className="text-sm mb-4">
                Your password has been updated. Redirecting to login...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
