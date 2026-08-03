import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Customer');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Forgot Password Modal States
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await login(email, password, role);
        setLoading(false);

        if (result.success) {
            toast.success('Login Successful!');
            const userRole = (result.user?.role || role).toLowerCase();
            if (userRole === 'admin') {
                navigate('/admin/dashboard');
            } else if (userRole === 'agent') {
                navigate('/agent/dashboard');
            } else {
                navigate('/customer/dashboard');
            }
        } else {
            toast.error(result.error || 'Invalid credentials. Please try again.');
        }
    };

    // Forgot Password API / Handler
    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        if (!forgotEmail) {
            toast.error('Kripya apna email enter karein!');
            return;
        }
        setForgotLoading(true);
        
        try {
            // Yahan aap apni backend API call kar sakte hain, jaise:
            // await axios.post('/api/auth/forgot-password', { email: forgotEmail });
            
            // Simulating API delay
            setTimeout(() => {
                setForgotLoading(false);
                toast.success(`Password reset link ${forgotEmail} par bhej diya gaya hai!`);
                setShowForgotModal(false);
                setForgotEmail('');
            }, 1000);
        } catch (error) {
            setForgotLoading(false);
            toast.error('Kuch gadbad ho gayi. Dobara koshish karein.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-orange-600 p-3 rounded-2xl text-white shadow-lg shadow-orange-200 mb-2 font-bold text-lg">
                        IS
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">InsurShield Login</h2>
                    <p className="text-slate-500 text-sm">Sign in to access your dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-semibold text-slate-600 uppercase">Password</label>
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(true)}
                                className="text-xs font-semibold text-orange-600 hover:underline focus:outline-none cursor-pointer"
                            >
                                Forgot Password?
                            </button>
                        </div>
                        <div className="relative flex items-center">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 pr-16 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 text-xs font-bold text-orange-600 hover:text-orange-700 focus:outline-none bg-orange-50 px-2.5 py-1 rounded-md cursor-pointer"
                            >
                                {showPassword ? 'HIDE' : 'SHOW'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Login As Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white cursor-pointer"
                        >
                            <option value="Customer">Customer / Policy Holder</option>
                            <option value="Agent">Agent</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-orange-200 disabled:opacity-50 cursor-pointer mt-2"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-orange-600 font-semibold hover:underline">
                        Register Here
                    </Link>
                </p>
            </div>

            {/* Forgot Password Modal Popup */}
            {showForgotModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Reset Password</h3>
                        <p className="text-slate-500 text-xs mb-4">Apna registered email enter karein, hum aapko password reset link bhejenge.</p>
                        
                        <form onSubmit={handleForgotSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-all text-sm cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 rounded-xl transition-all text-sm shadow-md shadow-orange-200 disabled:opacity-50 cursor-pointer"
                                >
                                    {forgotLoading ? 'Sending...' : 'Send Link'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;