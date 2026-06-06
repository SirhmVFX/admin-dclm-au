"use client";

import { useEffect, useState } from "react";
import { getSiteSettings, saveSiteSettings, SiteSettings } from "@/lib/firestore";
import ImageUpload from "@/components/ImageUpload";

const defaultSettings: Omit<SiteSettings, "id" | "updatedAt"> = {
    siteName: "DCLM AU",
    siteDescription: "Deeper Christian Life Ministry Australia — Teaching the undiluted word of God, winning souls, and perfecting saints.",
    email: "campus@dclm-au.org",
    phone: "",
    address: "49-51 Cameron Street, Cranbourne VIC, Australia",
    facebookUrl: "https://web.facebook.com/dlcfaustralia/",
    instagramUrl: "https://www.instagram.com/dlcfaustralia",
    youtubeUrl: "https://www.youtube.com/@dlcfaustralia",
    logoUrl: "",
    ctaTitle: "Come worship with us",
    ctaSubtitle: "Join hands with the fellowship as we contend for the faith and raise godly leaders.",
    ctaBody: "Whether you are visiting for the first time or seeking a deeper walk with Christ, you are warmly welcomed.",
    ctaButtonText: "Become a member",
    ctaButtonUrl: "/sign-up",
    footerCopyright: "© 2026 DCLM Australia. All rights reserved.",
};

export default function SettingsPage() {
    const [form, setForm] = useState<Omit<SiteSettings, "id" | "updatedAt">>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        getSiteSettings().then((s) => {
            if (s) {
                const { id: _id, updatedAt: _updatedAt, ...rest } = s;
                setForm({ ...defaultSettings, ...rest });
            }
            setLoading(false);
        });
    }, []);

    function set(key: keyof typeof form, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSave() {
        setSaving(true); setSaved(false); setError("");
        try {
            await saveSiteSettings(form);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="admin-card text-sm text-gray-500">Loading settings…</div>;

    return (
        <div className="max-w-3xl space-y-6">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Site Settings</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Global settings used across the DCLM AU website</p>
                </div>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "Save Settings"}
                </button>
            </div>

            {saved && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">Settings saved successfully.</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

            {/* General */}
            <div className="admin-card space-y-4">
                <p className="text-xs font-semibold uppercase text-gray-500 border-b border-gray-100 pb-3">General</p>

                <div>
                    <label className="admin-label">Site Name</label>
                    <input className="admin-input" value={form.siteName} onChange={(e) => set("siteName", e.target.value)} />
                </div>

                <div>
                    <label className="admin-label">Site Description (SEO)</label>
                    <textarea className="admin-input" rows={3} value={form.siteDescription} onChange={(e) => set("siteDescription", e.target.value)} />
                </div>

                <ImageUpload value={form.logoUrl} onChange={(url) => set("logoUrl", url)} label="Site Logo" />
            </div>

            {/* Contact */}
            <div className="admin-card space-y-4">
                <p className="text-xs font-semibold uppercase text-gray-500 border-b border-gray-100 pb-3">Contact Information</p>

                <div>
                    <label className="admin-label">Email Address</label>
                    <input type="email" className="admin-input" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </div>

                <div>
                    <label className="admin-label">Phone</label>
                    <input className="admin-input" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Optional" />
                </div>

                <div>
                    <label className="admin-label">Address</label>
                    <input className="admin-input" value={form.address} onChange={(e) => set("address", e.target.value)} />
                </div>
            </div>

            {/* Social */}
            <div className="admin-card space-y-4">
                <p className="text-xs font-semibold uppercase text-gray-500 border-b border-gray-100 pb-3">Social Media Links</p>

                <div>
                    <label className="admin-label">Facebook URL</label>
                    <input type="url" className="admin-input" value={form.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} />
                </div>

                <div>
                    <label className="admin-label">Instagram URL</label>
                    <input type="url" className="admin-input" value={form.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} />
                </div>

                <div>
                    <label className="admin-label">YouTube URL</label>
                    <input type="url" className="admin-input" value={form.youtubeUrl} onChange={(e) => set("youtubeUrl", e.target.value)} />
                </div>
            </div>

            {/* CTA Section */}
            <div className="admin-card space-y-4">
                <p className="text-xs font-semibold uppercase text-gray-500 border-b border-gray-100 pb-3">Call-to-Action Section</p>
                <p className="text-xs text-gray-400">This controls the CTA banner shown at the bottom of most pages.</p>

                <div>
                    <label className="admin-label">CTA Label (small text above title)</label>
                    <input className="admin-input" value={form.ctaTitle} onChange={(e) => set("ctaTitle", e.target.value)} />
                </div>

                <div>
                    <label className="admin-label">CTA Headline</label>
                    <input className="admin-input" value={form.ctaSubtitle} onChange={(e) => set("ctaSubtitle", e.target.value)} />
                </div>

                <div>
                    <label className="admin-label">CTA Body Text</label>
                    <textarea className="admin-input" rows={3} value={form.ctaBody} onChange={(e) => set("ctaBody", e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="admin-label">CTA Button Text</label>
                        <input className="admin-input" value={form.ctaButtonText} onChange={(e) => set("ctaButtonText", e.target.value)} />
                    </div>
                    <div>
                        <label className="admin-label">CTA Button URL</label>
                        <input className="admin-input" value={form.ctaButtonUrl} onChange={(e) => set("ctaButtonUrl", e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="admin-card space-y-4">
                <p className="text-xs font-semibold uppercase text-gray-500 border-b border-gray-100 pb-3">Footer</p>

                <div>
                    <label className="admin-label">Copyright Text</label>
                    <input className="admin-input" value={form.footerCopyright} onChange={(e) => set("footerCopyright", e.target.value)} />
                </div>
            </div>

            <div className="flex justify-end">
                <button className="btn-primary px-8 py-3" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "Save All Settings"}
                </button>
            </div>
        </div>
    );
}
