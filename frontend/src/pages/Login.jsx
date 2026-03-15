import { React, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import API from '@/api';
import { FcGoogle } from 'react-icons/fc';
import logo from '../logo/logo.png';

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            if (!formData.email || !formData.password) {
                setError('Please fill in all fields');
                setLoading(false);
                return;
            }
            const response = await API.post('/auth/login', {
                email: formData.email,
                password: formData.password
            });
            localStorage.setItem('token', response.data.token);
            const userResponse = await API.get('/auth/me');
            localStorage.setItem('userData', JSON.stringify(userResponse.data));
            navigate('/admin/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            setError(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        window.location.href = `${backendUrl}/api/auth/google`;
    };

    return (
        <div className="min-h-screen flex bg-[#0A0A0A] font-sans overflow-hidden">
            {/* Left panel — decorative */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
                {/* Layered radial glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1a1208] to-black" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px]"
                    style={{ background: 'radial-gradient(circle, rgba(184,151,90,0.25) 0%, transparent 70%)' }} />
                {/* Diamond pattern */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23B8975A' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />

                <div className="relative z-10 text-center px-12 max-w-lg">
                    <img src={logo} alt="Dhahabu Themanini" className="h-28 w-auto mx-auto mb-10 brightness-110" />
                    <h2 className="text-5xl font-black text-white tracking-tighter leading-[0.95] mb-6">
                        Honoring <br />
                        <span style={{ color: '#B8975A' }}>Heritage.</span> <br />
                        Driving <span style={{ color: '#B8975A' }}>Excellence.</span>
                    </h2>
                    <p className="text-white/50 text-lg font-medium leading-relaxed">
                        Comprehensive data management for the Moran Project — where tradition meets precision.
                    </p>
                    <div className="mt-12 flex items-center justify-center gap-4">
                        {['Ithemba', 'Junior Moran', 'Cut-to-ID', 'Alumni'].map((p, i) => (
                            <div key={i} className="px-3 py-1.5 rounded-full border text-xs font-bold tracking-widest uppercase"
                                style={{ borderColor: 'rgba(184,151,90,0.3)', color: 'rgba(184,151,90,0.7)' }}>
                                {p}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
                <div className="absolute inset-0 bg-[#0F0F0F]" />
                <div className="absolute top-0 right-0 w-96 h-96 blur-[160px] opacity-10"
                    style={{ background: 'radial-gradient(circle, #B8975A, transparent)' }} />

                <div className="relative z-10 w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-10">
                        <img src={logo} alt="Dhahabu Themanini" className="h-16 w-auto mx-auto brightness-110" />
                    </div>

                    <div className="mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black tracking-[0.2em] uppercase mb-6"
                            style={{ borderColor: 'rgba(184,151,90,0.4)', color: '#B8975A', backgroundColor: 'rgba(184,151,90,0.05)' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                            Admin Portal
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Welcome Back</h1>
                        <p className="text-white/40 font-medium">Sign in to Dhahabu Themanini Portal</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {successMessage && (
                            <Alert className="border border-emerald-800 bg-emerald-950/50 text-emerald-400">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{successMessage}</AlertDescription>
                            </Alert>
                        )}
                        {error && (
                            <Alert className="border border-red-900 bg-red-950/50">
                                <AlertCircle className="h-4 w-4 text-red-400" />
                                <AlertDescription className="text-red-400">{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Google */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl border text-sm font-bold text-white/70 transition-all hover:text-white hover:border-white/20"
                            style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}
                        >
                            <FcGoogle className="w-5 h-5" />
                            Continue with Google
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-xs text-white/30 font-medium">or email</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label className="text-white/60 text-xs font-black tracking-widest uppercase">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#B8975A' }} />
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="pl-11 h-12 rounded-2xl text-white placeholder:text-white/25 font-medium"
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label className="text-white/60 text-xs font-black tracking-widest uppercase">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#B8975A' }} />
                                <Input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    className="pl-11 pr-11 h-12 rounded-2xl text-white placeholder:text-white/25 font-medium"
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-xs font-bold tracking-wide transition-colors"
                                style={{ color: '#B8975A' }}>
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-2xl font-black text-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-2xl"
                            style={{ background: 'linear-gradient(135deg, #B8975A, #D4B88C, #B8975A)' }}
                        >
                            {loading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                            ) : (
                                <>Sign In <ArrowRight className="h-4 w-4" /></>
                            )}
                        </button>

                        <p className="text-center text-sm text-white/30">
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-black transition-colors" style={{ color: '#B8975A' }}>
                                Sign up
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}