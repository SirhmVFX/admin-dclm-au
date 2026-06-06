"use client";

import { useEffect, useState } from "react";
import {
    getFAQs,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    FAQItem,
} from "@/lib/firestore";
import { MdAdd, MdEdit, MdDelete, MdClose } from "react-icons/md";

const empty: Omit<FAQItem, "id"> = {
    question: "",
    answer: "",
    order: 0,
    active: true,
};

export default function FAQsPage() {
    const [items, setItems] = useState<FAQItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<FAQItem | null>(null);
    const [form, setForm] = useState<Omit<FAQItem, "id">>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        setItems(await getFAQs());
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    function openNew() { setEditing(null); setForm(empty); setError(""); setShowModal(true); }
    function openEdit(f: FAQItem) {
        setEditing(f);
        setForm({ question: f.question, answer: f.answer, order: f.order, active: f.active });
        setError(""); setShowModal(true);
    }

    async function handleSave() {
        if (!form.question || !form.answer) { setError("Question and answer are required."); return; }
        setSaving(true); setError("");
        try {
            if (editing?.id) await updateFAQ(editing.id, form);
            else await createFAQ(form);
            setShowModal(false); await load();
        } catch (e) { setError(e instanceof Error ? e.message : "Failed."); }
        finally { setSaving(false); }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this FAQ?")) return;
        await deleteFAQ(id); await load();
    }

    async function toggleActive(f: FAQItem) {
        if (!f.id) return;
        await updateFAQ(f.id, { active: !f.active }); await load();
    }

    return (
        <div className="max-w-4xl space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">FAQs</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Frequently asked questions shown across the site</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openNew}>
                    <MdAdd size={16} /> Add FAQ
                </button>
            </div>

            {loading ? (
                <div className="admin-card text-sm text-gray-500">Loading…</div>
            ) : items.length === 0 ? (
                <div className="admin-card text-sm text-gray-500 text-center py-8">No FAQs yet.</div>
            ) : (
                <div className="admin-card p-0 overflow-hidden">
                    <table className="admin-table">
                        <thead>
                            <tr><th>#</th><th>Question</th><th>Answer (excerpt)</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {items.map((f) => (
                                <tr key={f.id}>
                                    <td className="text-gray-400">{f.order}</td>
                                    <td className="font-medium text-gray-800 max-w-[220px] truncate">{f.question}</td>
                                    <td className="text-gray-500 text-xs max-w-[260px] truncate">{f.answer}</td>
                                    <td>
                                        <button onClick={() => toggleActive(f)}>
                                            <span className={`badge ${f.active ? "badge-green" : "badge-gray"}`}>
                                                {f.active ? "Active" : "Hidden"}
                                            </span>
                                        </button>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn-secondary py-1 px-2" onClick={() => openEdit(f)}><MdEdit size={14} /></button>
                                            <button className="btn-danger py-1 px-2" onClick={() => handleDelete(f.id!)}><MdDelete size={14} /></button>
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
                            <h2 className="text-base font-semibold">{editing ? "Edit FAQ" : "Add FAQ"}</h2>
                            <button onClick={() => setShowModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

                            <div>
                                <label className="admin-label">Question</label>
                                <input className="admin-input" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="e.g. What is DCLM Australia about?" />
                            </div>

                            <div>
                                <label className="admin-label">Answer</label>
                                <textarea className="admin-input" rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Write the full answer" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="admin-label">Display Order</label>
                                    <input type="number" className="admin-input" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label className="admin-label">Status</label>
                                    <select className="admin-input" value={form.active ? "active" : "hidden"} onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}>
                                        <option value="active">Active</option>
                                        <option value="hidden">Hidden</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save FAQ"}</button>
                                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
