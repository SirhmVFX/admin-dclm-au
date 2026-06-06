"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    getTeachings,
    createTeaching,
    updateTeaching,
    deleteTeaching,
    Teaching,
} from "@/lib/firestore";
import ImageUpload from "@/components/ImageUpload";
import WysiwygEditor from "@/components/WysiwygEditor";
import { MdAdd, MdEdit, MdDelete, MdClose } from "react-icons/md";

const empty: Omit<Teaching, "id"> = {
    title: "",
    description: "",
    content: "",
    teacher: "DLCF Teaching Team",
    bibleVerse: "",
    date: new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" }),
    imgSrc: "",
    published: false,
};

export default function TeachingsPage() {
    const [items, setItems] = useState<Teaching[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Teaching | null>(null);
    const [form, setForm] = useState<Omit<Teaching, "id">>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        const data = await getTeachings();
        setItems([...data].reverse());
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    function openNew() { setEditing(null); setForm(empty); setError(""); setShowModal(true); }
    function openEdit(t: Teaching) {
        setEditing(t);
        setForm({ title: t.title, description: t.description, content: t.content, teacher: t.teacher, bibleVerse: t.bibleVerse, date: t.date, imgSrc: t.imgSrc, published: t.published });
        setError(""); setShowModal(true);
    }

    async function handleSave() {
        if (!form.title) { setError("Title is required."); return; }
        setSaving(true); setError("");
        try {
            if (editing?.id) await updateTeaching(editing.id, form);
            else await createTeaching(form);
            setShowModal(false); await load();
        } catch (e) { setError(e instanceof Error ? e.message : "Failed."); }
        finally { setSaving(false); }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this teaching?")) return;
        await deleteTeaching(id); await load();
    }

    async function togglePublished(t: Teaching) {
        if (!t.id) return;
        await updateTeaching(t.id, { published: !t.published }); await load();
    }

    return (
        <div className="max-w-5xl space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Teachings</h1>
                    <p className="text-xs text-gray-500 mt-0.5">In-depth Bible Review Series teachings</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openNew}>
                    <MdAdd size={16} /> New Teaching
                </button>
            </div>

            {loading ? (
                <div className="admin-card text-sm text-gray-500">Loading…</div>
            ) : items.length === 0 ? (
                <div className="admin-card text-sm text-gray-500 text-center py-8">No teachings yet.</div>
            ) : (
                <div className="admin-card p-0 overflow-hidden overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Image</th><th>Title</th><th>Teacher</th><th>Verse</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {items.map((t) => (
                                <tr key={t.id}>
                                    <td>{t.imgSrc && <Image src={t.imgSrc} alt="" width={64} height={40} className="w-16 h-10 object-cover" />}</td>
                                    <td className="font-medium text-gray-800 max-w-[160px] truncate">{t.title}</td>
                                    <td className="text-gray-500 text-xs">{t.teacher}</td>
                                    <td className="text-gray-500 text-xs">{t.bibleVerse}</td>
                                    <td className="text-gray-500 text-xs whitespace-nowrap">{t.date}</td>
                                    <td>
                                        <button onClick={() => togglePublished(t)}>
                                            <span className={`badge ${t.published ? "badge-green" : "badge-yellow"}`}>
                                                {t.published ? "Published" : "Draft"}
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
                    <div className="modal-box" style={{ maxWidth: 760 }}>
                        <div className="modal-header">
                            <h2 className="text-base font-semibold">{editing ? "Edit Teaching" : "New Teaching"}</h2>
                            <button onClick={() => setShowModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

                            <div>
                                <label className="admin-label">Title</label>
                                <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 1st Thessalonians" />
                            </div>

                            <div>
                                <label className="admin-label">Short Description</label>
                                <textarea className="admin-input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>

                            <ImageUpload value={form.imgSrc} onChange={(url) => setForm({ ...form, imgSrc: url })} label="Cover Image" />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="admin-label">Teacher</label>
                                    <input className="admin-input" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} />
                                </div>
                                <div>
                                    <label className="admin-label">Bible Verse</label>
                                    <input className="admin-input" value={form.bibleVerse} onChange={(e) => setForm({ ...form, bibleVerse: e.target.value })} placeholder="e.g. 1 Thessalonians 5:23" />
                                </div>
                                <div>
                                    <label className="admin-label">Date</label>
                                    <input className="admin-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="admin-label">Full Teaching Content</label>
                                <WysiwygEditor content={form.content} onChange={(html) => setForm({ ...form, content: html })} placeholder="Write the full teaching here…" />
                            </div>

                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                                Published
                            </label>

                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Teaching"}</button>
                                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
