import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Bell, Shield, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
    const [settings, setSettings] = useState({
        platformName: 'InsurShield Platform',
        supportEmail: 'support@insurshield.com',
        emailNotifications: true,
        smsAlerts: false,
        maintenanceMode: false,
        defaultCurrency: 'INR (₹)'
    });

    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaving(true);

        // Simulate save / local persistence
        setTimeout(() => {
            localStorage.setItem('system_settings', JSON.stringify(settings));
            setSaving(false);
            toast.success("System settings updated successfully!");
        }, 600);
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl border border-orange-100">
                        <SettingsIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800">System Settings</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Manage global configuration, preferences, and notification defaults.</p>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
                <form onSubmit={handleSave} className="space-y-6 max-w-3xl">

                    {/* General Section */}
                    <div>
                        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-orange-600" /> General Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Platform Name</label>
                                <input
                                    type="text"
                                    name="platformName"
                                    value={settings.platformName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-700"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Support Email</label>
                                <input
                                    type="email"
                                    name="supportEmail"
                                    value={settings.supportEmail}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-700"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Default Currency</label>
                                <select
                                    name="defaultCurrency"
                                    value={settings.defaultCurrency}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white font-medium text-slate-700 cursor-pointer"
                                >
                                    <option value="INR (₹)">INR (₹)</option>
                                    <option value="USD ($)">USD ($)</option>
                                    <option value="EUR (€)">EUR (€)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Notifications & Security */}
                    <div>
                        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-orange-600" /> Notifications & Operational Control
                        </h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/60 transition">
                                <input
                                    type="checkbox"
                                    name="emailNotifications"
                                    checked={settings.emailNotifications}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 cursor-pointer"
                                />
                                <div>
                                    <span className="text-sm font-semibold text-slate-800 block">Enable Email Notifications</span>
                                    <span className="text-xs text-slate-500">Send automated emails regarding premium dues, approvals, and rejections.</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/60 transition">
                                <input
                                    type="checkbox"
                                    name="smsAlerts"
                                    checked={settings.smsAlerts}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 cursor-pointer"
                                />
                                <div>
                                    <span className="text-sm font-semibold text-slate-800 block">Enable SMS Reminders (Mock)</span>
                                    <span className="text-xs text-slate-500">Send simulated text message updates to customers.</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-red-50/50 border border-red-100 rounded-xl hover:bg-red-50 transition">
                                <input
                                    type="checkbox"
                                    name="maintenanceMode"
                                    checked={settings.maintenanceMode}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500 cursor-pointer"
                                />
                                <div>
                                    <span className="text-sm font-semibold text-red-800 block">Maintenance Mode</span>
                                    <span className="text-xs text-red-500">Temporarily block regular user activities while keeping admin portal active.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer shadow-md shadow-orange-600/25 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" /> {saving ? "Saving Changes..." : "Save Settings"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;