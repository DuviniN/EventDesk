import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { ArrowLeft, Mail } from "lucide-react";
import { forgotPassword } from "../features/auth/authApi";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await forgotPassword({ email });
      setSent(true);
      setResetToken(data.resetToken);
      toast.success("Password reset token generated!");
    } catch (error) {
      toast.error(error.message || "Failed to generate reset token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left Column - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-purple-600"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold mb-6">Forgot Your Password?</h1>
            <p className="text-xl mb-8 text-purple-100">
              No worries! Enter your email and we'll send you instructions to reset your password.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Mail className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">Check Your Email</h3>
                  <p className="text-sm text-purple-100">We'll send reset instructions</p>
                </div>
              </div>
            </div>
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
            
            <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-gray-400">Enter your email to receive reset instructions.</p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </Button>
            </form>
          ) : (
            <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-6 rounded-lg">
              <h3 className="font-semibold mb-2">Reset Token Generated!</h3>
              <p className="text-sm mb-4 text-gray-300">
                Your password reset token for <strong className="text-white">{email}</strong>:
              </p>
              
              <div className="bg-gray-800 p-3 rounded mb-4 break-all">
                <code className="text-purple-400 text-xs">{resetToken}</code>
              </div>
              
              <p className="text-xs text-gray-400 mb-4">
                Note: In production, this would be sent via email. For development, use the link below.
              </p>
              
              <Link to={`/reset-password?token=${resetToken}`}>
                <Button variant="primary" className="w-full">
                  Reset Password Now
                </Button>
              </Link>
              
              <p className="text-xs text-gray-400 mt-4">
                <button 
                  onClick={() => { setSent(false); setResetToken(""); }} 
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  Generate new token
                </button>
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Remember your password?{" "}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
