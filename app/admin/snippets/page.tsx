"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    getSnippets,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    Snippet,
    getSnippetCategories,
    SnippetCategory,
} from "@/lib/firestore";
import ImageUpload from "@/components/ImageUpload";
import WysiwygEditor from "@/components/WysiwygEditor";
import { MdAdd, MdEdit, MdDelete, MdClose } from "react-icons/md";

const empty: Omit<Snippet, "id"> = {
    title: "", description: "", content: "", img: "", published: false, categoryIds: [],
};

export default function SnippetsPage() {
    const [items, setItems] = useState<Snippet[]>([]);
    const [categories, setCategories] = useState<SnippetCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Snippet | null>(null);
    const [form, setForm] = useState<Omit<Snippet, "id">>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        const [data, cats] = await Promise.all([getSnippets(), getSnippetCategories()]);
        setItems([...data].reverse());
        setCategories(cats.filter((c) => c.active));
        setLoading(false);
    }
    useEffect(() => { load(); }, []);

    function openNew() { setEditing(null); setForm(empty); setError(""); setShowModal(true); }
    function openEdit(s: Snippet) {
        setEditing(s);
        setForm({ title: s.title, description: s.description, content: s.content, img: s.img, published: s.published, categoryIds: s.categoryIds ?? [] });
        setError(""); setShowModal(true);
    }
    function toggleCategory(id: string) {
        setForm((p) => ({
            ...p,
            categoryIds: p.categoryIds.includes(id)
                ? p.categoryIds.filter((c) => c !== id)
                : [...p.categoryIds, id],
        }));
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
    function getCategoryNames(ids: string[] = []) {
        return ids.map((id) => categories.find((c) => c.id === id)?.name).filter(Boolean).join(", ");
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
                            <tr>
                                <th>Image</th>
                                <th>Title</th>
                                <th>Categories</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((s) => (
                                <tr key={s.id}>
                                    <td>{s.img && <Image src={s.img} alt="" width={64} height={40} className="w-16 h-10 object-cover" />}</td>
                                    <td className="font-medium text-gray-800 max-w-45 truncate">{s.title}</td>
                                    <td className="text-gray-500 text-xs max-w-35 truncate">
                                        {getCategoryNames(s.categoryIds) || <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="text-gray-500 text-xs max-w-60 truncate">{s.description}</td>
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

                            {categories.length > 0 && (
                                <div>
                                    <label className="admin-label">Categories</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {categories.map((cat) => (
                                            <label
                                                key={cat.id}
                                                className={`flex items-center gap-1.5 text-sm px-3 py-1 border cursor-pointer transition-colors ${form.categoryIds.includes(cat.id!)
                                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                                                    }`}
                                            >
                                                <input type="checkbox" className="hidden" checked={form.categoryIds.includes(cat.id!)} onChange={() => toggleCategory(cat.id!)} />
                                                {cat.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="admin-label">Full Content</label>
                                <WysiwygEditor content={form.content} onChange={(html) => setForm({ ...form, content: html })} placeholder="Write the full snippet here…" />
                            </div>

                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                                Published
                            </label>

                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving…" : "Save Snippet"}
                                </button>
                                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
