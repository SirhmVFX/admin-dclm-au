"use client";

import { useEffect, useState } from "react";
import {
    getArticleCategories,
    createArticleCategory,
    updateArticleCategory,
    deleteArticleCategory,
    ArticleCategory,
} from "@/lib/firestore";
import { MdAdd, MdEdit, MdDelete, MdClose } from "react-icons/md";

function toSlug(name: string) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

const empty: Omit<ArticleCategory, "id"> = {
    name: "",
    slug: "",
    description: "",
    order: 0,
    active: true,
};

export default function ArticleCategoriesPage() {
    const [categories, setCategories] = useState<ArticleCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<ArticleCategory | null>(null);
    const [form, setForm] = useState<Omit<ArticleCategory, "id">>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        const data = await getArticleCategories();
        setCategories(data);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    function openNew() {
        setEditing(null);
        setForm({ ...empty, order: categories.length });
        setError("");
        setShowModal(true);
    }

    function openEdit(cat: ArticleCategory) {
        setEditing(cat);
        setForm({
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            order: cat.order,
            active: cat.active,
        });
        setError("");
        setShowModal(true);
    }

    function handleNameChange(name: string) {
        setForm((prev) => ({
            ...prev,
            name,
            // Auto-fill slug only if user hasn't manually edited it
            slug: editing ? prev.slug : toSlug(name),
        }));
    }

    async function handleSave() {
        if (!form.name.trim()) { setError("Name is required."); return; }
        if (!form.slug.trim()) { setError("Slug is required."); return; }
        setSaving(true);
        setError("");
        try {
            if (editing?.id) {
                await updateArticleCategory(editing.id, form);
            } else {
                await createArticleCategory(form);
            }
            setShowModal(false);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this category? Articles assigned to it will lose this category tag.")) return;
        await deleteArticleCategory(id);
        await load();
    }

    async function toggleActive(cat: ArticleCategory) {
        if (!cat.id) return;
        await updateArticleCategory(cat.id, { active: !cat.active });
        await load();
    }

    return (
        <div className="max-w-3xl space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Article Categories</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Organise articles into categories for filtering on the website</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openNew}>
                    <MdAdd size={16} /> New Category
                </button>
            </div>

            {loading ? (
                <div className="admin-card text-sm text-gray-500">Loading…</div>
            ) : categories.length === 0 ? (
                <div className="admin-card text-sm text-gray-500 text-center py-8">
                    No categories yet. Create one to start organising articles.
                </div>
            ) : (
                <div className="admin-card p-0 overflow-hidden overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Slug</th>
                                <th>Description</th>
                                <th>Order</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id}>
                                    <td className="font-medium text-gray-800">{cat.name}</td>
                                    <td className="text-gray-400 text-xs font-mono">{cat.slug}</td>
                                    <td className="text-gray-500 text-xs max-w-[200px] truncate">{cat.description || <span className="text-gray-300">—</span>}</td>
                                    <td className="text-gray-500 text-xs">{cat.order}</td>
                                    <td>
                                        <button onClick={() => toggleActive(cat)}>
                                            <span className={`badge ${cat.active ? "badge-green" : "badge-yellow"}`}>
                                                {cat.active ? "Active" : "Hidden"}
                                            </span>
                                        </button>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn-secondary py-1 px-2 text-xs" onClick={() => openEdit(cat)}>
                                                <MdEdit size={14} />
                                            </button>
                                            <button className="btn-danger py-1 px-2 text-xs" onClick={() => handleDelete(cat.id!)}>
                                                <MdDelete size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h2 className="text-base font-semibold">{editing ? "Edit Category" : "New Category"}</h2>
                            <button onClick={() => setShowModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

                            <div>
                                <label className="admin-label">Name</label>
                                <input
                                    className="admin-input"
                                    value={form.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="e.g. Faith & Devotion"
                                />
                            </div>

                            <div>
                                <label className="admin-label">Slug</label>
                                <input
                                    className="admin-input font-mono text-sm"
                                    value={form.slug}
                                    onChange={(e) => setForm({ ...form, slug: toSlug(e.target.value) })}
                                    placeholder="e.g. faith-and-devotion"
                                />
                                <p className="text-xs text-gray-400 mt-1">Used in URLs — auto-generated from name, lowercase with hyphens.</p>
                            </div>

                            <div>
                                <label className="admin-label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                                <textarea
                                    className="admin-input"
                                    rows={2}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Brief description of this category"
                                />
                            </div>

                            <div>
                                <label className="admin-label">Display Order</label>
                                <input
                                    type="number"
                                    className="admin-input"
                                    value={form.order}
                                    onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                                    min={0}
                                />
                                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first in the filter tabs.</p>
                            </div>

                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                                />
                                Active (visible as a filter tab on the website)
                            </label>

                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving…" : "Save Category"}
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
