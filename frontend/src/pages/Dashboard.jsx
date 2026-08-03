import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";
import {
    Users,
    ShieldCheck,
    Clock,
    CheckCircle,
    IndianRupee,
    ArrowRight,
    FileText,
    TrendingUp,
    PlusCircle
} from "lucide-react";

// 🔵 Customer View Component (Pure Local Storage Mode with Fallbacks & Strict Email Filtering)
const CustomerDashboard = () => {
    const navigate = useNavigate();

    const [userStats, setUserStats] = useState({
        activePoliciesCount: 0,
        pendingClaimsCount: 0,
        totalInsuredValue: 0,
        paymentsCount: 0
    });

    const loadCustomerData = useCallback(async () => {
        try {
            // 1. Logged-in user details
            const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
            const userEmail = (currentUser.email || currentUser.user_email || currentUser.username || "").trim().toLowerCase();

            // 2. Fetch directly from multiple potential LocalStorage keys
            let apiPolicies = [
                ...JSON.parse(localStorage.getItem("applied_policies") || "[]"),
                ...JSON.parse(localStorage.getItem("policies") || "[]"),
                ...JSON.parse(localStorage.getItem("user_policies") || "[]")
            ];
            let apiClaims = JSON.parse(localStorage.getItem("local_claims") || "[]");
            let apiPayments = JSON.parse(localStorage.getItem("local_payments") || "[]");

            // Remove duplicate policies based on id or policy_id
            apiPolicies = Array.from(new Set(apiPolicies.map(p => p.id || p.policy_id)))
                .map(id => apiPolicies.find(p => (p.id || p.policy_id) === id));

            // 3. Strict Email Filtering for Local Data
            if (userEmail) {
                const filteredPolicies = apiPolicies.filter(p => {
                    const pEmail = (p.user_email || p.customer_email || p.email || "").trim().toLowerCase();
                    return !pEmail || pEmail === userEmail;
                });
                if (filteredPolicies.length > 0) {
                    apiPolicies = filteredPolicies;
                }

                const filteredClaims = apiClaims.filter(c => {
                    const cEmail = (c.user_email || c.customer_email || c.email || "").trim().toLowerCase();
                    return !cEmail || cEmail === userEmail;
                });
                if (filteredClaims.length > 0) {
                    apiClaims = filteredClaims;
                }
            }

            // Filter only active/approved policies and exclude rejected/cancelled ones
            const activePolicies = apiPolicies.filter(
                (p) => p.status !== "Cancelled" && p.status !== "Rejected" && p.status !== "Pending" && p.status !== "Pending Approval"
            );
            
            const pendingClaims = apiClaims.filter(
                (c) => c.status === "Pending" || c.status === "Pending Approval" || !c.status
            );

            const totalInsured = activePolicies.reduce(
                (sum, p) => sum + Number(p.coverage_amount || p.amount || p.sum_assured || 0),
                0
            );

            setUserStats({
                activePoliciesCount: activePolicies.length,
                pendingClaimsCount: pendingClaims.length,
                totalInsuredValue: totalInsured,
                paymentsCount: apiPayments.length
            });
        } catch (err) {
            console.error("Error loading customer stats:", err);
        }
    }, []);

    useEffect(() => {
        loadCustomerData();
    }, [loadCustomerData]);

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-700 to-blue-900 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2 z-10">
                    <span className="px-3 py-1 bg-white/10 text-blue-100 text-xs font-semibold rounded-full tracking-wide uppercase border border-white/20">
                        Customer Portal
                    </span>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome Back!</h1>
                    <p className="text-blue-100 text-sm max-w-xl">
                        Manage your active insurance policies, track claim progress seamlessly, and review your coverage details in real time.
                    </p>
                </div>
                <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                    <ShieldCheck size={220} />
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div
                    onClick={() => navigate("/policies")}
                    className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
                >
                    <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Policies</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-0.5">
                            {userStats.activePoliciesCount}
                        </h3>
                    </div>
                </div>

                <div
                    onClick={() => navigate("/claims")}
                    className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all duration-200 group"
                >
                    <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pending Claims</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-0.5">
                            {userStats.pendingClaimsCount}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Insured Value</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-0.5">
                            ₹{userStats.totalInsuredValue.toLocaleString("en-IN")}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => navigate("/policies/request")}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-xl text-sm font-semibold transition cursor-pointer shadow-sm"
                    >
                        <PlusCircle className="w-4 h-4" /> Apply for New Policy
                    </button>
                    <button
                        onClick={() => navigate("/claims")}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl text-sm font-semibold transition cursor-pointer"
                    >
                        File or View Claims
                    </button>
                </div>
            </div>
        </div>
    );
};

