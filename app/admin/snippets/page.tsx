"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    getSnippets,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    Snippet,
} from "@/lib/firestore";
import ImageUpload from "@/components/ImageUpload";
import WysiwygEditor from "@/components/WysiwygEditor";
import { MdAdd, MdEdit, MdDelete, MdClose } from "react-icons/md";

const empty: Omit<Snippet, "id"> = {
    title: "",
    description: "",
    content: "",
    img: "",
    published: false,
};

export default function SnippetsPage() {
    const [items, setItems] = useState<Snippet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Snippet | null>(null);
    const [form, setForm] = useState<Omit<Snippet, "id">>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        const data = await getSnippets();
        setItems([...data].reverse());
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    function openNew() { setEditing(null); setForm(empty); setError(""); setShowModal(true); }
    function openEdit(s: Snippet) {
        setEditing(s);
        setForm({ title: s.title, description: s.description, content: s.content, img: s.img, published: s.published });
        setError(""); setShowModal(true);
    }

    async function handleSave() {
        if (!form.title) { setError("Title is required."); return; }
        setSaving(true); setError("");
        try {
            if (editing?.id) await updateSnippet(editing.id, form);
            else await createSnippet(form);
            setShowModal(false); await load();
        } catch (e) { setError(e instanceof Error ? e.message : "Failed."); }
        finally { setSaving(false); }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this snippet?")) return;
        await deleteSnippet(id); await load();
    }

    async function togglePublished(s: Snippet) {
        if (!s.id) return;
        await updateSnippet(s.id, { published: !s.published }); await load();
    }

    return (
        <div className="max-w-5xl space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Bible Snippets</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Short reflections shown on the Snippets page</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openNew}>
                    <MdAdd size={16} /> New Snippet
                </button>
            </div>

            {loading ? (
                <div className="admin-card text-sm text-gray-500">Loading…</div>
            ) : items.length === 0 ? (
                <div className="admin-card text-sm text-gray-500 text-center py-8">No snippets yet.</div>
            ) : (
                <div className="admin-card p-0 overflow-hidden overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Image</th><th>Title</th><th>Description</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {items.map((s) => (
                                <tr key={s.id}>
                                    <td>{s.img && <Image src={s.img} alt="" width={64} height={40} className="w-16 h-10 object-cover" />}</td>
                                    <td className="font-medium text-gray-800 max-w-[180px] truncate">{s.title}</td>
                                    <td className="text-gray-500 text-xs max-w-[240px] truncate">{s.description}</td>
                                    <td>
                                        <button onClick={() => togglePublished(s)}>
                                            <span className={`badge ${s.published ? "badge-green" : "badge-yellow"}`}>
                                                {s.published ? "Published" : "Draft"}
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
                    <div className="modal-box" style={{ maxWidth: 720 }}>
                        <div className="modal-header">
                            <h2 className="text-base font-semibold">{editing ? "Edit Snippet" : "New Snippet"}</h2>
                            <button onClick={() => setShowModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

                            <div>
                                <label className="admin-label">Title</label>
                                <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Choose to Trust in God" />
                            </div>

                            <div>
                                <label className="admin-label">Short Description</label>
                                <textarea className="admin-input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>

                            <ImageUpload value={form.img} onChange={(url) => setForm({ ...form, img: url })} label="Thumbnail Image" />

                            <div>
                                <label className="admin-label">Full Content</label>
                                <WysiwygEditor content={form.content} onChange={(html) => setForm({ ...form, content: html })} placeholder="Write the full snippet here…" />
                            </div>

                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                                Published
                            </label>

                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Snippet"}</button>
                                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
