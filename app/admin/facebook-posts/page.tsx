"use client";

import { useEffect, useState } from "react";
import {
    getFacebookPosts,
    createFacebookPost,
    updateFacebookPost,
    deleteFacebookPost,
    FacebookPost,
} from "@/lib/firestore";
import { MdAdd, MdEdit, MdDelete, MdClose, MdFacebook } from "react-icons/md";

/** Extract the numeric post ID from a Facebook post URL for iframe embed */
function getFacebookEmbedUrl(raw: string): string {
    const trimmed = raw.trim();
    // Encode the post URL for Facebook's embed endpoint
    try {
        const encoded = encodeURIComponent(trimmed);
        return `https://www.facebook.com/plugins/post.php?href=${encoded}&show_text=true&width=500`;
    } catch {
        return "";
    }
}

const empty: Omit<FacebookPost, "id"> = {
    url: "",
    caption: "",
    image: "",
    published: true,
    order: 0,
};

export default function FacebookPostsPage() {
    const [posts, setPosts] = useState<FacebookPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<FacebookPost | null>(null);
    const [form, setForm] = useState<Omit<FacebookPost, "id">>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        const data = await getFacebookPosts();
        setPosts(data);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    function openNew() {
        setEditing(null);
        setForm({ ...empty, order: posts.length });
        setError("");
        setShowModal(true);
    }

    function openEdit(post: FacebookPost) {
        setEditing(post);
        setForm({ url: post.url, caption: post.caption, image: post.image ?? "", published: post.published, order: post.order });
        setError("");
        setShowModal(true);
    }

    async function handleSave() {
        if (!form.url.trim()) { setError("Facebook post URL is required."); return; }
        if (!form.url.includes("facebook.com")) { setError("Please enter a valid Facebook post URL."); return; }
        setSaving(true); setError("");
        try {
            if (editing?.id) await updateFacebookPost(editing.id, form);
            else await createFacebookPost(form);
            setShowModal(false);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Remove this Facebook post?")) return;
        await deleteFacebookPost(id);
        await load();
    }

    async function togglePublished(post: FacebookPost) {
        if (!post.id) return;
        await updateFacebookPost(post.id, { published: !post.published });
        await load();
    }

    return (
        <div className="max-w-4xl space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Facebook Posts</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Manage Facebook posts displayed on the Bible Snippets page</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openNew}>
                    <MdAdd size={16} /> Add Post
                </button>
            </div>

            {/* How-to note */}
            <div className="admin-card bg-blue-50 border-blue-200 text-blue-800 text-xs space-y-1">
                <p className="font-semibold flex items-center gap-1"><MdFacebook size={14} /> How to get a Facebook post URL</p>
                <p>1. Go to the Facebook post on the DLCF Australia page.</p>
                <p>2. Click the post date/timestamp — it opens the post in its own page.</p>
                <p>3. Copy the URL from the browser address bar and paste it below.</p>
            </div>

            {loading ? (
                <div className="admin-card text-sm text-gray-500">Loading…</div>
            ) : posts.length === 0 ? (
                <div className="admin-card text-sm text-gray-500 text-center py-8">
                    No Facebook posts yet. Add one to display it on the website.
                </div>
            ) : (
                <div className="admin-card p-0 overflow-hidden overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>URL</th>
                                <th>Caption</th>
                                <th>Order</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((post) => (
                                <tr key={post.id}>
                                    <td className="text-xs text-gray-400 max-w-xs truncate font-mono">{post.url}</td>
                                    <td className="text-gray-600 text-xs max-w-[200px] truncate">{post.caption || <span className="text-gray-300">—</span>}</td>
                                    <td className="text-gray-500 text-xs">{post.order}</td>
                                    <td>
                                        <button onClick={() => togglePublished(post)}>
                                            <span className={`badge ${post.published ? "badge-green" : "badge-yellow"}`}>
                                                {post.published ? "Visible" : "Hidden"}
                                            </span>
                                        </button>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn-secondary py-1 px-2 text-xs" onClick={() => openEdit(post)}>
                                                <MdEdit size={14} />
                                            </button>
                                            <button className="btn-danger py-1 px-2 text-xs" onClick={() => handleDelete(post.id!)}>
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
                    <div className="modal-box" style={{ maxWidth: 560 }}>
                        <div className="modal-header">
                            <h2 className="text-base font-semibold flex items-center gap-2">
                                <MdFacebook size={18} className="text-blue-600" />
                                {editing ? "Edit Facebook Post" : "Add Facebook Post"}
                            </h2>
                            <button onClick={() => setShowModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
                            )}

                            <div>
                                <label className="admin-label">Facebook Post URL</label>
                                <input
                                    className="admin-input font-mono text-xs"
                                    value={form.url}
                                    onChange={(e) => setForm({ ...form, url: e.target.value.trim() })}
                                    placeholder="https://www.facebook.com/yourpage/posts/..."
                                />
                                <p className="text-xs text-gray-400 mt-1">Must be a public Facebook post URL.</p>
                            </div>

                            {/* Live embed preview */}
                            {form.url.includes("facebook.com") && (
                                <div>
                                    <label className="admin-label">Preview</label>
                                    <div className="border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center min-h-[200px]">
                                        <iframe
                                            src={getFacebookEmbedUrl(form.url)}
                                            width="500"
                                            height="280"
                                            style={{ border: "none", overflow: "hidden" }}
                                            scrolling="no"
                                            frameBorder="0"
                                            allowFullScreen
                                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                            title="Facebook post preview"
                                            className="max-w-full"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Preview may not load in admin due to Facebook's iframe policies — it will work correctly on the public website.</p>
                                </div>
                            )}

                            <div>
                                <label className="admin-label">Caption <span className="text-gray-400 font-normal">(optional)</span></label>
                                <input
                                    className="admin-input"
                                    value={form.caption}
                                    onChange={(e) => setForm({ ...form, caption: e.target.value })}
                                    placeholder="Short description shown below the post"
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
                                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first.</p>
                            </div>

                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.published}
                                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                                />
                                Visible on website
                            </label>

                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving…" : editing ? "Update Post" : "Add Post"}
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
