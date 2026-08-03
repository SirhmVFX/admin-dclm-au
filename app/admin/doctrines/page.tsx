"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    getDoctrines,
    createDoctrine,
    updateDoctrine,
    deleteDoctrine,
    Doctrine,
    getItemViewCounts,
    ItemViewCount,
} from "@/lib/firestore";
import ImageUpload from "@/components/ImageUpload";
import WysiwygEditor from "@/components/WysiwygEditor";
import { MdAdd, MdEdit, MdDelete, MdClose, MdRemoveRedEye } from "react-icons/md";

const empty: Omit<Doctrine, "id"> = {
    title: "",
    description: "",
    content: "",
    imgSrc: "",
    date: new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" }),
    readingTime: "5 min read",
    published: false,
    featured: false,
    order: 0,
};

export default function DoctrinesPage() {
    const [doctrines, setDoctrines] = useState<Doctrine[]>([]);
    const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Doctrine | null>(null);
    const [form, setForm] = useState<Omit<Doctrine, "id">>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        const [data, views] = await Promise.all([
            getDoctrines(),
            getItemViewCounts("doctrine").catch(() => [] as ItemViewCount[]),
        ]);
        setDoctrines(data);
        const vc: Record<string, number> = {};
        views.forEach(v => { vc[v.itemId] = v.count; });
        setViewCounts(vc);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    function openNew() {
        setEditing(null);
        setForm(empty);
        setError("");
        setShowModal(true);
    }

    function openEdit(doc: Doctrine) {
        setEditing(doc);
        setForm({
            title: doc.title,
            description: doc.description,
            content: doc.content,
            imgSrc: doc.imgSrc,
            date: doc.date,
            readingTime: doc.readingTime,
            published: doc.published,
            featured: doc.featured,
            order: doc.order ?? 0,
        });
        setError("");
        setShowModal(true);
    }

    async function handleSave() {
        if (!form.title) { setError("Title is required."); return; }
        setSaving(true);
        setError("");
        try {
            if (editing?.id) {
                await updateDoctrine(editing.id, form);
            } else {
                await createDoctrine(form);
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
        if (!confirm("Delete this doctrine?")) return;
        await deleteDoctrine(id);
        await load();
    }

    async function togglePublished(doctrine: Doctrine) {
        if (!doctrine.id) return;
        await updateDoctrine(doctrine.id, { published: !doctrine.published });
        await load();
    }

    return (
        <div className="max-w-5xl space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Bible Doctrines</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Manage doctrine articles shown on the Bible Doctrine page</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openNew}>
                    <MdAdd size={16} /> New Doctrine
                </button>
            </div>

            {loading ? (
                <div className="admin-card text-sm text-gray-500">Loading…</div>
            ) : doctrines.length === 0 ? (
                <div className="admin-card text-sm text-gray-500 text-center py-8">
                    No doctrines yet. Add your first one.
                </div>
            ) : (
                <div className="admin-card p-0 overflow-hidden overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Image</th>
                                <th>Title</th>
                                <th>Date</th>
                                <th>Read Time</th>
                                <th>Featured</th>
                                <th>Status</th>
                                <th><MdRemoveRedEye size={14} className="inline mr-1" />Views</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctrines.map((doctrine) => (
                                <tr key={doctrine.id}>
                                    <td className="text-gray-500 font-mono text-xs">{doctrine.order ?? 0}</td>
                                    <td>
                                        {doctrine.imgSrc && (
                                            <Image src={doctrine.imgSrc} alt="" width={64} height={40} className="w-16 h-10 object-cover" />
                                        )}
                                    </td>
                                    <td className="font-medium text-gray-800 max-w-[240px] truncate">{doctrine.title}</td>
                                    <td className="text-gray-500 text-xs whitespace-nowrap">{doctrine.date}</td>
                                    <td className="text-gray-500 text-xs">{doctrine.readingTime}</td>
                                    <td>
                                        <span className={`badge ${doctrine.featured ? "badge-blue" : "badge-gray"}`}>
                                            {doctrine.featured ? "Featured" : "–"}
                                        </span>
                                    </td>
                                    <td>
                                        <button onClick={() => togglePublished(doctrine)}>
                                            <span className={`badge ${doctrine.published ? "badge-green" : "badge-yellow"}`}>
                                                {doctrine.published ? "Published" : "Draft"}
                                            </span>
                                        </button>
                                    </td>
                                    <td className="text-center">
                                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1 justify-center">
                                            <MdRemoveRedEye size={13} className="text-gray-400" />
                                            {viewCounts[doctrine.id!] ?? 0}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn-secondary py-1 px-2 text-xs" onClick={() => openEdit(doctrine)}>
                                                <MdEdit size={14} />
                                            </button>
                                            <button className="btn-danger py-1 px-2 text-xs" onClick={() => handleDelete(doctrine.id!)}>
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
                            <h2 className="text-base font-semibold">{editing ? "Edit Doctrine" : "New Doctrine"}</h2>
                            <button onClick={() => setShowModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

                            <div>
                                <label className="admin-label">Title</label>
                                <input
                                    className="admin-input"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g. The Nature of Salvation"
                                />
                            </div>

                            <div>
                                <label className="admin-label">Short Description</label>
                                <textarea
                                    className="admin-input"
                                    rows={2}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Brief excerpt shown on listing cards"
                                />
                            </div>

                            <ImageUpload
                                value={form.imgSrc}
                                onChange={(url) => setForm({ ...form, imgSrc: url })}
                                label="Cover Image"
                            />

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="admin-label">Date</label>
                                    <input
                                        className="admin-input"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        placeholder="e.g. February 25, 2024"
                                    />
                                </div>
                                <div>
                                    <label className="admin-label">Reading Time</label>
                                    <input
                                        className="admin-input"
                                        value={form.readingTime}
                                        onChange={(e) => setForm({ ...form, readingTime: e.target.value })}
                                        placeholder="e.g. 5 min read"
                                    />
                                </div>
                                <div>
                                    <label className="admin-label">Display Order</label>
                                    <input
                                        className="admin-input"
                                        type="number"
                                        min={0}
                                        value={form.order}
                                        onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                                        placeholder="0"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Lower = shown first (0, 1, 2…)</p>
                                </div>
                            </div>

                            <div>
                                <label className="admin-label">Full Content</label>
                                <WysiwygEditor
                                    content={form.content}
                                    onChange={(html) => setForm({ ...form, content: html })}
                                    placeholder="Write the full doctrine content here…"
                                />
                            </div>

                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.published}
                                        onChange={(e) => setForm({ ...form, published: e.target.checked })}
                                    />
                                    Published
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.featured}
                                        onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                                    />
                                    Featured (show as hero)
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving…" : "Save Doctrine"}
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
