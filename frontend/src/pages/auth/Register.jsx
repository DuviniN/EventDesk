import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { Zap, CreditCard, Target, TrendingUp } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "attendee",
    marketingConsent: false,
    termsAccepted: false
  });
  const [errors, setErrors] = useState({});
  const { register, loading } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (!/^[\p{L} ]+$/u.test(formData.name.trim())) {
      newErrors.name = 'Name can only contain letters and spaces';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordErrors = [];
      if (formData.password.length < 8) {
        passwordErrors.push('at least 8 characters');
      }
      if (!/[a-z]/.test(formData.password)) {
        passwordErrors.push('a lowercase letter');
      }
      if (!/[A-Z]/.test(formData.password)) {
        passwordErrors.push('an uppercase letter');
      }
      if (!/[0-9]/.test(formData.password)) {
        passwordErrors.push('a number');
      }
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
        passwordErrors.push('a special character');
      }
      
      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain ${passwordErrors.join(', ')}`;
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#6a317f] via-[#6a317f]/75 to-white">
      {/* Left Column - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#6a317f]"></div>
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold mb-6 text-white">Join EventDesk Today!</h1>
            <p className="text-xl mb-8 text-white/85">
              Start creating amazing events and selling tickets in minutes.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/15 rounded-lg flex items-center justify-center shadow-sm">
                  <Zap className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Quick Setup</h3>
                  <p className="text-sm text-white/80">Get started in under 5 minutes</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/15 rounded-lg flex items-center justify-center shadow-sm">
                  <CreditCard className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Secure Payments</h3>
                  <p className="text-sm text-white/80">Integrated Stripe & PayPal processing</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/15 rounded-lg flex items-center justify-center shadow-sm">
                  <Target className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Complete Tools</h3>
                  <p className="text-sm text-white/80">Everything you need to manage events</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/15 rounded-lg flex items-center justify-center shadow-sm">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Real-time Analytics</h3>
                  <p className="text-sm text-white/80">Track performance and grow your events</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="flex items-center space-x-2 mb-8">
              <div className="w-10 h-10 bg-[#6a317f] rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="text-[#6a317f] text-2xl font-bold">EventDesk</span>
            </Link>
            <h2 className="text-3xl font-bold text-[#6a317f] mb-2">Create Account</h2>
            <p className="text-[#6a317f]">Join thousands of event organizers today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}
            
            <Input
              label="Full Name"
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />

            <div className="relative">
              <label htmlFor="role" className="block text-sm font-medium text-slate-800 mb-2">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-colors"
                required
              >
                <option value="attendee">
                  Attendee - Purchase tickets and attend events
                </option>
                <option value="organizer">
                  Organizer - Create and manage events
                </option>
              </select>
            </div>

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Min 8 chars, with A-Z, a-z, 0-9, special char"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
            
            {formData.password && (
              <div className="text-xs text-slate-600 -mt-2 mb-4 space-y-1">
                <p className="font-semibold mb-1">Password must include:</p>
                <div className="grid grid-cols-2 gap-1">
                  <p className={formData.password.length >= 8 ? 'text-green-600' : 'text-slate-400'}>
                    ✓ 8+ characters
                  </p>
                  <p className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}>
                    ✓ Lowercase (a-z)
                  </p>
                  <p className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}>
                    ✓ Uppercase (A-Z)
                  </p>
                  <p className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}>
                    ✓ Number (0-9)
                  </p>
                  <p className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}>
                    ✓ Special char (!@#$...)
                  </p>
                </div>
              </div>
            )}

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
            />

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                name="termsAccepted"
                className="mt-1 mr-2 rounded border-slate-300"
                checked={formData.termsAccepted}
                onChange={handleChange}
                required
              />
              <label htmlFor="terms" className="text-sm text-slate-600">
                I agree to the{" "}
                <Link to="/terms" className="text-purple-600 hover:text-purple-700">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-purple-600 hover:text-purple-700">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="marketing"
                name="marketingConsent"
                className="mt-1 mr-2 rounded border-slate-300"
                checked={formData.marketingConsent}
                onChange={handleChange}
              />
              <label htmlFor="marketing" className="text-sm text-slate-600">
                I want to receive promotional emails about upcoming events
              </label>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center px-4 py-3 border border-purple-100 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-slate-800">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                  <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                  <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                  <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
                </svg>
                <span className="text-slate-800 text-sm">Google</span>
              </button>
              <button className="flex items-center justify-center px-4 py-3 border border-purple-100 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-slate-800">
                <svg className="w-5 h-5 mr-2" fill="white" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="text-slate-800 text-sm">GitHub</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
