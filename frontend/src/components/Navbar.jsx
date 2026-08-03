import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Navbar = () => {
    const authContext = useAuth();
    const logout = authContext?.logout;
    const navigate = useNavigate();

    const handleLogout = async (e) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }

        try {
            if (logout && typeof logout === 'function') {
                await logout();
            }
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            // Local storage se saare credentials turant clear karein
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            localStorage.clear(); // Ensure all cached local state is wiped out
            
            toast.success("Logged out successfully");
            
            // React Router navigation ke sath-sath window location hard redirect use karein
            // Taki state completely flush ho jaye aur UI turant update ho
            window.location.href = '/login';
        }
    };

    // Role Badge Color (Safe lowercase role handling)
    const getRoleBadgeClass = (role) => {
        const normalizedRole = role ? String(role).toLowerCase() : 'customer';
        switch (normalizedRole) {
            case 'admin':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'agent':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        }
    };

    const currentUser = authContext?.user;

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo & Brand Title */}
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <div className="bg-orange-600 p-2 rounded-xl text-white shadow-md shadow-orange-200">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                                InsurShield
                            </span>
                            <span className="text-xs block text-slate-400 font-medium">Platform 001</span>
                        </div>
                    </div>

                    {/* User Profile & Actions */}
                    {currentUser && (
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                                <div className="bg-orange-100 text-orange-700 p-1.5 rounded-full">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                                <div className="text-left text-xs">
                                    <p className="font-semibold text-slate-800 leading-tight">{currentUser.name}</p>
                                    <p className="text-slate-500 leading-tight">{currentUser.email}</p>
                                </div>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getRoleBadgeClass(currentUser.role)}`}>
                                    {currentUser.role}
                                </span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-1 text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;