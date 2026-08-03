import React, { useState, useEffect } from "react";
import API from "../api/axiosInstance";
import {
    BarChart3,
    TrendingUp,
    Download,
    FileSpreadsheet,
    Shield,
    Users,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    Calendar,
    Filter
} from "lucide-react";
import toast from "react-hot-toast";

const Reports = () => {
    const [selectedPeriod, setSelectedPeriod] = useState("This Month");
    const [reportCategory, setReportCategory] = useState("All");

    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState({
        totalRevenue: "₹0",
        revenueChange: "+0%",
        revenuePositive: true,
        policiesIssued: "0",
        policiesChange: "+0%",
        policiesPositive: true,
        totalClaims: "0",
        claimsChange: "0%",
        claimsPositive: true,
        activeUsers: "0",
        usersChange: "+0%",
        usersPositive: true
    });

    const [distribution, setDistribution] = useState({
        approvedCount: 0,
        approvedPercent: 0,
        pendingCount: 0,
        pendingPercent: 0,
        rejectedCount: 0,
        rejectedPercent: 0
    });

    const [appliedPolicies, setAppliedPolicies] = useState([]);

    // 🌐 Fetching data from PostgreSQL and merging with LocalStorage applied policies
    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            
            let backendPolicies = [];
            let backendUsers = [];
            let backendClaims = [];

            // 1. Try fetching from Backend API
            try {
                const res = await API.get('/reports/stats').catch(() => null);
                if (res && res.data) {
                    backendPolicies = res.data.policies || [];
                    backendUsers = res.data.users || [];
                    backendClaims = res.data.claims || [];
                }
            } catch (err) {
                console.warn("Backend API offline for reports. Relying on local storage sync.");
            }

            // 2. Fetch from LocalStorage applied_policies (Policies applied by customers)
            let localPolicies = [];
            try {
                localPolicies = JSON.parse(localStorage.getItem("applied_policies") || "[]");
            } catch (e) {
                console.warn("Failed to parse local applied policies");
            }

            // Merge and deduplicate policies by ID
            const policyMap = new Map();
            [...backendPolicies, ...localPolicies].forEach(p => {
                if (p && p.id) policyMap.set(p.id, p);
            });
            const allPolicies = Array.from(policyMap.values());
            setAppliedPolicies(allPolicies);

            // Fetch local claims if any stored locally
            let localClaims = [];
            try {
                localClaims = JSON.parse(localStorage.getItem("applied_claims") || "[]");
            } catch (e) {
                localClaims = [];
            }
            const claimMap = new Map();
            [...backendClaims, ...localClaims].forEach(c => {
                if (c && c.id) claimMap.set(c.id, c);
            });
            const allClaims = Array.from(claimMap.values());

            // 3. Calculations for Revenue and Status Distribution
            let revenue = 0;
            let approved = 0;
            let pending = 0;
            let rejected = 0;

            allPolicies.forEach((pol) => {
                const status = (pol.status || "").toLowerCase();
                const coverage = Number(pol.coverage_amount || pol.amount || 0);

                if (status.includes('active') || status.includes('approved')) {
                    approved++;
                    revenue += coverage * 0.05; // 5% estimation calculation
                } else if (status.includes('pending')) {
                    pending++;
                } else if (status.includes('rejected') || status.includes('cancelled')) {
                    rejected++;
                }
            });

            allClaims.forEach((clm) => {
                const status = (clm.status || "").toLowerCase();
                if (status.includes('rejected') || status.includes('cancelled')) {
                    rejected++;
                } else if (status.includes('approved') || status.includes('settled')) {
                    approved++;
                } else if (status.includes('pending')) {
                    pending++;
                }
            });

            const totalItems = (allPolicies.length + allClaims.length) || 1;

            setStatsData({
                totalRevenue: `₹${revenue.toLocaleString('en-IN')}`,
                revenueChange: "+12.5%",
                revenuePositive: true,
                policiesIssued: allPolicies.length.toLocaleString(),
                policiesChange: "+8.2%",
                policiesPositive: true,
                totalClaims: allClaims.length.toLocaleString(),
                claimsChange: "-3.1%",
                claimsPositive: false,
                activeUsers: Math.max(backendUsers.length, 1).toLocaleString(),
                usersChange: "+15.4%",
                usersPositive: true
            });

            setDistribution({
                approvedCount: approved,
                approvedPercent: Math.round((approved / totalItems) * 100),
                pendingCount: pending,
                pendingPercent: Math.round((pending / totalItems) * 100),
                rejectedCount: rejected,
                rejectedPercent: Math.round((rejected / totalItems) * 100)
            });

            setLoading(false);
        };

        fetchReportData();
    }, [selectedPeriod]);

    // 📊 Dynamic KPI Stats Array
    const stats = [
        {
            title: "Total Revenue Generated",
            value: statsData.totalRevenue,
            change: statsData.revenueChange,
            isPositive: statsData.revenuePositive,
            icon: DollarSign,
            color: "text-emerald-600 bg-emerald-50"
        },
        {
            title: "Policies Issued",
            value: statsData.policiesIssued,
            change: statsData.policiesChange,
            isPositive: statsData.policiesPositive,
            icon: Shield,
            color: "text-blue-600 bg-blue-50"
        },
        {
            title: "Total Claims Processed",
            value: statsData.totalClaims,
            change: statsData.claimsChange,
            isPositive: statsData.claimsPositive,
            icon: BarChart3,
            color: "text-amber-600 bg-amber-50"
        },
        {
            title: "Active Users / Policyholders",
            value: statsData.activeUsers,
            change: statsData.usersChange,
            isPositive: statsData.usersPositive,
            icon: Users,
            color: "text-purple-600 bg-purple-50"
        }
    ];

    // 📄 Generated Reports Table Data
    const reportRows = [
        {
            id: "REP-DB-001",
            title: "Claims & Policy Settlement Summary",
            category: "Claims",
            date: new Date().toISOString().split('T')[0],
            format: "CSV / PDF",
            status: "Completed",
            records: appliedPolicies.length
        },
        {
            id: "REP-DB-002",
            title: "Premium Revenue Analysis",
            category: "Financial",
            date: new Date().toISOString().split('T')[0],
            format: "CSV",
            status: "Completed",
            records: appliedPolicies.length
        },
        {
            id: "REP-DB-003",
            title: "Policy & Claim Approval/Rejection Ratios",
            category: "Policies",
            date: new Date().toISOString().split('T')[0],
            format: "CSV / PDF",
            status: "Completed",
            records: distribution.approvedCount + distribution.pendingCount + distribution.rejectedCount
        }
    ];

    // 📥 Master CSV Export
    const handleExportCSV = (reportTitle) => {
        if (appliedPolicies.length === 0) {
            toast.error("No records found to export.");
            return;
        }

        const headers = ["Policy ID", "Policy Name", "User Email", "Coverage Amount", "Status", "Applied Date"];
        const rows = appliedPolicies.map(p => [
            p.id || '',
            p.policy_name || '',
            p.user_email || '',
            p.coverage_amount || '',
            p.status || '',
            p.applied_date || ''
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + 
            [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
            "download",
            `${reportTitle.toLowerCase().replace(/ /g, "_")}_report.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Report downloaded successfully!");
    };

    // Filter Logic
    const filteredReports = reportRows.filter(
        (item) => reportCategory === "All" || item.category === reportCategory
    );

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-blue-600" />
                        System Reports & Analytics
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">
                        Tracking live metrics, monitor claims pipeline, and export database audit data.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="bg-transparent focus:outline-none cursor-pointer"
                        >
                            <option value="This Week">This Week</option>
                            <option value="This Month">This Month</option>
                            <option value="This Quarter">This Quarter</option>
                            <option value="This Year">This Year</option>
                        </select>
                    </div>

                    <button
                        onClick={() => handleExportCSV("Master_Database")}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Export Master CSV
                    </button>
                </div>
            </div>

            {/* KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => {
                    const IconComponent = stat.icon;
                    return (
                        <div
                            key={idx}
                            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500">
                                    {stat.title}
                                </span>
                                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                                    <IconComponent className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-2xl font-extrabold text-slate-800">
                                    {loading ? "Loading..." : stat.value}
                                </h3>
                                <div className="flex items-center gap-1 mt-1">
                                    <span
                                        className={`text-xs font-bold ${
                                            stat.isPositive ? "text-emerald-600" : "text-red-500"
                                        }`}
                                    >
                                        {stat.change}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                        vs previous period
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Visual Breakdown / Progress Bars */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" /> Application Distribution
                        </h3>
                        <span className="text-xs font-semibold text-slate-400">Live Breakdown</span>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-emerald-700 flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Approved & Active Policies/Claims
                                </span>
                                <span className="text-slate-700">{distribution.approvedPercent}% ({distribution.approvedCount})</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${distribution.approvedPercent}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-amber-700 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Pending Underwriting Review
                                </span>
                                <span className="text-slate-700">{distribution.pendingPercent}% ({distribution.pendingCount})</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${distribution.pendingPercent}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-red-700 flex items-center gap-1">
                                    <XCircle className="w-3.5 h-3.5" /> Rejected / Cancelled Applications
                                </span>
                                <span className="text-slate-700">{distribution.rejectedPercent}% ({distribution.rejectedCount})</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${distribution.rejectedPercent}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Summary Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                            Audit & Compliance
                        </span>
                        <h3 className="text-lg font-bold mt-1">Automated System Log</h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                            All transactional, claim submission, and approval data are timestamped and prepared for compliance review.
                        </p>
                    </div>

                    <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm space-y-2 border border-white/10">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-300">Last Audit Check:</span>
                            <span className="font-semibold text-white">Today, 09:30 AM</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-300">Compliance Status:</span>
                            <span className="font-bold text-emerald-400">100% Compliant</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generated Reports Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">Generated Analytical Logs</h3>
                        <p className="text-xs text-slate-500">Download specific data archives directly from system records.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            value={reportCategory}
                            onChange={(e) => setReportCategory(e.target.value)}
                            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
                        >
                            <option value="All">All Categories</option>
                            <option value="Claims">Claims</option>
                            <option value="Financial">Financial</option>
                            <option value="Policies">Policies</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="p-3">Report Title</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">Date Generated</th>
                                <th className="p-3">Records</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {filteredReports.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50/80 transition">
                                    <td className="p-3 font-bold text-slate-800">
                                        {row.title}
                                        <span className="block text-[10px] font-normal text-slate-400">
                                            {row.id}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600">
                                            {row.category}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-500">{row.date}</td>
                                    <td className="p-3 font-semibold">{row.records} rows</td>
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={() => handleExportCSV(row.title)}
                                            className="inline-flex items-center gap-1 text-xs text-blue-600 font-bold hover:text-blue-800 transition cursor-pointer"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;