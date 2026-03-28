import { React, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import API from '@/api';
import { FcGoogle } from 'react-icons/fc';
import logo from '../logo/logo.png';

export default function Signup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleGoogleSignup = () => {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        window.location.href = `${backendUrl}/api/auth/google`;
    };

    const validateForm = () => {
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields'); return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters'); return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match'); return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address'); return false;
        }
        return true;
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);
        if (!validateForm()) { setLoading(false); return; }
        try {
            const response = await API.post('/auth/signup', {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });
            localStorage.setItem('token', response.data.token);
            const userResponse = await API.get('/auth/me');
            localStorage.setItem('userData', JSON.stringify(userResponse.data));
            setSuccess(true);
        } catch (error) {
            console.error('Signup error:', error);
            setError(error.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "h-12 rounded-2xl text-white placeholder:text-white/25 font-medium";
    const inputStyle = { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
    const labelClass = "text-white/60 text-xs font-black tracking-widest uppercase";

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-6">
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(184,151,90,0.08) 0%, transparent 70%)' }} />
                <div className="relative z-10 text-center max-w-md w-full">
                    <div className="w-24 h-24 rounded-[2rem] mx-auto mb-8 flex items-center justify-center shadow-2xl"
                        style={{ background: 'linear-gradient(135deg, #B8975A, #D4B88C)' }}>
                        <CheckCircle2 className="h-12 w-12 text-black" />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Account Created!</h2>
                    <p className="text-white/50 text-lg mb-2">
                        We've sent a verification email to
                    </p>
                    <p className="font-black mb-8" style={{ color: '#B8975A' }}>{formData.email}</p>
                    <p className="text-white/30 text-sm mb-10">
                        Check your inbox and click the verification link to activate your account.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full h-12 rounded-2xl font-black text-black text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-2xl"
                        style={{ background: 'linear-gradient(135deg, #B8975A, #D4B88C, #B8975A)' }}
                    >
                        Go to Login <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-[#0A0A0A] font-sans overflow-hidden">
            {/* Left decorative panel */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1a1208] to-black" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px]"
                    style={{ background: 'radial-gradient(circle, rgba(184,151,90,0.25) 0%, transparent 70%)' }} />
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23B8975A' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
                <div className="relative z-10 text-center px-12 max-w-lg">
                    <img src={logo} alt="Dhahabu Themanini" className="h-28 w-auto mx-auto mb-10 brightness-110" />
                    <h2 className="text-5xl font-black text-white tracking-tighter leading-[0.95] mb-6">
                        Join the <br /><span style={{ color: '#B8975A' }}>Dhahabu</span> <br />Family.
                    </h2>
                    <p className="text-white/50 text-lg font-medium leading-relaxed">
                        Create your account to access the Moran Project management platform.
                    </p>
                </div>
            </div>

            {/* Right form panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
                <div className="absolute inset-0 bg-[#0F0F0F]" />
                <div className="absolute top-0 right-0 w-96 h-96 blur-[160px] opacity-10"
                    style={{ background: 'radial-gradient(circle, #B8975A, transparent)' }} />

                <div className="relative z-10 w-full max-w-md">
                    <div className="lg:hidden text-center mb-8">
                        <img src={logo} alt="Dhahabu Themanini" className="h-16 w-auto mx-auto brightness-110" />
                    </div>

                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black tracking-[0.2em] uppercase mb-5"
                            style={{ borderColor: 'rgba(184,151,90,0.4)', color: '#B8975A', backgroundColor: 'rgba(184,151,90,0.05)' }}>
                            New Account
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Create Account</h1>
                        <p className="text-white/40 font-medium">Join Dhahabu Themanini Platform</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        {error && (
                            <Alert className="border border-red-900 bg-red-950/50">
                                <AlertCircle className="h-4 w-4 text-red-400" />
                                <AlertDescription className="text-red-400">{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label className={labelClass}>Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#B8975A' }} />
                                <Input name="name" type="text" placeholder="Enter your full name"
                                    value={formData.name} onChange={handleInputChange} disabled={loading}
                                    className={`pl-11 ${inputClass}`} style={inputStyle} />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label className={labelClass}>Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#B8975A' }} />
                                <Input name="email" type="email" placeholder="Enter your email"
                                    value={formData.email} onChange={handleInputChange} disabled={loading}
                                    className={`pl-11 ${inputClass}`} style={inputStyle} />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label className={labelClass}>Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#B8975A' }} />
                                <Input name="password" type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 6 characters"
                                    value={formData.password} onChange={handleInputChange} disabled={loading}
                                    className={`pl-11 pr-11 ${inputClass}`} style={inputStyle} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label className={labelClass}>Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#B8975A' }} />
                                <Input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword} onChange={handleInputChange} disabled={loading}
                                    className={`pl-11 pr-11 ${inputClass}`} style={inputStyle} />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full h-12 rounded-2xl font-black text-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-2xl mt-2"
                            style={{ background: 'linear-gradient(135deg, #B8975A, #D4B88C, #B8975A)' }}>
                            {loading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Creating Account...</>
                            ) : (
                                <>Create Account <ArrowRight className="h-4 w-4" /></>
                            )}
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-xs text-white/30 font-medium">or</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        <button type="button" onClick={handleGoogleSignup} disabled={loading}
                            className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl border text-sm font-bold text-white/70 transition-all hover:text-white hover:border-white/20"
                            style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <FcGoogle className="w-5 h-5" />
                            Continue with Google
                        </button>

                        <p className="text-center text-sm text-white/30">
                            Already have an account?{' '}
                            <Link to="/login" className="font-black transition-colors" style={{ color: '#B8975A' }}>
                                Sign in
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}