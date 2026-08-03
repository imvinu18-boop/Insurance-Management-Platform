import React, { useEffect, useState, useCallback } from "react";
import API from "../api/axiosInstance";
import {
    Users,
    Search,
    UserPlus,
    Mail,
    Phone,
    MapPin,
    Shield,
    X,
    Loader2,
    RefreshCw,
    Edit3,
    Trash2
} from "lucide-react";

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Track editing state
    const [editingCustomerId, setEditingCustomerId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        activePolicies: 0
    });

    // Fetch Customers (with clean API & LocalStorage Fallback)
    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get("/customers");
            setCustomers(res.data || []);
        } catch (error) {
            console.warn("Backend API unavailable. Fetching local customers fallback.");
            const localCust = JSON.parse(localStorage.getItem("app_customers") || "[]");
            setCustomers(localCust);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // Handle Input Changes generically
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "activePolicies" ? Number(value) : value
        }));
    };

    // Open Modal for Editing
    const handleOpenEditModal = (customer) => {
        setEditingCustomerId(customer.id);
        setFormData({
            name: customer.name || "",
            email: customer.email || "",
            phone: customer.phone || "",
            address: customer.address || "",
            activePolicies: customer.activePolicies ?? 0
        });
        setShowAddModal(true);
    };

    // Open Modal for Adding
    const handleOpenAddModal = () => {
        setEditingCustomerId(null);
        setFormData({ name: "", email: "", phone: "", address: "", activePolicies: 0 });
        setShowAddModal(true);
    };

    // Add or Update Customer Handler
    const handleSaveCustomer = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingCustomerId) {
                // --- UPDATE EXISTING ---
                const updatedCustomer = {
                    id: editingCustomerId,
                    ...formData,
                    activePolicies: Number(formData.activePolicies) || 0
                };

                try {
                    await API.put(`/customers/${editingCustomerId}`, updatedCustomer);
                } catch {
                    console.log("Updated customer locally via fallback.");
                }

                const updatedList = customers.map((c) => 
                    c.id === editingCustomerId ? updatedCustomer : c
                );
                setCustomers(updatedList);
                localStorage.setItem("app_customers", JSON.stringify(updatedList));
                alert("✅ Customer record updated successfully!");

            } else {
                // --- CREATE NEW ---
                const newCustomer = {
                    id: "CUST-" + Math.floor(1000 + Math.random() * 9000),
                    ...formData,
                    activePolicies: Number(formData.activePolicies) || 0
                };

                try {
                    await API.post("/customers", newCustomer);
                } catch {
                    console.log("Saved customer locally via fallback.");
                }

                const updatedList = [newCustomer, ...customers];
                setCustomers(updatedList);
                localStorage.setItem("app_customers", JSON.stringify(updatedList));
                alert("✅ Customer record added successfully!");
            }

            setShowAddModal(false);
            setEditingCustomerId(null);
            setFormData({ name: "", email: "", phone: "", address: "", activePolicies: 0 });
        } catch (err) {
            console.error("Failed to save customer:", err);
            alert("❌ Failed to save customer record.");
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Customer Handler
    const handleDeleteCustomer = async (id) => {
        if (!window.confirm("Are you sure you want to delete this customer record?")) return;

        try {
            try {
                await API.delete(`/customers/${id}`);
            } catch {
                console.log("Deleted customer locally via fallback.");
            }

            const updatedList = customers.filter((c) => c.id !== id);
            setCustomers(updatedList);
            localStorage.setItem("app_customers", JSON.stringify(updatedList));
            alert("🗑️ Customer deleted successfully.");
        } catch (err) {
            console.error("Failed to delete customer:", err);
            alert("❌ Failed to delete customer.");
        }
    };

    // Filter Logic
    const filteredCustomers = customers.filter(
        (c) =>
            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm)
    );

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-7 h-7 text-blue-600" /> Customer Records
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">
                        View and manage registered policyholders, contact details, and policy counts.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchCustomers}
                        title="Refresh List"
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer shadow-md"
                    >
                        <UserPlus className="w-4 h-4" /> Add Customer
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4">Customer Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Phone</th>
                                <th className="p-4">Address</th>
                                <th className="p-4 text-center">Active Policies</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                            <span>Loading records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCustomers.length > 0 ? (
                                filteredCustomers.map((c) => (
                                    <tr key={c.id || c.email} className="hover:bg-slate-50/80 transition">
                                        <td className="p-4 font-semibold text-slate-800 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm uppercase">
                                                {c.name ? c.name.charAt(0) : "C"}
                                            </div>
                                            <div>
                                                <div>{c.name || "N/A"}</div>
                                                <div className="text-[10px] text-slate-400 font-normal">{c.id}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                {c.email || "—"}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                {c.phone || "—"}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            <div className="flex items-center gap-2 max-w-xs truncate">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span className="truncate">{c.address || "—"}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                (c.activePolicies ?? 0) > 0 
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                            }`}>
                                                <Shield className="w-3 h-3" />
                                                {c.activePolicies ?? 0} Policies
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleOpenEditModal(c)}
                                                    title="Edit Customer"
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCustomer(c.id)}
                                                    title="Delete Customer"
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        No customer records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Customer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingCustomerId ? "✏️ Edit Customer Record" : "👤 Add New Customer"}
                            </h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCustomer} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="e.g. Rajesh Kumar"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="e.g. rajesh@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    required
                                    placeholder="e.g. +91 98765 43210"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                                <textarea
                                    rows="2"
                                    name="address"
                                    required
                                    placeholder="City, State"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Active Policies Count</label>
                                <input
                                    type="number"
                                    name="activePolicies"
                                    min="0"
                                    required
                                    value={formData.activePolicies}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-xs transition shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? "Saving..." : editingCustomerId ? "Update Customer" : "Save Customer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;