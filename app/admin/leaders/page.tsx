"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    getLeaders,
    createLeader,
    updateLeader,
    deleteLeader,
    Leader,
} from "@/lib/firestore";
import ImageUpload from "@/components/ImageUpload";
import { MdAdd, MdEdit, MdDelete, MdClose } from "react-icons/md";

const empty: Omit<Leader, "id"> = {
    name: "",
    title: "",
    image: "",
    bio: "Committed to prayer, biblical teaching, and building saints who shine for Christ in their campus and community.",
    order: 0,
    active: true,
};

export default function LeadersPage() {
    const [items, setItems] = useState<Leader[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Leader | null>(null);
    const [form, setForm] = useState<Omit<Leader, "id">>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        setItems(await getLeaders());
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    function openNew() { setEditing(null); setForm(empty); setError(""); setShowModal(true); }
    function openEdit(l: Leader) {
        setEditing(l);
        setForm({ name: l.name, title: l.title, image: l.image, bio: l.bio, order: l.order, active: l.active });
        setError(""); setShowModal(true);
    }

    async function handleSave() {
        if (!form.name || !form.title) { setError("Name and title are required."); return; }
        setSaving(true); setError("");
        try {
            if (editing?.id) await updateLeader(editing.id, form);
            else await createLeader(form);
            setShowModal(false); await load();
        } catch (e) { setError(e instanceof Error ? e.message : "Failed."); }
        finally { setSaving(false); }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this leader?")) return;
        await deleteLeader(id); await load();
    }

    async function toggleActive(l: Leader) {
        if (!l.id) return;
        await updateLeader(l.id, { active: !l.active }); await load();
    }

    return (
        <div className="max-w-4xl space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Leaders</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Leadership team shown on the About page</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openNew}>
                    <MdAdd size={16} /> Add Leader
                </button>
            </div>

            {loading ? (
                <div className="admin-card text-sm text-gray-500">Loading…</div>
            ) : items.length === 0 ? (
                <div className="admin-card text-sm text-gray-500 text-center py-8">No leaders yet.</div>
            ) : (
                <div className="admin-card p-0 overflow-hidden overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Photo</th><th>Name</th><th>Title</th><th>Order</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {items.map((l) => (
                                <tr key={l.id}>
                                    <td>{l.image && <Image src={l.image} alt="" width={48} height={48} className="w-12 h-12 object-cover" />}</td>
                                    <td className="font-medium text-gray-800">{l.name}</td>
                                    <td className="text-gray-500 text-xs">{l.title}</td>
                                    <td>{l.order}</td>
                                    <td>
                                        <button onClick={() => toggleActive(l)}>
                                            <span className={`badge ${l.active ? "badge-green" : "badge-gray"}`}>
                                                {l.active ? "Active" : "Hidden"}
                                            </span>
                                        </button>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn-secondary py-1 px-2" onClick={() => openEdit(l)}><MdEdit size={14} /></button>
                                            <button className="btn-danger py-1 px-2" onClick={() => handleDelete(l.id!)}><MdDelete size={14} /></button>
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
                            <h2 className="text-base font-semibold">{editing ? "Edit Leader" : "Add Leader"}</h2>
                            <button onClick={() => setShowModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="admin-label">Name</label>
                                    <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Pastor Michael" />
                                </div>
                                <div>
                                    <label className="admin-label">Title / Role</label>
                                    <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Fellowship Pastor" />
                                </div>
                            </div>

                            <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} label="Photo" />

                            <div>
                                <label className="admin-label">Bio</label>
                                <textarea className="admin-input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
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
                                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Leader"}</button>
                                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
