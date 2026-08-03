import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft, IndianRupee, FileText, CheckCircle } from "lucide-react";

const RequestPolicy = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    const [formData, setFormData] = useState({
        policy_type: "Health Insurance",
        coverage_amount: "500000",
        premium_amount: "5000",
        term_years: "1",
        nominee_name: "",
        nominee_relation: ""
    });

    const [successMessage, setSuccessMessage] = useState(false);

    const availablePlans = [
        { type: "Health Insurance", baseCoverage: "5,00,000", basePremium: "5,000", desc: "Comprehensive medical cover for individuals and families." },
        { type: "Life Insurance", baseCoverage: "25,00,000", basePremium: "12,000", desc: "Secure your family’s financial future with high-value coverage." },
        { type: "Vehicle Insurance", baseCoverage: "1,00,000", basePremium: "3,500", desc: "Protect your car/bike against damages and third-party liabilities." },
        { type: "Travel Insurance", baseCoverage: "2,00,000", basePremium: "2,500", desc: "Coverage for medical emergencies and trip cancellations abroad." }
    ];

    const handlePlanSelect = (plan) => {
        setFormData({
            ...formData,
            policy_type: plan.type,
            coverage_amount: plan.baseCoverage.replace(/,/g, ''),
            premium_amount: plan.basePremium.replace(/,/g, '')
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newPolicyRequest = {
            id: "POL-" + Math.floor(100000 + Math.random() * 900000),
            policy_number: "INS-REF-" + Math.floor(10000 + Math.random() * 90000),
            user_email: currentUser.email || currentUser.user_email || "mahi@gmail.com",
            customer_name: currentUser.name || "Mahi",
            policy_type: formData.policy_type,
            coverage_amount: Number(formData.coverage_amount),
            premium_amount: Number(formData.premium_amount),
            term_years: formData.term_years,
            nominee_name: formData.nominee_name,
            nominee_relation: formData.nominee_relation,
            status: "Pending Approval", // Agent review ke liye pending rahegi
            start_date: new Date().toISOString().split("T")[0],
            created_at: new Date().toISOString()
        };

        // Existing policies uthayein aur nayi request add karein
        const existingPolicies = JSON.parse(localStorage.getItem("applied_policies") || "[]");
        localStorage.setItem("applied_policies", JSON.stringify([newPolicyRequest, ...existingPolicies]));

        setSuccessMessage(true);
        setTimeout(() => {
            navigate("/policies");
        }, 2000);
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 p-4 md:p-8 bg-slate-50/60 min-h-screen">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h1 className="text-xl font-bold text-slate-800">Apply for New Policy</h1>
            </div>

            {successMessage ? (
                <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center space-y-3">
                    <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h2 className="text-xl font-bold text-emerald-800">Policy Request Submitted Successfully!</h2>
                    <p className="text-emerald-600 text-sm">Your application has been sent to the agent for verification and approval.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Select Plan Column */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">1. Select Insurance Plan</h2>
                        {availablePlans.map((plan, idx) => (
                            <div
                                key={idx}
                                onClick={() => handlePlanSelect(plan)}
                                className={`p-4 rounded-xl border cursor-pointer transition ${
                                    formData.policy_type === plan.type
                                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                            >
                                <h3 className="font-bold text-slate-800 text-sm">{plan.type}</h3>
                                <p className="text-xs text-slate-500 mt-1">{plan.desc}</p>
                                <div className="mt-3 flex justify-between items-center text-xs font-semibold">
                                    <span className="text-blue-600">Cover: ₹{plan.baseCoverage}</span>
                                    <span className="text-emerald-600">Prem: ₹{plan.basePremium}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Application Form */}
                    <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">2. Policy Details & Nominee</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Selected Policy Type</label>
                                <input
                                    type="text"
                                    value={formData.policy_type}
                                    disabled
                                    className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-sm font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Coverage Amount (₹)</label>
                                    <input
                                        type="number"
                                        name="coverage_amount"
                                        value={formData.coverage_amount}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Annual Premium (₹)</label>
                                    <input
                                        type="number"
                                        name="premium_amount"
                                        value={formData.premium_amount}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nominee Full Name</label>
                                    <input
                                        type="text"
                                        name="nominee_name"
                                        placeholder="Enter nominee name"
                                        value={formData.nominee_name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Relation with Nominee</label>
                                    <input
                                        type="text"
                                        name="nominee_relation"
                                        placeholder="e.g. Spouse, Father, Mother"
                                        value={formData.nominee_relation}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-blue-500"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition shadow-sm cursor-pointer"
                            >
                                Submit Policy Request to Agent
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestPolicy;