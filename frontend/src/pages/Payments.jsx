import React, { useEffect, useState, useCallback } from "react";
import API from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { CreditCard, PlusCircle, CheckCircle, X, Lock, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

const Payments = () => {
    let user = {};
    try {
        const auth = useAuth();
        if (auth && auth.user) {
            user = auth.user;
        }
    } catch (e) {
        console.warn("Auth context not found inside Payments", e);
    }

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Form States
    const [myPolicies, setMyPolicies] = useState([]);
    const [selectedPolicyId, setSelectedPolicyId] = useState("");
    const [matchedPolicy, setMatchedPolicy] = useState(null);
    const [installmentAmount, setInstallmentAmount] = useState(0);
    const [totalPaidSoFar, setTotalPaidSoFar] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("UPI");
    const [submitting, setSubmitting] = useState(false);

    const userRole = user?.role ? String(user.role).toLowerCase() : 'customer';
    const isAdminOrAgent = userRole === 'admin' || userRole === 'agent';
    const userEmail = (user?.email || user?.user_email || "").toLowerCase().trim();
    const userId = String(user?.id || user?.user_id || "");

    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
            let fetchedData = [];

            try {
                const endpoint = isAdminOrAgent ? "/payments" : "/api/premiums";
                const res = await API.get(endpoint);
                if (res && res.data) {
                    fetchedData = Array.isArray(res.data) ? res.data : [res.data];
                }
            } catch (err) {
                console.warn("API fetch failed, falling back to local storage:", err);
            }

            // 1. Gather all possible keys from LocalStorage for policies
            const storedApplied = JSON.parse(localStorage.getItem('applied_policies') || '[]');
            const storedGeneral = JSON.parse(localStorage.getItem('policies') || '[]');
            const storedUserPolicies = JSON.parse(localStorage.getItem('user_policies') || '[]');
            const storedMyPolicies = JSON.parse(localStorage.getItem('my_policies') || '[]');
            const storedPurchased = JSON.parse(localStorage.getItem('purchased_policies') || '[]');
            
            const userSpecificKey = userEmail ? `user_applied_policies_${userEmail}` : '';
            const storedUserSpecific = userSpecificKey ? JSON.parse(localStorage.getItem(userSpecificKey) || '[]') : [];

            const allPoliciesMap = new Map();
            const rawPoliciesList = [...storedUserSpecific, ...storedApplied, ...storedGeneral, ...storedUserPolicies, ...storedMyPolicies, ...storedPurchased];
            
            rawPoliciesList.forEach(pol => {
                if (pol && (pol.id || pol._id)) {
                    const pIdStr = String(pol.id || pol._id);
                    allPoliciesMap.set(pIdStr, pol);
                }
            });
            let allPolicies = Array.from(allPoliciesMap.values());

            // 2. Flexible Policy Filtering & Approval Status Check for Customers
            let userFilteredPolicies = [];
            if (isAdminOrAgent) {
                userFilteredPolicies = allPolicies;
            } else {
                userFilteredPolicies = allPolicies.filter(p => {
                    const pEmail = String(p.user_email || p.customer_email || p.email || p.userEmail || "").toLowerCase().trim();
                    const pCustId = String(p.customer_id || p.userId || p.user_id || "");
                    
                    const emailMatch = userEmail && pEmail && pEmail === userEmail;
                    const idMatch = userId && pCustId && pCustId === userId;
                    const noOwnerTag = !pEmail && !pCustId; 

                    const isUserMatch = emailMatch || idMatch || noOwnerTag;

                    const status = String(p.status || p.approval_status || p.application_status || "").toLowerCase();
                    const isApproved = status === "approved" || status === "active" || status === "accepted" || !status;

                    return isUserMatch && isApproved;
                });

                if (userFilteredPolicies.length === 0 && allPolicies.length > 0) {
                    userFilteredPolicies = allPolicies.filter(p => {
                        const status = String(p.status || p.approval_status || p.application_status || "").toLowerCase();
                        return status === "approved" || status === "active" || status === "accepted" || !status;
                    });
                }
            }

            setMyPolicies(userFilteredPolicies);
            
            const validPolicyIds = new Set();
            userFilteredPolicies.forEach(p => {
                const idStr = String(p.id || p._id);
                validPolicyIds.add(idStr);
                validPolicyIds.add(`POL-${idStr}`);
                validPolicyIds.add(idStr.replace('POL-', ''));
            });

            // 3. Load Payments from storage & map missing emails from policies
            let localStoredGlobal = [];
            let localStoredUser = [];
            try {
                localStoredGlobal = JSON.parse(localStorage.getItem("local_payments") || "[]");
                if (userEmail) {
                    localStoredUser = JSON.parse(localStorage.getItem(`local_payments_${userEmail}`) || "[]");
                }
            } catch (e) {
                localStoredGlobal = [];
                localStoredUser = [];
            }
            
            const combinedMap = new Map();
            [...localStoredUser, ...localStoredGlobal, ...fetchedData].forEach(item => {
                if (item && typeof item === 'object') {
                    const key = item.id || item.transaction_id || Math.random();
                    const pEmail = String(item.user_email || item.email || "").toLowerCase().trim();
                    const pPolId = String(item.policy_id || "");

                    // Fallback email mapping from policy if email is missing in transaction
                    if (!item.user_email) {
                        const matchedPolObj = allPoliciesMap.get(pPolId.replace('POL-', ''));
                        if (matchedPolObj) {
                            item.user_email = matchedPolObj.user_email || matchedPolObj.customer_email || matchedPolObj.email || userEmail;
                        }
                    }

                    if (isAdminOrAgent || !pEmail || (userEmail && pEmail === userEmail) || validPolicyIds.has(pPolId)) {
                        combinedMap.set(key, item);
                    }
                }
            });

            setPayments(Array.from(combinedMap.values()));

        } catch (err) {
            console.error("Critical error loading payments:", err);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    }, [isAdminOrAgent, userEmail, userId]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const handlePolicyChange = (e) => {
        const polId = e.target.value;
        setSelectedPolicyId(polId);

        const found = myPolicies.find(p => {
            const currentId = String(p.id || p._id);
            return currentId === String(polId) || `POL-${currentId}` === String(polId) || currentId === String(polId).replace('POL-', '');
        });

        if (found) {
            setMatchedPolicy(found);
            const foundIdStr = String(found.id || found._id);
            const totalCoverage = Number(found.coverage_amount) || Number(found.premium_amount) || Number(found.amount) || 0;
            const freq = found.payment_frequency || "Yearly";

            let calculatedInstallment = totalCoverage;
            if (freq === "Monthly") {
                calculatedInstallment = Math.round(totalCoverage / 12);
            } else if (freq === "Quarterly") {
                calculatedInstallment = Math.round(totalCoverage / 4);
            } else if (freq === "Yearly" || freq === "One-Time") {
                calculatedInstallment = totalCoverage;
            }

            setInstallmentAmount(calculatedInstallment);

            const paidForThisPolicy = payments
                .filter(p => {
                    const pPolicyId = String(p.policy_id || "");
                    return pPolicyId === foundIdStr || 
                           pPolicyId === `POL-${foundIdStr}` || 
                           pPolicyId.replace('POL-', '') === foundIdStr.replace('POL-', '');
                })
                .filter(p => p.payment_status === "Paid" || !p.payment_status)
                .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            
            setTotalPaidSoFar(paidForThisPolicy);
        } else {
            setMatchedPolicy(null);
            setInstallmentAmount(0);
            setTotalPaidSoFar(0);
        }
    };

    const resetForm = () => {
        setSelectedPolicyId("");
        setMatchedPolicy(null);
        setInstallmentAmount(0);
        setTotalPaidSoFar(0);
        setPaymentMethod("UPI");
    };

    const handleMakePayment = async (e) => {
        e.preventDefault();
        if (!matchedPolicy) return;

        const totalCoverage = Number(matchedPolicy.coverage_amount) || Number(matchedPolicy.premium_amount) || Number(matchedPolicy.amount) || 0;
        const remainingBalance = totalCoverage - totalPaidSoFar;

        if (totalPaidSoFar >= totalCoverage && totalCoverage > 0) {
            toast.error("This policy is already fully paid!");
            return;
        }

        const payAmt = Number(installmentAmount);
        if (totalCoverage > 0 && payAmt > remainingBalance) {
            toast.error(`Payment cannot exceed remaining balance of ₹${remainingBalance.toLocaleString("en-IN")}`);
            return;
        }

        setSubmitting(true);

        const transactionId = `TXN-${Date.now().toString().slice(-6)}`;
        const cleanPolicyId = String(matchedPolicy.id || matchedPolicy._id);
        
        // Ensure accurate email assignment
        const currentActiveEmail = userEmail || matchedPolicy.user_email || matchedPolicy.customer_email || "customer@insurshield.com";

        const newPayment = {
            id: transactionId,
            transaction_id: transactionId,
            policy_id: cleanPolicyId,
            amount: payAmt,
            payment_method: paymentMethod,
            payment_status: "Paid",
            payment_date: new Date().toISOString(),
            user_email: currentActiveEmail
        };

        try {
            await API.post("/api/premiums", newPayment);
        } catch (error) {
            console.warn("Backend save failed, saving to local storage:", error);
        }

        try {
            if (userEmail) {
                const userPayKey = `local_payments_${userEmail}`;
                const existingUserStored = JSON.parse(localStorage.getItem(userPayKey) || "[]");
                localStorage.setItem(userPayKey, JSON.stringify([newPayment, ...existingUserStored]));
            }
            const existingGlobal = JSON.parse(localStorage.getItem("local_payments") || "[]");
            localStorage.setItem("local_payments", JSON.stringify([newPayment, ...existingGlobal]));
        } catch (e) {
            console.error("Local storage write error:", e);
        }

        toast.success("Payment Successful and Recorded!");
        setShowModal(false);
        resetForm();
        fetchPayments();
        setSubmitting(false);
    };

    const totalCoverageNum = matchedPolicy ? (Number(matchedPolicy.coverage_amount) || Number(matchedPolicy.premium_amount) || Number(matchedPolicy.amount) || 0) : 0;
    const isFullyPaid = totalPaidSoFar >= totalCoverageNum && totalCoverageNum > 0;
    const hasActivePolicies = myPolicies.length > 0;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl border border-orange-100">
                        <CreditCard className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                            {isAdminOrAgent ? "All Customer Transactions" : "Payments & Premium Dues"}
                        </h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            {isAdminOrAgent 
                                ? "Monitor and audit all policy payment records across system users." 
                                : "View payment transaction history and pay policy premiums securely."}
                        </p>
                    </div>
                </div>

                {!isAdminOrAgent && hasActivePolicies && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer shadow-md shadow-orange-600/25"
                    >
                        <PlusCircle className="w-4 h-4" /> Pay Premium Dues
                    </button>
                )}
            </div>

            {!isAdminOrAgent && !hasActivePolicies && !loading && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800 text-sm">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>You do not have any approved policies available. The payment option will only be displayed here once your policy is approved by the agent.</span>
                </div>
            )}

            {/* Transaction History Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-base">
                        {isAdminOrAgent ? "System-wide Transaction Records" : "Your Transaction History"}
                    </h3>
                    <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full">
                        Total Records: {payments.length}
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        <span className="ml-3 text-slate-500 font-medium text-sm">Loading transactions...</span>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="text-center py-16 px-4 space-y-3">
                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                            <CreditCard className="w-8 h-8" />
                        </div>
                        <h4 className="text-base font-bold text-slate-700">No Payment Records Found</h4>
                        <p className="text-slate-400 text-sm max-w-sm mx-auto">
                            {isAdminOrAgent 
                                ? "No payment logs found in database." 
                                : "There are no payment records on your account yet."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                                    <th className="p-4">Transaction ID</th>
                                    {isAdminOrAgent && <th className="p-4">Customer Email</th>}
                                    <th className="p-4">Policy ID</th>
                                    <th className="p-4">Amount Paid</th>
                                    <th className="p-4">Method</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {payments.map((item, index) => {
                                    if (!item) return null;
                                    return (
                                        <tr key={item.id || item.transaction_id || index} className="hover:bg-slate-50/50 transition">
                                            <td className="p-4 font-medium text-slate-900">
                                                #{item.transaction_id || item.id || `TXN-100${index}`}
                                            </td>
                                            {isAdminOrAgent && (
                                                <td className="p-4 text-slate-600 font-medium">
                                                    {item.user_email || "customer@insurshield.com"}
                                                </td>
                                            )}
                                            <td className="p-4 text-slate-600 font-medium">
                                                #{item.policy_id || "N/A"}
                                            </td>
                                            <td className="p-4 font-bold text-slate-900">
                                                ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                                            </td>
                                            <td className="p-4 text-slate-600">
                                                {item.payment_method || "UPI"}
                                            </td>
                                            <td className="p-4 text-slate-500 text-xs">
                                                {item.payment_date ? item.payment_date.split("T")[0] : new Date().toISOString().split("T")[0]}
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    <CheckCircle className="w-3.5 h-3.5" /> {item.payment_status || "Paid"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showModal && !isAdminOrAgent && hasActivePolicies && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-orange-600" /> Pay Policy Premium
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleMakePayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Select Your Policy
                                </label>
                                <select
                                    value={selectedPolicyId}
                                    onChange={handlePolicyChange}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer font-medium text-slate-700"
                                    required
                                >
                                    <option value="">-- Choose Approved Policy ({myPolicies.length} available) --</option>
                                    {myPolicies.map((pol) => {
                                        const pId = String(pol.id || pol._id);
                                        const cleanId = pId.startsWith('POL-') ? pId : `POL-${pId}`;
                                        const pName = pol.policy_name || pol.name || pol.title || "Policy";
                                        const pVal = Number(pol.coverage_amount || pol.premium_amount || pol.amount || 0);
                                        return (
                                            <option key={pId} value={pId}>
                                                {pName} (#{cleanId}) {pVal > 0 ? `- ₹${pVal.toLocaleString("en-IN")}` : ""}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {matchedPolicy && (
                                <div className="p-3.5 bg-orange-50 border border-orange-100 rounded-xl space-y-1.5 text-xs text-slate-700">
                                    <div className="flex justify-between font-semibold">
                                        <span>Payment Frequency:</span>
                                        <span className="text-orange-600 uppercase">{matchedPolicy.payment_frequency || "Yearly"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Policy Value:</span>
                                        <span className="font-bold">₹{totalCoverageNum.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Already Paid:</span>
                                        <span className="font-bold text-emerald-600">₹{totalPaidSoFar.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-orange-200">
                                        <span className="font-semibold text-slate-900">Remaining Due:</span>
                                        <span className="font-bold text-red-600">₹{Math.max(0, totalCoverageNum - totalPaidSoFar).toLocaleString("en-IN")}</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                                    <span>Payable Installment Amount (₹)</span>
                                    <span className="text-[10px] text-orange-600 font-bold flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Locked to Schedule
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    value={installmentAmount}
                                    readOnly
                                    className="w-full px-3 py-2.5 border border-slate-200 bg-slate-100 rounded-xl text-sm font-bold text-slate-800 cursor-not-allowed"
                                    required
                                    aria-label="Payable Installment Amount"
                                />
                            </div>

                            {!isFullyPaid && matchedPolicy && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Payment Method
                                    </label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer"
                                    >
                                        <option value="UPI">📱 UPI</option>
                                        <option value="Credit Card">💳 Credit Card</option>
                                        <option value="Debit Card">💳 Debit Card</option>
                                        <option value="Net Banking">🏦 Net Banking</option>
                                        <option value="Cash">💵 Cash</option>
                                    </select>
                                </div>
                            )}

                            {isFullyPaid && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold text-center">
                                    ✅ This policy is fully paid! No further payments are due.
                                </div>
                            )}

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || isFullyPaid || !matchedPolicy}
                                    className="w-1/2 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-semibold text-xs transition shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Processing..." : isFullyPaid ? "Fully Paid" : "Confirm & Pay"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;