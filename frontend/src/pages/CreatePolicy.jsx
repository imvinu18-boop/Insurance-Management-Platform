import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";
import { ShieldCheck, ArrowLeft } from "lucide-react";

const CreatePolicy = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [error, setError] = useState("");
    
    // Updated Form State with Payment Rules & Frequencies
    const [formData, setFormData] = useState({
        customer_id: "",
        policy_type: "Health",
        policy_number: "",
        premium_amount: "",
        payment_frequency: "Yearly", // 💳 Added: Monthly, Quarterly, Yearly, One-Time
        payment_status: "Pending",   // 💳 Added: Initial payment status tracking
        start_date: "",
        end_date: "",
        status: "Active"
    });

    // 🔄 Fetch registered customers from API with localStorage fallback support
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await API.get("/users"); 
                const allUsers = Array.isArray(res.data) ? res.data : res.data?.users || res.data?.data || [];
                
                const customerList = allUsers.filter(u => u.role?.toLowerCase() === "customer");
                
                if (customerList.length === 0) {
                    // Fallback to localStorage if API returns empty list
                    const localUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
                    const localCustomers = localUsers.filter(u => u.role?.toLowerCase() === "customer");
                    setCustomers(localCustomers);
                } else {
                    setCustomers(customerList);
                }
            } catch (err) {
                console.warn("API fetch failed, falling back to localStorage users:", err);
                // Fallback to localStorage if backend connection fails
                const localUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
                const localCustomers = localUsers.filter(u => u.role?.toLowerCase() === "customer");
                
                if (localCustomers.length > 0) {
                    setCustomers(localCustomers);
                } else {
                    setError("Failed to load customer list from server and local storage.");
                }
            }
        };
        fetchCustomers();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.customer_id) {
            setError("Please select a customer for this policy.");
            return;
        }
        
        setLoading(true);
        setError("");

        try {
            await API.post("/policies", formData);
            alert("Policy registered successfully with payment rules configured!");
            navigate("/policies");
        } catch (err) {
            console.error("Error creating policy:", err);
            setError(err.response?.data?.message || "Failed to register policy. Please check inputs.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6 p-4 md:p-8 bg-slate-50/60 min-h-screen">
            {/* Top Navigation */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            {/* Form Header */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-800">Register New Insurance Policy</h1>
                        <p className="text-xs text-slate-500">Configure customer policy details, coverage, and payment terms.</p>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* 🌟 Customer Selection Dropdown */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Select Customer</label>
                            <select
                                name="customer_id"
                                required
                                value={formData.customer_id}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm bg-white"
                            >
                                <option value="">-- Choose a Registered Customer --</option>
                                {customers.map((cust) => (
                                    <option key={cust.id || cust._id || cust.email} value={cust.id || cust._id || cust.email}>
                                        {cust.name} ({cust.email})
                                    </option>
                                ))}
                            </select>
                            {customers.length === 0 && (
                                <p className="text-xs text-orange-600 mt-1">No customers found. Please register a customer account first.</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Policy Type</label>
                            <select
                                name="policy_type"
                                value={formData.policy_type}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm bg-white"
                            >
                                <option value="Health">Health Insurance</option>
                                <option value="Life">Life Insurance</option>
                                <option value="Vehicle">Vehicle Insurance</option>
                                <option value="Property">Property Insurance</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Policy Number</label>
                            <input
                                type="text"
                                name="policy_number"
                                required
                                value={formData.policy_number}
                                onChange={handleChange}
                                placeholder="e.g. POL-2026-001"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Premium / Installment Amount (₹)</label>
                            <input
                                type="number"
                                name="premium_amount"
                                required
                                value={formData.premium_amount}
                                onChange={handleChange}
                                placeholder="e.g. 5000"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm"
                            />
                        </div>

                        {/* 💳 Payment Frequency Rule */}
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Payment Frequency</label>
                            <select
                                name="payment_frequency"
                                value={formData.payment_frequency}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm bg-white"
                            >
                                <option value="Monthly">Monthly (Har Mahine)</option>
                                <option value="Quarterly">Quarterly (Har 3 Mahine)</option>
                                <option value="Yearly">Yearly (Har Saal)</option>
                                <option value="One-Time">One-Time (Ek Sath)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                required
                                value={formData.start_date}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                required
                                value={formData.end_date}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
                        >
                            {loading ? "Registering..." : "Save & Register Policy"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePolicy;