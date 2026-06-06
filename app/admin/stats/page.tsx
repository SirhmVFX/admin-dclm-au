"use client";

import { useEffect, useState } from "react";
import {
    getStats,
    createStat,
    updateStat,
    deleteStat,
    Stat,
} from "@/lib/firestore";
import { MdAdd, MdEdit, MdDelete, MdClose } from "react-icons/md";

const empty: Omit<Stat, "id"> = {
    value: "",
    label: "",
    order: 0,
    active: true,
};

export default function StatsPage() {
    const [items, setItems] = useState<Stat[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Stat | null>(null);
    const [form, setForm] = useState<Omit<Stat, "id">>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        setItems(await getStats());
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    function openNew() { setEditing(null); setForm(empty); setError(""); setShowModal(true); }
    function openEdit(s: Stat) {
        setEditing(s);
        setForm({ value: s.value, label: s.label, order: s.order, active: s.active });
        setError(""); setShowModal(true);
    }

    async function handleSave() {
        if (!form.value || !form.label) { setError("Value and label are required."); return; }
        setSaving(true); setError("");
        try {
            if (editing?.id) await updateStat(editing.id, form);
            else await createStat(form);
            setShowModal(false); await load();
        } catch (e) { setError(e instanceof Error ? e.message : "Failed."); }
        finally { setSaving(false); }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this stat?")) return;
        await deleteStat(id); await load();
    }

    async function toggleActive(s: Stat) {
        if (!s.id) return;
        await updateStat(s.id, { active: !s.active }); await load();
    }

    return (
        <div className="max-w-3xl space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Stats</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Stat blocks displayed on the homepage and About page</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openNew}>
                    <MdAdd size={16} /> Add Stat
                </button>
            </div>

            <div className="admin-card p-4">
                <p className="text-xs text-gray-500">
                    These stats appear in the &quot;Who We Are&quot; section on the homepage. Example: value = &quot;100%&quot;, label = &quot;Inter-denominational&quot;.
                </p>
            </div>

            {loading ? (
                <div className="admin-card text-sm text-gray-500">Loading…</div>
            ) : items.length === 0 ? (
                <div className="admin-card text-sm text-gray-500 text-center py-8">No stats yet.</div>
            ) : (
                <div className="admin-card p-0 overflow-hidden">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Order</th><th>Value</th><th>Label</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {items.map((s) => (
                                <tr key={s.id}>
                                    <td>{s.order}</td>
                                    <td className="font-bold text-gray-900 text-lg">{s.value}</td>
                                    <td className="text-gray-500 text-xs">{s.label}</td>
                                    <td>
                                        <button onClick={() => toggleActive(s)}>
                                            <span className={`badge ${s.active ? "badge-green" : "badge-gray"}`}>
                                                {s.active ? "Active" : "Hidden"}
                                            </span>
                                        </button>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn-secondary py-1 px-2" onClick={() => openEdit(s)}><MdEdit size={14} /></button>
                                            <button className="btn-danger py-1 px-2" onClick={() => handleDelete(s.id!)}><MdDelete size={14} /></button>
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
                            <h2 className="text-base font-semibold">{editing ? "Edit Stat" : "Add Stat"}</h2>
                            <button onClick={() => setShowModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

                            <div>
                                <label className="admin-label">Value</label>
                                <input className="admin-input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder='e.g. "100%" or "Win"' />
                            </div>

                            <div>
                                <label className="admin-label">Label</label>
                                <input className="admin-input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Inter-denominational" />
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
                                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Stat"}</button>
                                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
