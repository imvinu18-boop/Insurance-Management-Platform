import React, { useEffect, useState, useCallback, useMemo } from 'react';
import API from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { PlusCircle, FileText, X, Eye, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

const Claims = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form States (Customer Claim Filing)
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [policyId, setPolicyId] = useState('');
    const [claimAmount, setClaimAmount] = useState('');
    const [reason, setReason] = useState('');

    // File States for Claim Submission
    const [medicalBill, setMedicalBill] = useState(null);
    const [policyCopy, setPolicyCopy] = useState(null);
    const [idProof, setIdProof] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // 🚨 Policy Not Approved Warning Popup State
    const [showApprovalWarningModal, setShowApprovalWarningModal] = useState(false);
    const [unapprovedPolicyDetails, setUnapprovedPolicyDetails] = useState(null);

    // Agent/Admin Specific Modal State for Document Verification
    const [selectedClaimForDoc, setSelectedClaimForDoc] = useState(null);

    // Current Logged-in User Info
    const user = useMemo(() => {
        const rawUser = localStorage.getItem('user');
        let parsed = { role: 'customer' };
        try {
            parsed = rawUser ? JSON.parse(rawUser) : { role: 'customer' };
        } catch (e) {
            console.error('Failed to parse user from localStorage', e);
        }
        return {
            ...parsed,
            role: parsed?.role?.toLowerCase() || 'customer'
        };
    }, []);

    const isAdmin = user.role === 'admin';
    const isAgent = user.role === 'agent';
    const isExecutive = isAdmin || isAgent;

    // 🔄 Sync Claims from API + localStorage
    const fetchClaims = useCallback(async () => {
        setLoading(true);
        let apiClaims = [];

        try {
            const endpoint = isExecutive ? '/claims' : '/claims/my-claims';
            const res = await API.get(endpoint);
            apiClaims = res.data || [];
        } catch (error) {
            console.warn('Backend API offline or route missing. Falling back to local storage.');
        }

        // Fetch LocalStorage Claims
        const localClaims = JSON.parse(localStorage.getItem('applied_claims') || '[]');

        // Filter local claims if current user is a customer; executives see all
        const filteredLocal = isExecutive
            ? localClaims
            : localClaims.filter((c) => !c.user_email || c.user_email === user.email);

        // Merge & Deduplicate Claims by ID
        const claimMap = new Map();
        [...apiClaims, ...filteredLocal].forEach((item) => {
            if (item?.id) claimMap.set(String(item.id), item);
        });

        const finalClaims = Array.from(claimMap.values());
        setClaims(finalClaims);
        
        localStorage.setItem('applied_claims', JSON.stringify(finalClaims));
        setLoading(false);
    }, [isExecutive, user.email]);

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

    // ⚡ Action: Approve / Reject Claim (Admin/Agent)
    const handleStatus = async (id, status) => {
        try {
            await API.put(`/claims/${id}/status`, { status }).catch(() => {
                console.log('API call failed, updating locally...');
            });

            const localClaims = JSON.parse(localStorage.getItem('applied_claims') || '[]');
            const updatedLocal = localClaims.map((item) =>
                String(item.id) === String(id) ? { ...item, status, reviewed_by: user.email || 'Executive' } : item
            );
            localStorage.setItem('applied_claims', JSON.stringify(updatedLocal));

            toast.success(`Claim marked as ${status}`);
            setSelectedClaimForDoc(null);
            fetchClaims();
        } catch (err) {
            toast.error('Action failed. Try again.');
        }
    };

    // Helper to convert file to Base64 string for persistent storage
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve(null);
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    // 📝 Action: File New Claim (Customer)
    const handleFileClaim = async (e) => {
        e.preventDefault();

        // 🛡️ POLICY APPROVAL VALIDATION CHECK
        const savedPolicies = JSON.parse(localStorage.getItem('applied_policies') || '[]');
        const targetPolicy = savedPolicies.find(
            (p) => String(p.id || p.policy_id) === String(policyId)
        );

        // If policy exists locally, verify its approval status
        if (targetPolicy) {
            const policyStatus = targetPolicy.status || targetPolicy.approval_status || 'Pending';
            if (policyStatus !== 'Approved') {
                // Pehle form/claim modal ko close karein taaki background clear rahe
                setShowClaimModal(false);
                
                // Phir warning popup ki details set karke popup trigger karein
                setUnapprovedPolicyDetails({
                    policyId: policyId,
                    status: policyStatus,
                    planName: targetPolicy.policy_name || targetPolicy.title || 'Insurance Policy'
                });
                setShowApprovalWarningModal(true);
                return;
            }
        }

        setSubmitting(true);

        try {
            const medicalBillBase64 = await convertFileToBase64(medicalBill);
            const policyCopyBase64 = await convertFileToBase64(policyCopy);
            const idProofBase64 = await convertFileToBase64(idProof);

            const docUrls = {
                [medicalBill ? medicalBill.name : 'Medical_Bill_Receipt.pdf']: medicalBillBase64,
                [policyCopy ? policyCopy.name : 'Policy_Copy.pdf']: policyCopyBase64,
                [idProof ? idProof.name : 'ID_Proof.png']: idProofBase64,
            };

            const newClaimPayload = {
                id: 'CLM-' + Math.floor(100000 + Math.random() * 900000),
                policy_id: policyId || 'POL-GENERIC',
                claim_amount: Number(claimAmount),
                reason: reason,
                status: 'Pending',
                applied_date: new Date().toISOString().split('T')[0],
                user_email: user.email || 'customer@example.com',
                documents: [
                    medicalBill ? medicalBill.name : 'Medical_Bill_Receipt.pdf',
                    policyCopy ? policyCopy.name : 'Policy_Copy.pdf',
                    idProof ? idProof.name : 'ID_Proof.png'
                ],
                documentUrls: docUrls
            };

            await API.post('/claims', newClaimPayload).catch(() => {
                console.log('API unavailable, claim saved locally.');
            });

            const existingClaims = JSON.parse(localStorage.getItem('applied_claims') || '[]');
            existingClaims.unshift(newClaimPayload);
            localStorage.setItem('applied_claims', JSON.stringify(existingClaims));

            toast.success('Claim submitted successfully!');
            setShowClaimModal(false);
            setPolicyId('');
            setClaimAmount('');
            setReason('');
            setMedicalBill(null);
            setPolicyCopy(null);
            setIdProof(null);
            fetchClaims();
        } catch (error) {
            console.error(error);
            toast.error('Failed to process files and submit claim.');
        } finally {
            setSubmitting(false);
        }
    };

    const pendingCount = claims.filter(c => c.status === 'Pending' || c.status === 'Pending Approval').length;
    const approvedCount = claims.filter(c => c.status === 'Approved').length;
    const rejectedCount = claims.filter(c => c.status === 'Rejected').length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-slate-800">
                            {isAdmin ? 'Admin Claims Management' : isAgent ? 'Agent Claims Verification' : 'Claims Management'}
                        </h1>
                        {isExecutive && (
                            <span className={`font-semibold text-xs px-2.5 py-1 rounded-full border ${isAdmin ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                {isAdmin ? 'Admin Portal' : 'Agent Portal'}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 text-sm mt-1">
                        {isExecutive
                            ? 'Review submitted claims, verify customer documents, and process approvals.'
                            : 'View the status of your claims or submit a new claim request.'}
                    </p>
                </div>

                {!isExecutive && (
                    <button
                        onClick={() => setShowClaimModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-md cursor-pointer"
                    >
                        <PlusCircle className="w-4 h-4" /> File New Claim
                    </button>
                )}
            </div>

            {/* 📊 Executive Quick Stats Dashboard */}
            {isExecutive && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Review</p>
                            <h3 className="text-2xl font-bold text-amber-900 mt-1">{pendingCount}</h3>
                        </div>
                        <Clock className="w-8 h-8 text-amber-500/80" />
                    </div>

                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Approved Claims</p>
                            <h3 className="text-2xl font-bold text-emerald-900 mt-1">{approvedCount}</h3>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-emerald-500/80" />
                    </div>

                    <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Rejected Claims</p>
                            <h3 className="text-2xl font-bold text-red-900 mt-1">{rejectedCount}</h3>
                        </div>
                        <XCircle className="w-8 h-8 text-red-500/80" />
                    </div>
                </div>
            )}

            {/* Claims Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-8 text-center text-slate-500 font-medium">
                        Loading claims data...
                    </div>
                ) : claims.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                        <h3 className="text-lg font-semibold text-slate-700">No Claims Found</h3>
                        <p className="text-slate-500 text-sm">
                            {isExecutive
                                ? 'No claims have been submitted for review yet.'
                                : 'You have not submitted any insurance claims yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                                <tr>
                                    <th className="p-4">Claim ID</th>
                                    {isExecutive && <th className="p-4">Customer</th>}
                                    <th className="p-4">Policy ID</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Reason</th>
                                    <th className="p-4">Status</th>
                                    {isExecutive && <th className="p-4">Documents</th>}
                                    {isExecutive && <th className="p-4 text-center">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {claims.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                                        <td className="p-4 font-semibold text-slate-800">#{c.id}</td>

                                        {isExecutive && (
                                            <td className="p-4">
                                                <div className="font-medium text-slate-700">{c.user_email || 'N/A'}</div>
                                            </td>
                                        )}

                                        <td className="p-4 font-mono text-xs text-slate-600">{c.policy_id}</td>
                                        <td className="p-4 font-medium text-slate-900">
                                            ₹{Number(c.claim_amount || c.amount || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="p-4 text-slate-600 max-w-xs truncate">{c.reason || 'N/A'}</td>
                                        <td className="p-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    c.status === 'Approved'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : c.status === 'Rejected'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}
                                            >
                                                {c.status || 'Pending'}
                                            </span>
                                        </td>

                                        {isExecutive && (
                                            <td className="p-4">
                                                <button
                                                    onClick={() => setSelectedClaimForDoc(c)}
                                                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Verify Docs
                                                </button>
                                            </td>
                                        )}

                                        {isExecutive && (
                                            <td className="p-4 text-center">
                                                {(c.status === 'Pending' || c.status === 'Pending Approval') ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleStatus(c.id, 'Approved')}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer shadow-sm"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatus(c.id, 'Rejected')}
                                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer shadow-sm"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-mono">Reviewed</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 🚨 Policy Not Approved Warning Popup Modal */}
            {showApprovalWarningModal && unapprovedPolicyDetails && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md text-center space-y-4">
                        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-800">Policy Not Approved!</h3>
                            <p className="text-sm text-slate-500">
                                You cannot file a claim because policy <span className="font-semibold text-slate-700">#{unapprovedPolicyDetails.policyId}</span> is currently status: <span className="font-semibold text-amber-600 uppercase">'{unapprovedPolicyDetails.status}'</span>.
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-left space-y-1">
                            <p><strong>Policy Name:</strong> {unapprovedPolicyDetails.planName}</p>
                            <p><strong>Required Status:</strong> Approved</p>
                            <p className="text-slate-600 pt-1 border-t border-amber-200/60">
                                💡 Please wait for your policy to be approved before submitting claims.
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => setShowApprovalWarningModal(false)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-semibold text-sm transition shadow-md cursor-pointer"
                            >
                                Got it, Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 📄 Document Verification Modal */}
            {selectedClaimForDoc && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">🔍 Document Verification</h3>
                                <p className="text-xs text-slate-500">Claim #{selectedClaimForDoc.id} - {selectedClaimForDoc.user_email}</p>
                            </div>
                            <button
                                onClick={() => setSelectedClaimForDoc(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Submitted Attachments:</h4>
                            <div className="space-y-2">
                                {(selectedClaimForDoc.documents || ['Medical_Bill_Receipt.pdf', 'Policy_Copy.pdf', 'ID_Proof.png']).map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs">
                                        <span className="font-medium text-slate-700">{doc}</span>
                                        <button
                                            onClick={() => {
                                                const fileData = selectedClaimForDoc.documentUrls?.[doc];
                                                if (fileData && fileData.startsWith('data:')) {
                                                    const win = window.open();
                                                    if (win) {
                                                        win.document.write(`
                                                            <html>
                                                                <head><title>Viewing - ${doc}</title></head>
                                                                <body style="margin:0; background:#0f172a; display:flex; justify-content:center; align-items:center; height:100vh;">
                                                                    ${doc.match(/\.(jpg|jpeg|png|gif)$/i) 
                                                                        ? `<img src="${fileData}" style="max-width:100%; max-height:100%; object-fit:contain;" />`
                                                                        : `<iframe src="${fileData}" style="width:100%; height:100%; border:none;"></iframe>`
                                                                    }
                                                                </body>
                                                            </html>
                                                        `);
                                                    }
                                                } else {
                                                    toast.success(`Opening preview for ${doc}...`);
                                                    const previewWindow = window.open('', '_blank');
                                                    if (previewWindow) {
                                                        previewWindow.document.write(`
                                                            <html>
                                                                <head><title>Preview - ${doc}</title></head>
                                                                <body style="font-family: Arial; padding: 30px; text-align: center; background: #f8fafc;">
                                                                    <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 500px; margin: auto;">
                                                                        <h2 style="color: #1e293b;">Document Preview</h2>
                                                                        <p style="color: #64748b; font-size: 14px;"><strong>File Name:</strong> ${doc}</p>
                                                                        <p style="color: #64748b; font-size: 14px;"><strong>Claim ID:</strong> #${selectedClaimForDoc.id}</p>
                                                                        <div style="margin-top: 20px; padding: 30px; border: 2px dashed #cbd5e1; border-radius: 8px; color: #94a3b8;">
                                                                            [Simulated File Content / Uploaded in Legacy Mode]
                                                                        </div>
                                                                    </div>
                                                                </body>
                                                            </html>
                                                        `);
                                                    }
                                                }
                                            }}
                                            className="text-blue-600 hover:underline font-semibold cursor-pointer"
                                        >
                                            View File
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3 flex justify-end">
                            <button
                                onClick={() => setSelectedClaimForDoc(null)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold text-xs transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Filing Claims (Customer View Only) */}
            {showClaimModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="text-lg font-bold text-slate-800">📄 File an Insurance Claim</h3>
                            <button
                                onClick={() => setShowClaimModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleFileClaim} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Policy ID
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. POL-102938"
                                    value={policyId}
                                    onChange={(e) => setPolicyId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Claim Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 25000"
                                    value={claimAmount}
                                    onChange={(e) => setClaimAmount(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    min="1000"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Reason for Claim
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Describe the reason for filing this claim..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                ></textarea>
                            </div>

                            <div className="space-y-3 pt-1 border-t border-slate-100">
                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Required Documents</p>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Medical Bill / Receipt (.pdf/.jpg/.png)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.png,.jpeg"
                                        onChange={(e) => setMedicalBill(e.target.files[0])}
                                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Policy Copy (.pdf/.jpg/.png)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.png,.jpeg"
                                        onChange={(e) => setPolicyCopy(e.target.files[0])}
                                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        ID Proof (.pdf/.jpg/.png)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.png,.jpeg"
                                        onChange={(e) => setIdProof(e.target.files[0])}
                                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowClaimModal(false)}
                                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-xs transition shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Processing...' : 'Submit Claim'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Claims;