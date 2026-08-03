import React, { useEffect, useState } from 'react';
import API from '../api/axiosInstance';
import { FileText, Download, Plus, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Documents = () => {
    const [docs, setDocs] = useState([]);
    const [showUpload, setShowUpload] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [docType, setDocType] = useState('Identity Proof');

    const fetchDocs = async () => {
        try {
            const res = await API.get('/documents');
            setDocs(res.data || []);
        } catch (err) {
            console.warn("Backend offline, fetching local documents");
            const localDocs = JSON.parse(localStorage.getItem('user_documents') || '[]');
            if (localDocs.length === 0) {
                const sampleDocs = [
                    { id: 1, file_name: 'Aadhar_Card_Front.pdf', document_type: 'Identity Proof' },
                    { id: 2, file_name: 'Policy_Claim_Form.pdf', document_type: 'Claim Support Proof' }
                ];
                localStorage.setItem('user_documents', JSON.stringify(sampleDocs));
                setDocs(sampleDocs);
            } else {
                setDocs(localDocs);
            }
        }
    };

    useEffect(() => {
        fetchDocs();
    }, []);

    // Handle File Upload Functionality
    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error("Kripya ek file select karein!");
            return;
        }

        const fileName = selectedFile.name;

        try {
            // Send file to Backend API via Multipart FormData
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('document_type', docType);

            await API.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Document Uploaded to Server Successfully!');
        } catch (err) {
            console.warn("Backend unreachable. Saving file metadata locally.");
            
            // Fallback for local testing
            const newDoc = {
                id: Date.now(),
                file_name: fileName,
                document_type: docType
            };

            const existing = JSON.parse(localStorage.getItem('user_documents') || '[]');
            existing.unshift(newDoc);
            localStorage.setItem('user_documents', JSON.stringify(existing));
            toast.success('Saved locally (Offline mode)!');
        }

        setSelectedFile(null);
        setShowUpload(false);
        fetchDocs();
    };

    // Handle PDF Download Functionality
    const handleDownload = async (fileName) => {
        const downloadUrl = `http://127.0.0.1:5000/api/documents/download/${fileName}`;

        try {
            // Attempt standard API download in a new tab
            window.open(downloadUrl, '_blank');
            toast.success(`Opening ${fileName}...`);
        } catch (err) {
            console.warn("API Download failed. Triggering browser fallback...");
            
            // Offline Blob Fallback for testing
            const dummyBlob = new Blob([`Dummy content for ${fileName}`], { type: 'application/pdf' });
            const localUrl = URL.createObjectURL(dummyBlob);
            
            const tempLink = document.createElement('a');
            tempLink.href = localUrl;
            tempLink.download = fileName;
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            URL.revokeObjectURL(localUrl);
            toast.success(`Downloaded ${fileName}`);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" /> Uploaded Documents
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Manage and view your identity & policy files.</p>
                </div>
                <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md"
                >
                    <Plus className="w-4 h-4" /> Upload Document
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                            <th className="p-4">File Name</th>
                            <th className="p-4">Document Type</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {docs.map((d) => (
                            <tr key={d.id} className="hover:bg-slate-50/50">
                                <td className="p-4 font-semibold text-slate-800">{d.file_name}</td>
                                <td className="p-4 text-slate-600">{d.document_type}</td>
                                <td className="p-4">
                                    <button
                                        type="button"
                                        onClick={() => handleDownload(d.file_name)}
                                        className="text-blue-600 hover:underline font-semibold flex items-center gap-1 text-xs cursor-pointer"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Download
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-blue-600" /> Upload New Document
                            </h3>
                            <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Select File (PDF, PNG, JPG)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Document Type</label>
                                <select
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm cursor-pointer"
                                >
                                    <option value="Identity Proof">Identity Proof</option>
                                    <option value="Policy Document">Policy Document</option>
                                    <option value="Claim Support Proof">Claim Support Proof</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowUpload(false)}
                                    className="w-1/2 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
                                >
                                    Upload File
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documents;