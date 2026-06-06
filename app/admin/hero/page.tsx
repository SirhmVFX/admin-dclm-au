"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    getHeroSlides,
    createHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
    HeroSlide,
} from "@/lib/firestore";
import ImageUpload from "@/components/ImageUpload";
import { MdAdd, MdEdit, MdDelete, MdClose } from "react-icons/md";

const empty: Omit<HeroSlide, "id"> = {
    src: "",
    heading: "",
    sub: "",
    order: 0,
    active: true,
};

export default function HeroPage() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<HeroSlide | null>(null);
    const [form, setForm] = useState<Omit<HeroSlide, "id">>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        const data = await getHeroSlides();
        setSlides(data);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    function openNew() {
        setEditing(null);
        setForm(empty);
        setError("");
        setShowModal(true);
    }

    function openEdit(slide: HeroSlide) {
        setEditing(slide);
        setForm({ src: slide.src, heading: slide.heading, sub: slide.sub, order: slide.order, active: slide.active });
        setError("");
        setShowModal(true);
    }

    async function handleSave() {
        if (!form.src || !form.heading) {
            setError("Image and heading are required.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            if (editing?.id) {
                await updateHeroSlide(editing.id, form);
            } else {
                await createHeroSlide(form);
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
        if (!confirm("Delete this hero slide?")) return;
        await deleteHeroSlide(id);
        await load();
    }

    async function toggleActive(slide: HeroSlide) {
        if (!slide.id) return;
        await updateHeroSlide(slide.id, { active: !slide.active });
        await load();
    }

    return (
        <div className=" space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Hero Slides</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Manage the homepage hero slideshow</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openNew}>
                    <MdAdd size={16} /> New Slide
                </button>
            </div>

            {loading ? (
                <div className="admin-card text-sm text-gray-500">Loading…</div>
            ) : slides.length === 0 ? (
                <div className="admin-card text-sm text-gray-500 text-center py-8">No slides yet. Add the first one.</div>
            ) : (
                <div className="admin-card p-0 overflow-hidden">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Preview</th>
                                <th>Heading</th>
                                <th>Sub Text</th>
                                <th>Order</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slides.map((slide) => (
                                <tr key={slide.id}>
                                    <td>
                                        {slide.src && (
                                            <Image src={slide.src} alt="" width={80} height={48} className="w-20 h-12 object-cover" />
                                        )}
                                    </td>
                                    <td className="font-medium text-gray-800 max-w-xs truncate">{slide.heading}</td>
                                    <td className="text-gray-500 max-w-xs truncate text-xs">{slide.sub}</td>
                                    <td>{slide.order}</td>
                                    <td>
                                        <button onClick={() => toggleActive(slide)}>
                                            <span className={`badge ${slide.active ? "badge-green" : "badge-gray"}`}>
                                                {slide.active ? "Active" : "Inactive"}
                                            </span>
                                        </button>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn-secondary py-1 px-2 text-xs" onClick={() => openEdit(slide)}>
                                                <MdEdit size={14} />
                                            </button>
                                            <button className="btn-danger py-1 px-2 text-xs" onClick={() => handleDelete(slide.id!)}>
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
                    <div className="modal-box">
                        <div className="modal-header">
                            <h2 className="text-base font-semibold">{editing ? "Edit Slide" : "New Slide"}</h2>
                            <button onClick={() => setShowModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

                            <ImageUpload value={form.src} onChange={(url) => setForm({ ...form, src: url })} label="Slide Image" />

                            <div>
                                <label className="admin-label">Heading</label>
                                <input className="admin-input" value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} placeholder="e.g. We're Saintly Intellectuals" />
                            </div>

                            <div>
                                <label className="admin-label">Sub Text</label>
                                <textarea className="admin-input" rows={3} value={form.sub} onChange={(e) => setForm({ ...form, sub: e.target.value })} placeholder="Short verse or tagline" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="admin-label">Order</label>
                                    <input type="number" className="admin-input" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label className="admin-label">Status</label>
                                    <select className="admin-input" value={form.active ? "active" : "inactive"} onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving…" : "Save Slide"}
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
