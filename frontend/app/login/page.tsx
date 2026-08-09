"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // --- VALIDATION LOGIC ---
  
  // Name: Allow only letters and spaces
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const val = e.target.value.replace(/[^a-zA-Z\s]/g, ''); // Strip numbers and special chars
    setter(val);
  };

  // Phone: Allow exactly 10 digits only
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, ''); // Strip non-digits
    if (val.length <= 10) setPhone(val);
  };

  const validateEmail = (val: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Frontend validation checks before sending to backend
    if (!isLogin) {
      if (!validateEmail(email)) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }
      if (phone && phone.length !== 10) {
        setError("Phone number must be exactly 10 digits.");
        setLoading(false);
        return;
      }
    }
    
    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);
        
        const res = await api.post("/auth/login", formData);
        localStorage.setItem("token", res.data.access_token);
        router.push("/trips");
      } else {
        await api.post("/auth/signup", { 
          first_name: firstName, 
          last_name: lastName, 
          email, 
          password,
          phone_number: phone || null
        });
        setIsLogin(true);
        setError("Signup successful! Please log in.");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err.message;
      setError(typeof msg === 'string' ? msg : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`A reset code has been sent to ${email} (Demo only).`);
    setShowForgotPassword(false);
    setIsLogin(true);
  };

  // --- FORGOT PASSWORD UI ---
  if (showForgotPassword) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://z-cdn-media.chatglm.cn/files/f66aa54a-f370-4739-8e85-576bf31b09c8.jpeg?auth_key=1885990140-11b6f8078b724142b6cc5cdfb0f19528-0-d1d2ef78938e16a5e0a6d72ba81984c4')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80"></div>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-between py-12 px-4 text-white">
          <h1 className="text-4xl font-bold tracking-wider drop-shadow-lg md:text-5xl">✈️ TripMate AI</h1>
          
          <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/30 border border-pink-400/50 text-3xl">🔑</div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md md:text-3xl">Forget Password?</h2>
              <p className="mt-2 text-sm text-gray-100">Enter your email to receive a reset code.</p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-100">Email Address <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/30 bg-white/10 p-3 text-white placeholder-gray-300 backdrop-blur-sm transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                  required
                />
              </div>
              <button type="submit" className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 p-3 font-semibold text-white shadow-md transition hover:from-pink-600 hover:to-purple-700">
                Send Code
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-200">
              <button onClick={() => { setShowForgotPassword(false); setIsLogin(true); }} className="font-semibold text-white hover:underline">
                Back to Login
              </button>
            </div>
          </div>
          <div className="max-w-2xl text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <h2 className="text-xl font-bold leading-snug md:text-2xl">Fly away to your next adventure</h2>
          </div>
        </div>
      </div>
    );
  }

  // --- LOGIN / SIGNUP UI ---
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://z-cdn-media.chatglm.cn/files/f66aa54a-f370-4739-8e85-576bf31b09c8.jpeg?auth_key=1885990140-11b6f8078b724142b6cc5cdfb0f19528-0-d1d2ef78938e16a5e0a6d72ba81984c4')" }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80"></div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-between py-12 px-4 text-white">
        <div className="w-full max-w-md flex justify-between items-center mb-4">
          <Link href="/" className="text-sm text-gray-200 hover:text-white transition-colors flex items-center gap-1">
            ← Back to Home
          </Link>
        </div>
        <h1 className="text-4xl font-bold tracking-wider drop-shadow-lg md:text-5xl">✈️ TripMate AI</h1>

        <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md md:text-3xl">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-gray-100">
              {isLogin ? "Log in to continue planning your trips." : "Start your AI travel planning today."}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-center text-sm text-red-100 border border-red-400/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-100">First Name <span className="text-red-400">*</span></label>
                    <input 
                      type="text" 
                      placeholder="John" 
                      value={firstName} 
                      onChange={(e) => handleNameChange(e, setFirstName)} 
                      className="w-full rounded-lg border border-white/30 bg-white/10 p-3 text-white placeholder-gray-300 backdrop-blur-sm transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-100">Last Name <span className="text-red-400">*</span></label>
                    <input 
                      type="text" 
                      placeholder="Doe" 
                      value={lastName} 
                      onChange={(e) => handleNameChange(e, setLastName)} 
                      className="w-full rounded-lg border border-white/30 bg-white/10 p-3 text-white placeholder-gray-300 backdrop-blur-sm transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none" 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-100">Phone Number (10 digits)</label>
                  <input 
                    type="tel" 
                    placeholder="1234567890" 
                    value={phone} 
                    onChange={handlePhoneChange} 
                    className="w-full rounded-lg border border-white/30 bg-white/10 p-3 text-white placeholder-gray-300 backdrop-blur-sm transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none" 
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-100">Email Address <span className="text-red-400">*</span></label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full rounded-lg border border-white/30 bg-white/10 p-3 text-white placeholder-gray-300 backdrop-blur-sm transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none" 
                required 
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-100">Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-white/30 bg-white/10 p-3 text-white placeholder-gray-300 backdrop-blur-sm transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-200 hover:text-white">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {!isLogin && (
                <p className="mt-1 text-xs text-gray-300">
                  Min 6 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char, no spaces.
                </p>
              )}
              {isLogin && (
                <div className="mt-2 text-right">
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-gray-200 hover:text-white hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 p-3 font-semibold text-white shadow-md transition hover:from-pink-600 hover:to-purple-700 disabled:opacity-50">
              {loading ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-200">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(""); }} className="font-semibold text-white hover:underline">
              {isLogin ? "Sign up here" : "Log in"}
            </button>
          </div>
        </div>

        <div className="max-w-2xl text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          <h2 className="text-xl font-bold leading-snug md:text-2xl">Fly away to your next adventure</h2>
          <p className="mt-2 text-sm text-gray-100 md:text-base">Your AI-powered travel concierge. Build itineraries, discover destinations, and chat with an AI that knows exactly what you need.</p>
        </div>
      </div>
    </div>
  );
}