// 🟠 Main Dashboard Component (Admin / Agent)
const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total_customers: 0,
        active_policies: 0,
        pending_claims: 0,
        approved_claims: 0,
        total_premium_collected: 0
    });
    const [loading, setLoading] = useState(true);

    const user = useMemo(() => {
        try {
            const parsed = JSON.parse(localStorage.getItem("user") || "{}");
            return {
                ...parsed,
                role: parsed?.role?.toLowerCase() || "customer"
            };
        } catch {
            return { role: "customer" };
        }
    }, []);

    const isAgent = user.role === "agent";
    const isExecutive = user.role === "admin" || isAgent;

    const fetchAdminStats = useCallback(async () => {
        setLoading(true);
        try {
            let localPolicies = [
                ...JSON.parse(localStorage.getItem("applied_policies") || "[]"),
                ...JSON.parse(localStorage.getItem("policies") || "[]"),
                ...JSON.parse(localStorage.getItem("user_policies") || "[]")
            ];
            
            localPolicies = Array.from(new Set(localPolicies.map(p => p.id || p.policy_id)))
                .map(id => localPolicies.find(p => (p.id || p.policy_id) === id));

            const localClaims = JSON.parse(localStorage.getItem("local_claims") || "[]");

            const totalRevenue = localPolicies.reduce(
                (sum, p) => sum + Number(p.coverage_amount || p.amount || p.sum_assured || 0),
                0
            );

            const pendingClaims = localClaims.filter(
                (c) => c.status === "Pending" || c.status === "Pending Approval" || !c.status
            ).length;

            const approvedClaims = localClaims.filter(
                (c) => c.status === "Approved"
            ).length;

            setStats({
                total_customers: localPolicies.length,
                active_policies: localPolicies.length,
                pending_claims: pendingClaims,
                approved_claims: approvedClaims,
                total_premium_collected: totalRevenue
            });
        } catch (err) {
            console.warn("Error fetching stats:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isExecutive) {
            fetchAdminStats();
        } else {
            setLoading(false);
        }
    }, [isExecutive, fetchAdminStats]);

    if (!isExecutive) {
        return <CustomerDashboard />;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[450px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
                <span className="ml-3 text-slate-600 font-medium">Loading Dashboard Metrics...</span>
            </div>
        );
    }

    const statCards = [
        {
            title: "Total Customers",
            value: stats.total_customers,
            icon: Users,
            color: "text-blue-600 bg-blue-50 border-blue-100"
        },
        {
            title: "Active Policies",
            value: stats.active_policies,
            icon: ShieldCheck,
            color: "text-emerald-600 bg-emerald-50 border-emerald-100"
        },
        {
            title: "Pending Claims",
            value: stats.pending_claims,
            icon: Clock,
            color: "text-amber-600 bg-amber-50 border-amber-100"
        },
        {
            title: "Approved Claims",
            value: stats.approved_claims,
            icon: CheckCircle,
            color: "text-indigo-600 bg-indigo-50 border-indigo-100"
        },
        {
            title: "Portfolio Insured Value",
            value: `₹${stats.total_premium_collected.toLocaleString("en-IN")}`,
            icon: IndianRupee,
            color: "text-orange-600 bg-orange-50 border-orange-100"
        }
    ];

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
            {/* Executive Banner */}
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${isAgent ? 'from-slate-900 via-blue-950 to-slate-900' : 'from-slate-900 via-slate-800 to-orange-950'} p-6 md:p-8 text-white shadow-xl`}>
                <div className="relative z-10 max-w-2xl space-y-3">
                    <span className="inline-block px-3 py-1 bg-white/10 text-orange-400 border border-white/20 text-xs font-semibold rounded-full tracking-wide uppercase">
                        InsurShield Platform {isAgent ? "Agent Workspace" : "Admin Dashboard"}
                    </span>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                        {isAgent ? "Field Operations & Verification" : "Protecting What Matters Most"}
                    </h1>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                        {isAgent 
                            ? "Review customer claims, verify insurance details, and register or approve policies efficiently."
                            : "Real-time insurance analytics, claim tracking, and portfolio management at your fingertips."}
                    </p>
                </div>

                <div className="absolute -right-10 -bottom-10 opacity-10 text-orange-500 pointer-events-none">
                    <ShieldCheck size={280} />
                </div>
            </div>

            {/* Stats Grid */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" /> Key Performance Indicators
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {statCards.map((card, idx) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3 group"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                                        {card.title}
                                    </span>
                                    <div className={`p-2.5 rounded-xl border ${card.color} group-hover:scale-105 transition`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                        {card.value}
                                    </h3>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-800">
                        {isAgent ? "Manage Claims & Policy Requests" : "Need to review claims or oversee policies?"}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {isAgent 
                            ? "Register policies on behalf of customers, check documents, and process pending claims."
                            : "Manage insurance products, update policyholder details, and approve pending claims quickly."}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {isAgent && (
                        <button
                            onClick={() => navigate("/policies/create")}
                            className="whitespace-nowrap px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
                        >
                            Register Policy <PlusCircle className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => navigate("/claims")}
                        className="whitespace-nowrap px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
                    >
                        Review Claims <Clock className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => navigate("/policies")}
                        className="whitespace-nowrap px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium text-sm rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
                    >
                        Policies <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;