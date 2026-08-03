import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Search, Calendar, DollarSign, Shield, FileText } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

const Transactions = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const isAdminOrAgent = user?.role === 'admin' || user?.role === 'agent';

    useEffect(() => {
        fetchTransactions();
    }, [user]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            // Backend endpoint jo sabhi transactions ya user-specific payments laaye
            const endpoint = isAdminOrAgent ? '/transactions' : `/payments/user/${user?.email}`;
            
            // Agar backend API abhi ready nahi hai toh fallback ke liye localStorage ya mock data use kar sakte hain
            try {
                const response = await axiosInstance.get(endpoint);
                setTransactions(response.data);
            } catch (apiErr) {
                // Fallback to localStorage if API call fails during development
                const localData = localStorage.getItem('local_transactions') || localStorage.getItem('local_payments');
                if (localData) {
                    setTransactions(JSON.parse(localData));
                } else {
                    // Sample mock data for preview
                    setTransactions([
                        {
                            id: 1,
                            policy_id: 'POL-101',
                            customer_name: user?.name || 'Vinod Singh',
                            customer_email: user?.email || 'vinod@gmail.com',
                            amount: 15000,
                            payment_date: '2026-07-15',
                            payment_status: 'Completed',
                            payment_method: 'Credit Card'
                        }
                    ]);
                }
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    // Filter transactions based on search term (search by customer name, email, or policy ID)
    const filteredTransactions = transactions.filter((tx) => {
        const term = searchTerm.toLowerCase();
        return (
            String(tx.policy_id || '').toLowerCase().includes(term) ||
            String(tx.customer_name || '').toLowerCase().includes(term) ||
            String(tx.customer_email || '').toLowerCase().includes(term)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {isAdminOrAgent ? 'System Transactions' : 'My Payment History'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {isAdminOrAgent 
                            ? 'Monitor all premium payments and transactions across customer policies.' 
                            : 'Track your policy payment records and verification statuses.'}
                    </p>
                </div>
                <div className="flex items-center space-x-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-xl border border-orange-100 text-sm font-semibold">
                    <CreditCard className="w-4 h-4" />
                    <span>Total Records: {transactions.length}</span>
                </div>
            </div>

            {/* Search Bar for Admin/Agent */}
            {isAdminOrAgent && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Policy ID, Customer Name, or Email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent text-sm text-slate-800 focus:outline-none"
                    />
                </div>
            )}

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading transactions...</div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600 font-medium">No transactions found</p>
                        <p className="text-xs text-slate-400 mt-1">Payment records will appear here once processed.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Transaction ID</th>
                                    {isAdminOrAgent && <th className="px-6 py-4">Customer Details</th>}
                                    <th className="px-6 py-4">Policy ID</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Payment Date</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {filteredTransactions.map((tx, index) => (
                                    <tr key={tx.id || index} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            #{tx.id || `TXN-${1000 + index}`}
                                        </td>
                                        {isAdminOrAgent && (
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-800">{tx.customer_name || 'N/A'}</p>
                                                <p className="text-xs text-slate-500">{tx.customer_email || 'N/A'}</p>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 font-semibold text-orange-600">
                                            {tx.policy_id}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {tx.payment_date || new Date().toISOString().split('T')[0]}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {tx.payment_method || 'Online Gateway'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                                String(tx.payment_status).toLowerCase() === 'completed' || String(tx.payment_status).toLowerCase() === 'paid'
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}>
                                                {tx.payment_status || 'Completed'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Transactions;