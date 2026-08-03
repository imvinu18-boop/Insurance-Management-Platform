import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    FileCheck2,
    ClipboardList,
    Users,
    BarChart3,
    FileUp,
    CreditCard,
    LogOut,
    User as UserIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    // Safe role lowercase conversion to prevent any mismatch issues
    const role = user?.role ? String(user.role).toLowerCase() : 'customer';

    const handleLogout = async () => {
        try {
            if (logout) {
                await logout();
            }
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            localStorage.clear();
            toast.success("Logged out successfully");
            window.location.href = '/login';
        }
    };

    // Base navigation links with proper Role Differentiation
    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'agent', 'customer'] },
        { label: 'Policies', path: '/policies', icon: FileCheck2, roles: ['admin', 'agent', 'customer'] },
        
        // 💳 Customer Ke Liye: "Payments"
        { label: 'Payments', path: '/payments', icon: CreditCard, roles: ['customer'] },
        
        // 📊 Admin & Agent Ke Liye: "Transactions"
        { label: 'Transactions', path: '/transactions', icon: CreditCard, roles: ['admin', 'agent'] },

        { label: 'Claims', path: '/claims', icon: ClipboardList, roles: ['admin', 'agent', 'customer'] },
        { label: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'agent'] },
        { label: 'Documents', path: '/documents', icon: FileUp, roles: ['admin', 'agent', 'customer'] },
        { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin'] },
    ];

    const filteredItems = navItems.filter(item => item.roles.includes(role));

    // Role badge color helper
    const getRoleBadgeClass = (userRole) => {
        const r = String(userRole || '').toLowerCase();
        if (r === 'admin') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        if (r === 'agent') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    };

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex shrink-0 border-r border-slate-800">
            <div className="space-y-1.5 overflow-y-auto">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">Main Menu</p>
                {filteredItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                                    isActive
                                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' 
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'    
                                }`
                            }
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </div>

            <div className="space-y-3 pt-4 mt-auto border-t border-slate-800">
                {/* User Profile Card inside Sidebar */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                        <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow">
                            {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                        </div>
                        <div className="overflow-hidden text-xs">
                            <p className="font-bold text-slate-200 truncate">{user.name}</p>
                            <p className="text-slate-400 truncate text-[11px]">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getRoleBadgeClass(role)}`}>
                            {role}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1 rounded-lg transition font-medium cursor-pointer"
                            title="Logout"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>

                {/* System Status Indicator */}
                <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/40 text-xs text-slate-400">
                    <p className="font-semibold text-slate-300 mb-0.5 text-[11px]">System Status</p>
                    <div className="flex items-center space-x-2 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>API Connected (001)</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;