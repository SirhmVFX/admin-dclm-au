"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    getArticles,
    createArticle,
    updateArticle,
    deleteArticle,
    Article,
    getArticleCategories,
    ArticleCategory,
} from "@/lib/firestore";
import ImageUpload from "@/components/ImageUpload";
import WysiwygEditor from "@/components/WysiwygEditor";
import { MdAdd, MdEdit, MdDelete, MdClose } from "react-icons/md";

const empty: Omit<Article, "id"> = {
    title: "",
    description: "",
    content: "",
    imgSrc: "",
    date: new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" }),
    readingTime: "5 min read",
    published: false,
    featured: false,
    categoryIds: [],
};

export default function ArticlesPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<ArticleCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Article | null>(null);
    const [form, setForm] = useState<Omit<Article, "id">>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        const [data, cats] = await Promise.all([getArticles(), getArticleCategories()]);
        setArticles([...data].reverse());
        setCategories(cats.filter((c) => c.active));
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    function openNew() {
        setEditing(null);
        setForm(empty);
        setError("");
        setShowModal(true);
    }

    function openEdit(article: Article) {
        setEditing(article);
        setForm({
            title: article.title,
            description: article.description,
            content: article.content,
            imgSrc: article.imgSrc,
            date: article.date,
            readingTime: article.readingTime,
            published: article.published,
            featured: article.featured,
            categoryIds: article.categoryIds ?? [],
        });
        setError("");
        setShowModal(true);
    }

    function toggleCategory(id: string) {
        setForm((prev) => ({
            ...prev,
            categoryIds: prev.categoryIds.includes(id)
                ? prev.categoryIds.filter((c) => c !== id)
                : [...prev.categoryIds, id],
        }));
    }

    async function handleSave() {
        if (!form.title) { setError("Title is required."); return; }
        setSaving(true);
        setError("");
        try {
            if (editing?.id) {
                await updateArticle(editing.id, form);
            } else {
                await createArticle(form);
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
        if (!confirm("Delete this article?")) return;
        await deleteArticle(id);
        await load();
    }

    async function togglePublished(article: Article) {
        if (!article.id) return;
        await updateArticle(article.id, { published: !article.published });
        await load();
    }

    function getCategoryNames(ids: string[] = []) {
        return ids
            .map((id) => categories.find((c) => c.id === id)?.name)
            .filter(Boolean)
            .join(", ");
    }

    return (
        <div className="max-w-5xl space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Articles</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Manage articles shown on the Articles page</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openNew}>
                    <MdAdd size={16} /> New Article
                </button>
            </div>

            {loading ? (
                <div className="admin-card text-sm text-gray-500">Loading…</div>
            ) : articles.length === 0 ? (
                <div className="admin-card text-sm text-gray-500 text-center py-8">No articles yet.</div>
            ) : (
                <div className="admin-card p-0 overflow-hidden overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Title</th>
                                <th>Categories</th>
                                <th>Date</th>
                                <th>Read Time</th>
                                <th>Featured</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {articles.map((article) => (
                                <tr key={article.id}>
                                    <td>
                                        {article.imgSrc && (
                                            <Image src={article.imgSrc} alt="" width={64} height={40} className="w-16 h-10 object-cover" />
                                        )}
                                    </td>
                                    <td className="font-medium text-gray-800 max-w-[180px] truncate">{article.title}</td>
                                    <td className="text-gray-500 text-xs max-w-[160px] truncate">
                                        {getCategoryNames(article.categoryIds) || <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="text-gray-500 text-xs whitespace-nowrap">{article.date}</td>
                                    <td className="text-gray-500 text-xs">{article.readingTime}</td>
                                    <td>
                                        <span className={`badge ${article.featured ? "badge-blue" : "badge-gray"}`}>
                                            {article.featured ? "Featured" : "–"}
                                        </span>
                                    </td>
                                    <td>
                                        <button onClick={() => togglePublished(article)}>
                                            <span className={`badge ${article.published ? "badge-green" : "badge-yellow"}`}>
                                                {article.published ? "Published" : "Draft"}
                                            </span>
                                        </button>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn-secondary py-1 px-2 text-xs" onClick={() => openEdit(article)}>
                                                <MdEdit size={14} />
                                            </button>
                                            <button className="btn-danger py-1 px-2 text-xs" onClick={() => handleDelete(article.id!)}>
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
                    <div className="modal-box" style={{ maxWidth: 760 }}>
                        <div className="modal-header">
                            <h2 className="text-base font-semibold">{editing ? "Edit Article" : "New Article"}</h2>
                            <button onClick={() => setShowModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

                            <div>
                                <label className="admin-label">Title</label>
                                <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Article title" />
                            </div>

                            <div>
                                <label className="admin-label">Short Description</label>
                                <textarea className="admin-input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief excerpt shown on listing cards" />
                            </div>

                            <ImageUpload value={form.imgSrc} onChange={(url) => setForm({ ...form, imgSrc: url })} label="Cover Image" />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="admin-label">Date</label>
                                    <input className="admin-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="e.g. February 25, 2024" />
                                </div>
                                <div>
                                    <label className="admin-label">Reading Time</label>
                                    <input className="admin-input" value={form.readingTime} onChange={(e) => setForm({ ...form, readingTime: e.target.value })} placeholder="e.g. 5 min read" />
                                </div>
                            </div>

                            {/* Categories */}
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
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={form.categoryIds.includes(cat.id!)}
                                                    onChange={() => toggleCategory(cat.id!)}
                                                />
                                                {cat.name}
                                            </label>
                                        ))}
                                    </div>
                                    {categories.length === 0 && (
                                        <p className="text-xs text-gray-400 mt-1">No categories yet — create some in Article Categories.</p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="admin-label">Full Content</label>
                                <WysiwygEditor
                                    content={form.content}
                                    onChange={(html) => setForm({ ...form, content: html })}
                                    placeholder="Write the full article here…"
                                />
                            </div>

                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                                    Published
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                                    Featured (show as hero article)
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving…" : "Save Article"}
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
