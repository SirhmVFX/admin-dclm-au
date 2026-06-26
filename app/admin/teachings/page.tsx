"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    getTeachings,
    createTeaching,
    updateTeaching,
    deleteTeaching,
    Teaching,
    YoutubeLink,
} from "@/lib/firestore";
import ImageUpload from "@/components/ImageUpload";
import WysiwygEditor from "@/components/WysiwygEditor";
import { MdAdd, MdEdit, MdDelete, MdClose, MdLink, MdVideoLibrary } from "react-icons/md";

const empty: Omit<Teaching, "id"> = {
    title: "",
    description: "",
    content: "",
    teacher: "DLCF Teaching Team",
    bibleVerse: "",
    date: new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" }),
    imgSrc: "",
    published: false,
    youtubeLinks: [],
};

function extractYoutubeId(raw: string): string | null {
    if (!raw?.trim()) return null;
    let url = raw.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    try {
        const u = new URL(url);
        const host = u.hostname.replace(/^www\./, "");
        if (host === "youtu.be") {
            const id = u.pathname.split("/").filter(Boolean)[0];
            return id || null;
        }
        if (host === "youtube.com" || host === "m.youtube.com") {
            const v = u.searchParams.get("v");
            if (v) return v;
            const parts = u.pathname.split("/").filter(Boolean);
            const idx = parts.findIndex((p) => ["embed", "shorts", "live", "v"].includes(p));
            if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
        }
    } catch { /* ignore */ }
    if (/^[A-Za-z0-9_-]{11}$/.test(raw.trim())) return raw.trim();
    return null;
}

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

    function openNew() {
        setEditing(null);
        setForm(empty);
        setError("");
        setShowModal(true);
    }

    function openEdit(t: Teaching) {
        setEditing(t);
        setForm({
            title: t.title,
            description: t.description,
            content: t.content,
            teacher: t.teacher,
            bibleVerse: t.bibleVerse,
            date: t.date,
            imgSrc: t.imgSrc,
            published: t.published,
            youtubeLinks: t.youtubeLinks ?? [],
        });
        setError("");
        setShowModal(true);
    }

    // ── YouTube link helpers ──────────────────────────────
    function addYoutubeLink() {
        setForm((prev) => ({
            ...prev,
            youtubeLinks: [...prev.youtubeLinks, { title: "", url: "" }],
        }));
    }

    function updateYoutubeLink(index: number, field: keyof YoutubeLink, value: string) {
        setForm((prev) => {
            const updated = prev.youtubeLinks.map((link, i) =>
                i === index ? { ...link, [field]: value } : link
            );
            return { ...prev, youtubeLinks: updated };
        });
    }

    function removeYoutubeLink(index: number) {
        setForm((prev) => ({
            ...prev,
            youtubeLinks: prev.youtubeLinks.filter((_, i) => i !== index),
        }));
    }

    async function handleSave() {
        if (!form.title) { setError("Title is required."); return; }
        // Validate YouTube links — each must have a URL
        const invalidLink = form.youtubeLinks.find((l) => !l.url.trim());
        if (invalidLink) { setError("All YouTube links must have a URL."); return; }
        setSaving(true);
        setError("");
        try {
            if (editing?.id) await updateTeaching(editing.id, form);
            else await createTeaching(form);
            setShowModal(false);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this teaching?")) return;
        await deleteTeaching(id);
        await load();
    }

    async function togglePublished(t: Teaching) {
        if (!t.id) return;
        await updateTeaching(t.id, { published: !t.published });
        await load();
    }

    return (
        <div className="max-w-5xl space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Teachings</h1>
                    <p className="text-xs text-gray-500 mt-0.5">In-depth Bible Review Series teachings with optional YouTube recordings</p>
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
                            <tr>
                                <th>Image</th>
                                <th>Title</th>
                                <th>Teacher</th>
                                <th>Verse</th>
                                <th>Date</th>
                                <th>Recordings</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((t) => (
                                <tr key={t.id}>
                                    <td>
                                        {t.imgSrc && (
                                            <Image src={t.imgSrc} alt="" width={64} height={40} className="w-16 h-10 object-cover" />
                                        )}
                                    </td>
                                    <td className="font-medium text-gray-800 max-w-[160px] truncate">{t.title}</td>
                                    <td className="text-gray-500 text-xs">{t.teacher}</td>
                                    <td className="text-gray-500 text-xs">{t.bibleVerse}</td>
                                    <td className="text-gray-500 text-xs whitespace-nowrap">{t.date}</td>
                                    <td>
                                        {(t.youtubeLinks?.length ?? 0) > 0 ? (
                                            <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                                                <MdVideoLibrary size={13} />
                                                {t.youtubeLinks.length}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300 text-xs">—</span>
                                        )}
                                    </td>
                                    <td>
                                        <button onClick={() => togglePublished(t)}>
                                            <span className={`badge ${t.published ? "badge-green" : "badge-yellow"}`}>
                                                {t.published ? "Published" : "Draft"}
                                            </span>
                                        </button>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn-secondary py-1 px-2" onClick={() => openEdit(t)}>
                                                <MdEdit size={14} />
                                            </button>
                                            <button className="btn-danger py-1 px-2" onClick={() => handleDelete(t.id!)}>
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

            {/* ── Modal ── */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ maxWidth: 780 }}>
                        <div className="modal-header">
                            <h2 className="text-base font-semibold">{editing ? "Edit Teaching" : "New Teaching"}</h2>
                            <button onClick={() => setShowModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
                            )}

                            <div>
                                <label className="admin-label">Title</label>
                                <input
                                    className="admin-input"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g. 1st Thessalonians"
                                />
                            </div>

                            <div>
                                <label className="admin-label">Short Description</label>
                                <textarea
                                    className="admin-input"
                                    rows={2}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>

                            <ImageUpload
                                value={form.imgSrc}
                                onChange={(url) => setForm({ ...form, imgSrc: url })}
                                label="Cover Image"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="admin-label">Teacher</label>
                                    <input
                                        className="admin-input"
                                        value={form.teacher}
                                        onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="admin-label">Bible Verse</label>
                                    <input
                                        className="admin-input"
                                        value={form.bibleVerse}
                                        onChange={(e) => setForm({ ...form, bibleVerse: e.target.value })}
                                        placeholder="e.g. 1 Thessalonians 5:23"
                                    />
                                </div>
                                <div>
                                    <label className="admin-label">Date</label>
                                    <input
                                        className="admin-input"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* ── YouTube Recordings ── */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="admin-label mb-0">YouTube Recordings</label>
                                    <button
                                        type="button"
                                        className="btn-secondary py-1 px-2 text-xs flex items-center gap-1"
                                        onClick={addYoutubeLink}
                                    >
                                        <MdAdd size={13} /> Add Link
                                    </button>
                                </div>

                                {form.youtubeLinks.length === 0 ? (
                                    <p className="text-xs text-gray-400 border border-dashed border-gray-200 py-4 text-center">
                                        No recordings yet — click "Add Link" to attach YouTube videos.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {form.youtubeLinks.map((link, i) => (
                                            <div key={i} className="border border-gray-200 p-3 space-y-2 bg-gray-50">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                                        <MdVideoLibrary size={13} className="text-red-500" />
                                                        Recording {i + 1}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeYoutubeLink(i)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Remove"
                                                    >
                                                        <MdClose size={15} />
                                                    </button>
                                                </div>
                                                <input
                                                    className="admin-input"
                                                    placeholder="Title (e.g. Session 1 — Introduction)"
                                                    value={link.title}
                                                    onChange={(e) => updateYoutubeLink(i, "title", e.target.value)}
                                                />
                                                <div className="flex items-center gap-2">
                                                    <MdLink size={14} className="text-gray-400 shrink-0" />
                                                    <input
                                                        className="admin-input"
                                                        placeholder="YouTube URL (e.g. https://youtu.be/...)"
                                                        value={link.url}
                                                        onChange={(e) => updateYoutubeLink(i, "url", e.target.value)}
                                                    />
                                                </div>
                                                {/* Live preview thumbnail */}
                                                {extractYoutubeId(link.url) && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Image
                                                            src={`https://img.youtube.com/vi/${extractYoutubeId(link.url)}/mqdefault.jpg`}
                                                            alt="thumbnail"
                                                            width={120}
                                                            height={68}
                                                            className="w-28 h-16 object-cover border border-gray-200"
                                                        />
                                                        <span className="text-xs text-green-600">✓ Valid YouTube link</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="admin-label">Full Teaching Content</label>
                                <WysiwygEditor
                                    content={form.content}
                                    onChange={(html) => setForm({ ...form, content: html })}
                                    placeholder="Write the full teaching here…"
                                />
                            </div>

                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.published}
                                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                                />
                                Published
                            </label>

                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving…" : "Save Teaching"}
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
