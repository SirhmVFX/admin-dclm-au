"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    getTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    Testimonial,
} from "@/lib/firestore";
import ImageUpload from "@/components/ImageUpload";
import { MdAdd, MdEdit, MdDelete, MdClose } from "react-icons/md";

const empty: Omit<Testimonial, "id"> = {
    name: "",
    role: "",
    feedback: "",
    imgSrc: "",
    published: true,
    order: 0,
};

export default function TestimonialsPage() {
    const [items, setItems] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Testimonial | null>(null);
    const [form, setForm] = useState<Omit<Testimonial, "id">>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        setItems(await getTestimonials());
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    function openNew() { setEditing(null); setForm(empty); setError(""); setShowModal(true); }
    function openEdit(t: Testimonial) {
        setEditing(t);
        setForm({ name: t.name, role: t.role, feedback: t.feedback, imgSrc: t.imgSrc, published: t.published, order: t.order });
        setError(""); setShowModal(true);
    }

    async function handleSave() {
        if (!form.name || !form.feedback) { setError("Name and feedback are required."); return; }
        setSaving(true); setError("");
        try {
            if (editing?.id) await updateTestimonial(editing.id, form);
            else await createTestimonial(form);
            setShowModal(false); await load();
        } catch (e) { setError(e instanceof Error ? e.message : "Failed."); }
        finally { setSaving(false); }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this testimonial?")) return;
        await deleteTestimonial(id); await load();
    }

    async function togglePublished(t: Testimonial) {
        if (!t.id) return;
        await updateTestimonial(t.id, { published: !t.published }); await load();
    }

    return (
        <div className="max-w-4xl space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Testimonials</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Member testimonials shown on the homepage</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openNew}>
                    <MdAdd size={16} /> Add Testimonial
                </button>
            </div>

            {loading ? (
                <div className="admin-card text-sm text-gray-500">Loading…</div>
            ) : items.length === 0 ? (
                <div className="admin-card text-sm text-gray-500 text-center py-8">No testimonials yet.</div>
            ) : (
                <div className="admin-card p-0 overflow-hidden overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Photo</th><th>Name</th><th>Role</th><th>Feedback</th><th>Order</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {items.map((t) => (
                                <tr key={t.id}>
                                    <td>{t.imgSrc && <Image src={t.imgSrc} alt="" width={40} height={40} className="w-10 h-10 object-cover" />}</td>
                                    <td className="font-medium text-gray-800">{t.name}</td>
                                    <td className="text-gray-500 text-xs">{t.role}</td>
                                    <td className="text-gray-500 text-xs max-w-[200px] truncate">{t.feedback}</td>
                                    <td>{t.order}</td>
                                    <td>
                                        <button onClick={() => togglePublished(t)}>
                                            <span className={`badge ${t.published ? "badge-green" : "badge-gray"}`}>
                                                {t.published ? "Visible" : "Hidden"}
                                            </span>
                                        </button>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn-secondary py-1 px-2" onClick={() => openEdit(t)}><MdEdit size={14} /></button>
                                            <button className="btn-danger py-1 px-2" onClick={() => handleDelete(t.id!)}><MdDelete size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div className="modal-header">
                            <h2 className="text-base font-semibold">{editing ? "Edit Testimonial" : "Add Testimonial"}</h2>
                            <button onClick={() => setShowModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="admin-label">Name</label>
                                    <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emmanuel Okafor" />
                                </div>
                                <div>
                                    <label className="admin-label">Role</label>
                                    <input className="admin-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Campus Member" />
                                </div>
                            </div>

                            <div>
                                <label className="admin-label">Feedback</label>
                                <textarea className="admin-input" rows={4} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} placeholder="Their testimonial text" />
                            </div>

                            <ImageUpload value={form.imgSrc} onChange={(url) => setForm({ ...form, imgSrc: url })} label="Profile Photo" />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="admin-label">Display Order</label>
                                    <input type="number" className="admin-input" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
                                        <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                                        Visible on homepage
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Testimonial"}</button>
                                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
