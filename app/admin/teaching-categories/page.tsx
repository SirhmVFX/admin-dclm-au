"use client";

import { useEffect, useState } from "react";
import {
    getTeachingCategories,
    createTeachingCategory,
    updateTeachingCategory,
    deleteTeachingCategory,
    getTeachingSubCategories,
    createTeachingSubCategory,
    updateTeachingSubCategory,
    deleteTeachingSubCategory,
    TeachingCategory,
    TeachingSubCategory,
} from "@/lib/firestore";
import { MdAdd, MdEdit, MdDelete, MdClose, MdExpandMore, MdExpandLess } from "react-icons/md";

function toSlug(name: string) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const emptyCategory: Omit<TeachingCategory, "id"> = { name: "", slug: "", description: "", order: 0, active: true };
const emptySub = (categoryId: string, order: number): Omit<TeachingSubCategory, "id"> => ({
    name: "", slug: "", categoryId, order, active: true,
});

export default function TeachingCategoriesPage() {
    const [categories, setCategories] = useState<TeachingCategory[]>([]);
    const [subCategories, setSubCategories] = useState<TeachingSubCategory[]>([]);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    // Category modal
    const [showCatModal, setShowCatModal] = useState(false);
    const [editingCat, setEditingCat] = useState<TeachingCategory | null>(null);
    const [catForm, setCatForm] = useState<Omit<TeachingCategory, "id">>(emptyCategory);
    const [catSaving, setCatSaving] = useState(false);
    const [catError, setCatError] = useState("");

    // Subcategory modal
    const [showSubModal, setShowSubModal] = useState(false);
    const [editingSub, setEditingSub] = useState<TeachingSubCategory | null>(null);
    const [subForm, setSubForm] = useState<Omit<TeachingSubCategory, "id">>(emptySub("", 0));
    const [subSaving, setSubSaving] = useState(false);
    const [subError, setSubError] = useState("");

    async function load() {
        setLoading(true);
        const [cats, subs] = await Promise.all([getTeachingCategories(), getTeachingSubCategories()]);
        setCategories(cats);
        setSubCategories(subs);
        setLoading(false);
    }
    useEffect(() => { load(); }, []);

    // ── Category actions ──────────────────────────────────
    function openNewCat() { setEditingCat(null); setCatForm({ ...emptyCategory, order: categories.length }); setCatError(""); setShowCatModal(true); }
    function openEditCat(cat: TeachingCategory) {
        setEditingCat(cat);
        setCatForm({ name: cat.name, slug: cat.slug, description: cat.description, order: cat.order, active: cat.active });
        setCatError(""); setShowCatModal(true);
    }
    async function handleSaveCat() {
        if (!catForm.name.trim()) { setCatError("Name is required."); return; }
        setCatSaving(true); setCatError("");
        try {
            if (editingCat?.id) await updateTeachingCategory(editingCat.id, catForm);
            else await createTeachingCategory(catForm);
            setShowCatModal(false); await load();
        } catch (e) { setCatError(e instanceof Error ? e.message : "Failed."); }
        finally { setCatSaving(false); }
    }
    async function handleDeleteCat(id: string) {
        const hasSubs = subCategories.some((s) => s.categoryId === id);
        if (hasSubs && !confirm("This category has subcategories. Delete it and all its subcategories?")) return;
        if (!hasSubs && !confirm("Delete this category?")) return;
        // Delete subcategories first
        await Promise.all(subCategories.filter((s) => s.categoryId === id).map((s) => deleteTeachingSubCategory(s.id!)));
        await deleteTeachingCategory(id);
        await load();
    }
    async function toggleCatActive(cat: TeachingCategory) {
        if (!cat.id) return;
        await updateTeachingCategory(cat.id, { active: !cat.active }); await load();
    }

    // ── Subcategory actions ───────────────────────────────
    function openNewSub(categoryId: string) {
        setEditingSub(null);
        const sibling = subCategories.filter((s) => s.categoryId === categoryId);
        setSubForm(emptySub(categoryId, sibling.length));
        setSubError(""); setShowSubModal(true);
    }
    function openEditSub(sub: TeachingSubCategory) {
        setEditingSub(sub);
        setSubForm({ name: sub.name, slug: sub.slug, categoryId: sub.categoryId, order: sub.order, active: sub.active });
        setSubError(""); setShowSubModal(true);
    }
    async function handleSaveSub() {
        if (!subForm.name.trim()) { setSubError("Name is required."); return; }
        setSubSaving(true); setSubError("");
        try {
            if (editingSub?.id) await updateTeachingSubCategory(editingSub.id, subForm);
            else await createTeachingSubCategory(subForm);
            setShowSubModal(false); await load();
        } catch (e) { setSubError(e instanceof Error ? e.message : "Failed."); }
        finally { setSubSaving(false); }
    }
    async function handleDeleteSub(id: string) {
        if (!confirm("Delete this subcategory?")) return;
        await deleteTeachingSubCategory(id); await load();
    }
    async function toggleSubActive(sub: TeachingSubCategory) {
        if (!sub.id) return;
        await updateTeachingSubCategory(sub.id, { active: !sub.active }); await load();
    }

    function toggleExpand(id: string) {
        setExpanded((p) => ({ ...p, [id]: !p[id] }));
    }

    return (
        <div className="max-w-3xl space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Teaching Categories</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Categories and subcategories for organising teachings</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openNewCat}><MdAdd size={16} /> New Category</button>
            </div>

            {loading ? <div className="admin-card text-sm text-gray-500">Loading…</div>
                : categories.length === 0 ? <div className="admin-card text-sm text-gray-500 text-center py-8">No categories yet.</div>
                    : (
                        <div className="space-y-3">
                            {categories.map((cat) => {
                                const subs = subCategories.filter((s) => s.categoryId === cat.id);
                                const isOpen = expanded[cat.id!] !== false; // default open
                                return (
                                    <div key={cat.id} className="admin-card p-0 overflow-hidden">
                                        {/* Category row */}
                                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                                            <button onClick={() => toggleExpand(cat.id!)} className="text-gray-400 hover:text-gray-700">
                                                {isOpen ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-semibold text-gray-800 text-sm">{cat.name}</span>
                                                <span className="ml-2 text-xs text-gray-400 font-mono">{cat.slug}</span>
                                                <span className="ml-2 text-xs text-gray-400">{subs.length} subcategory{subs.length !== 1 ? "ies" : "y"}</span>
                                            </div>
                                            <button onClick={() => toggleCatActive(cat)}>
                                                <span className={`badge ${cat.active ? "badge-green" : "badge-yellow"}`}>{cat.active ? "Active" : "Hidden"}</span>
                                            </button>
                                            <button className="btn-secondary py-1 px-2 text-xs" onClick={() => openEditCat(cat)}><MdEdit size={14} /></button>
                                            <button className="btn-danger py-1 px-2 text-xs" onClick={() => handleDeleteCat(cat.id!)}><MdDelete size={14} /></button>
                                        </div>

                                        {/* Subcategories */}
                                        {isOpen && (
                                            <div>
                                                {subs.length === 0 ? (
                                                    <p className="text-xs text-gray-400 px-10 py-3">No subcategories yet.</p>
                                                ) : (
                                                    <table className="admin-table">
                                                        <thead><tr><th className="pl-10">Name</th><th>Slug</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
                                                        <tbody>
                                                            {subs.map((sub) => (
                                                                <tr key={sub.id}>
                                                                    <td className="pl-10 font-medium text-gray-700 text-sm">{sub.name}</td>
                                                                    <td className="text-gray-400 text-xs font-mono">{sub.slug}</td>
                                                                    <td className="text-gray-500 text-xs">{sub.order}</td>
                                                                    <td><button onClick={() => toggleSubActive(sub)}>
                                                                        <span className={`badge ${sub.active ? "badge-green" : "badge-yellow"}`}>{sub.active ? "Active" : "Hidden"}</span>
                                                                    </button></td>
                                                                    <td><div className="flex gap-2">
                                                                        <button className="btn-secondary py-1 px-2 text-xs" onClick={() => openEditSub(sub)}><MdEdit size={14} /></button>
                                                                        <button className="btn-danger py-1 px-2 text-xs" onClick={() => handleDeleteSub(sub.id!)}><MdDelete size={14} /></button>
                                                                    </div></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                                <div className="px-4 py-2 border-t border-gray-100">
                                                    <button className="btn-secondary text-xs flex items-center gap-1 py-1 px-3" onClick={() => openNewSub(cat.id!)}>
                                                        <MdAdd size={13} /> Add Subcategory to "{cat.name}"
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

            {/* Category Modal */}
            {showCatModal && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h2 className="text-base font-semibold">{editingCat ? "Edit Category" : "New Category"}</h2>
                            <button onClick={() => setShowCatModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {catError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{catError}</p>}
                            <div><label className="admin-label">Name</label>
                                <input className="admin-input" value={catForm.name}
                                    onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value, slug: editingCat ? p.slug : toSlug(e.target.value) }))}
                                    placeholder="e.g. Bible Review Series" /></div>
                            <div><label className="admin-label">Slug</label>
                                <input className="admin-input font-mono text-sm" value={catForm.slug}
                                    onChange={(e) => setCatForm({ ...catForm, slug: toSlug(e.target.value) })} /></div>
                            <div><label className="admin-label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                                <textarea className="admin-input" rows={2} value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} /></div>
                            <div><label className="admin-label">Display Order</label>
                                <input type="number" className="admin-input" value={catForm.order} onChange={(e) => setCatForm({ ...catForm, order: Number(e.target.value) })} min={0} /></div>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={catForm.active} onChange={(e) => setCatForm({ ...catForm, active: e.target.checked })} /> Active
                            </label>
                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" onClick={handleSaveCat} disabled={catSaving}>{catSaving ? "Saving…" : "Save Category"}</button>
                                <button className="btn-secondary" onClick={() => setShowCatModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Subcategory Modal */}
            {showSubModal && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ maxWidth: 480 }}>
                        <div className="modal-header">
                            <h2 className="text-base font-semibold">{editingSub ? "Edit Subcategory" : "New Subcategory"}</h2>
                            <button onClick={() => setShowSubModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {subError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{subError}</p>}
                            <div>
                                <label className="admin-label">Parent Category</label>
                                <p className="text-sm text-gray-700 font-medium">{categories.find((c) => c.id === subForm.categoryId)?.name ?? "—"}</p>
                            </div>
                            <div><label className="admin-label">Name</label>
                                <input className="admin-input" value={subForm.name}
                                    onChange={(e) => setSubForm((p) => ({ ...p, name: e.target.value, slug: editingSub ? p.slug : toSlug(e.target.value) }))}
                                    placeholder="e.g. 1st Thessalonians" /></div>
                            <div><label className="admin-label">Slug</label>
                                <input className="admin-input font-mono text-sm" value={subForm.slug}
                                    onChange={(e) => setSubForm({ ...subForm, slug: toSlug(e.target.value) })} /></div>
                            <div><label className="admin-label">Display Order</label>
                                <input type="number" className="admin-input" value={subForm.order} onChange={(e) => setSubForm({ ...subForm, order: Number(e.target.value) })} min={0} /></div>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={subForm.active} onChange={(e) => setSubForm({ ...subForm, active: e.target.checked })} /> Active
                            </label>
                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" onClick={handleSaveSub} disabled={subSaving}>{subSaving ? "Saving…" : "Save Subcategory"}</button>
                                <button className="btn-secondary" onClick={() => setShowSubModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
