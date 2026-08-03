import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, User, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
    const navigate = useNavigate();

    // Form Fields State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('customer'); // Default role

    const handleRegister = (e) => {
        e.preventDefault();

        // 🟢 REGISTER LOGIC
        const existingUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const userExists = existingUsers.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());

        if (userExists) {
            toast.error('This Email is already registered!');
            return;
        }

        const newUser = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            role: role,
        };

        // Save to localStorage
        existingUsers.push(newUser);
        localStorage.setItem('registered_users', JSON.stringify(existingUsers));

        toast.success('Registration successful! Please sign in.');
        navigate('/login'); // Redirect to separate login page
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6">

                {/* Brand Header */}
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold mx-auto text-xl shadow-lg shadow-orange-600/30">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        Create an Account
                    </h2>
                    <p className="text-xs text-slate-500">
                        Fill details to register as a new user on InsurShield
                    </p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">

                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <User className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="e.g. Vinod Sharma"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Email Address */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Mail className="w-4 h-4" />
                            </span>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Lock className="w-4 h-4" />
                            </span>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Role Dropdown */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Select Role</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <UserCheck className="w-4 h-4" />
                            </span>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-700 cursor-pointer"
                            >
                                <option value="customer">Customer / Policy Holder</option>
                                <option value="admin">Admin / Agent</option>
                            </select>
                        </div>
                    </div>

                    {/* Submit Action Button */}
                    <button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 rounded-xl transition shadow-md cursor-pointer text-sm mt-2"
                    >
                        Register Account
                    </button>
                </form>

                {/* Switch to Login Link */}
                <div className="pt-2 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-orange-600 font-bold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    );
};

export default RegisterPage;