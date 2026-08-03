import React, { useEffect, useState, useCallback, useMemo } from "react";
import API from "../api/axiosInstance";
import {
    Shield,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Download,
    Check,
    X,
    RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

const Policies = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // 🔒 Safely Memoize and Normalize User Object
    const user = useMemo(() => {
        try {
            const parsed = JSON.parse(localStorage.getItem("user")) || {
                role: "customer",
                email: "customer@example.com"
            };
            return {
                ...parsed,
                role: parsed?.role?.toLowerCase() || "customer"
            };
        } catch {
            return { role: "customer", email: "customer@example.com" };
        }
    }, []);

    const isExecutive = user.role === "admin" || user.role === "agent";

    // 🔄 Sync and Update Reports Storage Helper
    const syncReportsData = (updatedPoliciesList) => {
        try {
            localStorage.setItem("applied_policies", JSON.stringify(updatedPoliciesList));
            
            // Generate and update reports metrics payload for Reports/Analytics components
            const totalPolicies = updatedPoliciesList.length;
            const activePolicies = updatedPoliciesList.filter(p => p.status === "Approved" || p.status === "Active").length;
            const pendingPolicies = updatedPoliciesList.filter(p => p.status === "Pending" || p.status === "Pending Approval").length;
            const rejectedPolicies = updatedPoliciesList.filter(p => p.status === "Rejected" || p.status === "Cancelled").length;
            
            const reportsMetrics = {
                total_policies: totalPolicies,
                active_policies: activePolicies,
                pending_policies: pendingPolicies,
                rejected_policies: rejectedPolicies,
                last_updated: new Date().toISOString()
            };
            
            localStorage.setItem("system_reports_metrics", JSON.stringify(reportsMetrics));
        } catch (err) {
            console.warn("Failed to sync reports local storage:", err);
        }
    };

    // 🔄 Fetch Policies
    const fetchPolicies = useCallback(async () => {
        setLoading(true);
        try {
            let apiPolicies = [];
            try {
                const endpoint = isExecutive ? "/policies" : "/policies/my-policies";
                const res = await API.get(endpoint);
                apiPolicies = res.data || [];
            } catch (apiErr) {
                console.warn("Backend API offline. Loading local policies only.");
            }

            let localPolicies = [];
            try {
                localPolicies = JSON.parse(
                    localStorage.getItem("applied_policies") || "[]"
                );
            } catch (e) {
                console.warn("Invalid local storage format for applied_policies");
            }

            // Combine & Deduplicate by ID
            const combinedMap = new Map();
            [...localPolicies, ...apiPolicies].forEach((item) => {
                if (item?.id) combinedMap.set(item.id, item);
            });

            let combinedPolicies = Array.from(combinedMap.values());

            // Sync back to storage to ensure reports have complete initial pool
            syncReportsData(combinedPolicies);

            // 🔒 FIX: Strict Filter for Customer View (Checks user_email and customer_email case-insensitively)
            if (!isExecutive) {
                combinedPolicies = combinedPolicies.filter((p) => {
                    const policyEmail = p.user_email || p.customer_email || "";
                    return policyEmail.toLowerCase() === user.email.toLowerCase();
                });
            }

            setPolicies(combinedPolicies);
        } catch (error) {
            console.error("Error loading policies:", error);
        } finally {
            setLoading(false);
        }
    }, [isExecutive, user.email]);

    useEffect(() => {
        fetchPolicies();
    }, [fetchPolicies]);

    // 📄 Handle Document Download Feature
    const handleDownloadDocument = (policy) => {
        const documentContent = `========================================\n                INSURSHIELD POLICY DOCUMENT            \n========================================\n\nPolicy ID       : ${policy.id}\nPolicy Name     : ${policy.policy_name}\nApplicant Email : ${policy.user_email || policy.customer_email || user.email}\nCoverage Amount : ₹${Number(policy.coverage_amount || 0).toLocaleString("en-IN")}\nApplied Date    : ${policy.applied_date || "—"}\nStatus          : ${policy.status}\n\n========================================\nThis is a system-generated document.\n`;

        const blob = new Blob([documentContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Policy_${policy.id}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Policy document downloaded successfully!");
    };

    // Executive Action: Update Status (Approve / Reject) for Admin & Agent
    const handleStatusUpdate = async (policyId, newStatus) => {
        try {
            await API.patch(`/policies/${policyId}`, { status: newStatus }).catch(() => {
                console.log("Updated status locally.");
            });

            const updatedPolicies = policies.map((p) =>
                p.id === policyId ? { ...p, status: newStatus } : p
            );
            setPolicies(updatedPolicies);

            let localPolicies = [];
            try {
                localPolicies = JSON.parse(
                    localStorage.getItem("applied_policies") || "[]"
                );
            } catch {
                localPolicies = [];
            }

            const updatedLocal = localPolicies.map((p) =>
                p.id === policyId ? { ...p, status: newStatus } : p
            );
            
            // Sync updated status to reports storage as well
            syncReportsData(updatedLocal);

            toast.success(`Policy status updated to ${newStatus}`);
        } catch (err) {
            console.error("Failed to update policy status:", err);
            toast.error("Failed to update status.");
        }
    };

    // Status Badge Helper
    const getStatusBadge = (status) => {
        switch (status) {
            case "Active":
            case "Approved":
                return (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" /> {status}
                    </span>
                );
            case "Pending Approval":
            case "Pending":
                return (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">
                        <Clock className="w-3.5 h-3.5" /> {status}
                    </span>
                );
            case "Rejected":
            case "Cancelled":
                return (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-red-100 text-red-700 rounded-full">
                        <XCircle className="w-3.5 h-3.5" /> {status}
                    </span>
                );
            default:
                return (
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                        {status}
                    </span>
                );
        }
    };

    // Filter Logic
    const filteredPolicies = policies.filter((p) => {
        const matchesSearch =
            p.policy_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === "All" ||
            p.status?.toLowerCase().includes(statusFilter.toLowerCase());

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-600 font-medium">Loading Policies...</span>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-7 h-7 text-blue-600" />
                        {isExecutive ? "All Platform Policies" : "My Active Policies"}
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">
                        {isExecutive 
                            ? "Review customer policy applications, verify status, and manage active policies."
                            : "View and manage your applied insurance policies."}
                    </p>
                </div>
                <button
                    onClick={fetchPolicies}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer self-start md:self-auto"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search policy name, ID, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-48 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Approved">Approved / Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected / Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Cards Grid */}
            {filteredPolicies.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
                    <Shield className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-700">No Policies Found</h3>
                    <p className="text-slate-500 text-sm">
                        {searchTerm || statusFilter !== "All"
                            ? "Try adjusting your search filters."
                            : "No policies available at the moment."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredPolicies.map((policy) => (
                        <div
                            key={policy.id}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col justify-between space-y-4"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md tracking-wider">
                                            {policy.id}
                                        </span>
                                        <h3 className="text-base font-bold text-slate-800 mt-2">
                                            {policy.policy_name}
                                        </h3>
                                    </div>
                                    {getStatusBadge(policy.status)}
                                </div>

                                <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 text-xs md:text-sm">
                                    {isExecutive && (policy.user_email || policy.customer_email) && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Applicant:</span>
                                            <span className="font-semibold text-slate-700 truncate max-w-[180px]">
                                                {policy.user_email || policy.customer_email}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Coverage Amount:</span>
                                        <span className="font-bold text-slate-800">
                                            ₹{Number(policy.coverage_amount || 0).toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Applied Date:</span>
                                        <span className="font-medium text-slate-700">
                                            {policy.applied_date || "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                <button
                                    onClick={() => handleDownloadDocument(policy)}
                                    className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold hover:text-blue-600 cursor-pointer"
                                >
                                    <Download className="w-3.5 h-3.5" /> Document
                                </button>

                                {/* Admin & Agent Action Buttons */}
                                {isExecutive &&
                                    (policy.status === "Pending" || policy.status === "Pending Approval") && (
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => handleStatusUpdate(policy.id, "Approved")}
                                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                                                title="Approve Policy"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(policy.id, "Rejected")}
                                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer"
                                                title="Reject Policy"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Policies;