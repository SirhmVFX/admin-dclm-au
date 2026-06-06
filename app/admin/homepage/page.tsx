// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";


import {
    FaTrash, FaEdit, FaPlus, FaSave, FaTimes, FaImage,
} from "react-icons/fa";
import { db, storage } from "@/lib/firebase";

/* ───────────────────────── TYPES ───────────────────────── */
type Tab =
    | "whoweare"
    | "whatweoffer"
    | "services"
    | "benefits"
    | "achievements"



type Service = { id: string; title: string; description: string; icon: string; order: number };
type Benefit = { id: string; numId: string; title: string; description: string; order: number };

type Achievement = { id: string; title: string; description: string; order: number };

/* ──────────────────────── CONFIG ───────────────────────── */
const tabLabels: Record<Tab, string> = {

    whoweare: "Who We Are",
    whatweoffer: "What We Offer",

    services: "Services",
    benefits: "Benefits",
    achievements: "Achievements",

};

const collectionNames: Record<Tab, string> = {

    whoweare: "whoWeAre",
    whatweoffer: "whatWeOffer",

    services: "services",
    benefits: "benefits",
    achievements: "achievements",

};

const ICON_OPTIONS = ["FaHome", "FaBuilding", "FaBook", "FaUsers", "FaPrayingHands", "FaCross", "FaChurch"];

type FieldDef = { name: string; label: string; type: "text" | "textarea" | "image" | "select"; options?: string[]; required?: boolean };

const fieldConfigs: Record<Tab, FieldDef[]> = {

    whoweare: [
        { name: "tag", label: "Tag (small text above heading)", type: "text" },
        { name: "heading", label: "Main Heading", type: "textarea" },
        { name: "description", label: "Description (blue box)", type: "textarea" },
        { name: "image", label: "Image", type: "image" },
    ],
    whatweoffer: [
        { name: "tag", label: "Tag (small text above heading)", type: "text" },
        { name: "heading", label: "Main Heading", type: "text" },
    ],

    services: [
        { name: "title", label: "Title", type: "text", required: true },
        { name: "icon", label: "Icon", type: "select", options: ICON_OPTIONS, required: true },
        { name: "description", label: "Description", type: "textarea", required: true },
    ],
    benefits: [
        { name: "numId", label: 'Number ID (e.g. "01")', type: "text" },
        { name: "title", label: "Title", type: "text", required: true },
        { name: "description", label: "Description", type: "textarea", required: true },
    ],
    achievements: [
        { name: "title", label: "Title", type: "text", required: true },
        { name: "description", label: "Description", type: "textarea", required: true },
    ],

};

/* ──────────────────────── PAGE ─────────────────────────── */
export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>("whoweare");

    const [data, setData] = useState<Record<Tab, any[]>>({
        whoweare: [], whatweoffer: [],
        services: [], benefits: [], achievements: [],
    });
    const [singleContent, setSingleContent] = useState<Record<string, any>>({});

    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const listTabs: Tab[] = ["services", "benefits", "achievements",];
            const newData: any = { ...data };
            for (const tab of listTabs) {
                const snap = await getDocs(collection(db, collectionNames[tab]));
                newData[tab] = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
                    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
            }
            setData(newData);

            const singleTabs: Tab[] = ["whoweare", "whatweoffer"];
            const newSingle: any = { ...singleContent };
            for (const tab of singleTabs) {
                const snap = await getDocs(collection(db, collectionNames[tab]));
                if (!snap.empty) {
                    newSingle[tab] = { id: snap.docs[0].id, ...snap.docs[0].data() };
                } else {
                    newSingle[tab] = {};
                }
            }
            setSingleContent(newSingle);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveList = async (item: any) => {
        try {
            setUploading(true);
            const colName = collectionNames[activeTab];

            if (isAdding) {
                const order = data[activeTab].length;
                const { id, ...rest } = item;
                await addDoc(collection(db, colName), { ...rest, order, createdAt: serverTimestamp() });
            } else if (editingItem?.id) {
                const { id, ...rest } = item;
                await updateDoc(doc(db, colName, editingItem.id), rest);
            }

            await fetchAll();
            setEditingItem(null);
            setIsAdding(false);
        } catch (err) {
            console.error(err);
            alert("Failed to save");
        } finally {
            setUploading(false);
        }
    };

    const handleSaveSingle = async (item: any) => {
        try {
            setUploading(true);
            const colName = collectionNames[activeTab];
            const current = singleContent[activeTab];

            if (current?.id) {
                const { id, ...rest } = item;
                await updateDoc(doc(db, colName, current.id), rest);
            } else {
                await addDoc(collection(db, colName), item);
            }
            await fetchAll();
        } catch (err) {
            console.error(err);
            alert("Failed to save");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (item: any) => {
        if (!confirm("Delete this item?")) return;
        try {
            await deleteDoc(doc(db, collectionNames[activeTab], item.id));
            // Best-effort cleanup of uploaded images
            for (const key of ["src", "image"]) {
                if (item[key]?.includes("firebasestorage")) {
                    try { await deleteObject(ref(storage, item[key])); } catch { }
                }
            }
            await fetchAll();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading...</div>;

    const isSingle = activeTab === "whoweare" || activeTab === "whatweoffer";
    const items = data[activeTab];

    return (
        <div className="min-h-screen bg-white text-black">
            {/* HEADER */}
            <header className="border-b-2 border-black/10 px-6 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Landing Page Admin</h1>
                    <p className="text-xs text-gray-600 mt-0.5">Manage every section of your homepage</p>
                </div>
            </header>

            {/* TABS */}
            <nav className="border-b border-black/10 overflow-x-auto">
                <div className="flex">
                    {(Object.keys(tabLabels) as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setEditingItem(null); setIsAdding(false); }}
                            className={`px-5 py-3 text-sm font-medium border-r border-black/10 whitespace-nowrap transition-colors ${activeTab === tab ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
                                }`}
                        >
                            {tabLabels[tab]}
                        </button>
                    ))}
                </div>
            </nav>

            {/* MAIN */}
            <main className="p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-semibold">{tabLabels[activeTab]}</h2>
                        {!isSingle && (
                            <button
                                onClick={() => { setIsAdding(true); setEditingItem({}); }}
                                className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800"
                            >
                                <FaPlus size={12} /> Add New
                            </button>
                        )}
                    </div>

                    {/* LIST VIEW */}
                    {!isSingle && (
                        <div className="border border-black/10">
                            {items.length === 0 ? (
                                <div className="p-10 text-center text-gray-500 text-sm">
                                    No items yet. Click "Add New" to create one.
                                </div>
                            ) : (
                                items.map((item, i) => (
                                    <ItemRow
                                        key={item.id}
                                        item={item}
                                        tab={activeTab}
                                        onEdit={() => { setEditingItem(item); setIsAdding(false); }}
                                        onDelete={() => handleDelete(item)}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {/* SINGLE CONTENT */}
                    {isSingle && (
                        <SingleContentForm
                            tab={activeTab}
                            data={singleContent[activeTab] || {}}
                            onSave={handleSaveSingle}
                            uploading={uploading}
                        />
                    )}
                </div>
            </main>

            {/* EDITOR MODAL */}
            {(editingItem || isAdding) && !isSingle && (
                <EditorModal
                    tab={activeTab}
                    item={editingItem}
                    isAdding={isAdding}
                    onSave={handleSaveList}
                    onClose={() => { setEditingItem(null); setIsAdding(false); }}
                    uploading={uploading}
                    setUploading={setUploading}
                />
            )}
        </div>
    );
}

/* ──────────────────────── ITEM ROW ─────────────────────── */
function ItemRow({ item, tab, onEdit, onDelete }: any) {
    return (
        <div className="flex items-center gap-4 p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
            <div className="flex-1 min-w-0">
                {tab === "hero" && (
                    <div className="flex items-center gap-3">
                        {item.src && <img src={item.src} className="w-20 h-12 object-cover border border-gray-300" alt="" />}
                        <div className="min-w-0">
                            <p className="font-medium truncate">{item.heading}</p>
                            <p className="text-sm text-gray-500 truncate">{item.sub}</p>
                        </div>
                    </div>
                )}
                {tab === "stats" && (
                    <div>
                        <p className="font-bold text-lg">{item.value}</p>
                        <p className="text-sm text-gray-500">{item.label}</p>
                    </div>
                )}
                {tab === "services" && (
                    <div>
                        <p className="font-medium">{item.title} <span className="text-xs text-gray-400 ml-2">[{item.icon}]</span></p>
                        <p className="text-sm text-gray-500 truncate">{item.description}</p>
                    </div>
                )}
                {tab === "benefits" && (
                    <div>
                        <p className="font-medium"><span className="text-gray-400 mr-2">{item.numId}</span>{item.title}</p>
                        <p className="text-sm text-gray-500 truncate">{item.description}</p>
                    </div>
                )}
                {tab === "achievements" && (
                    <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-500 truncate">{item.description}</p>
                    </div>
                )}
                {tab === "testimonials" && (
                    <div className="flex items-center gap-3">
                        {item.image && <img src={item.image} className="w-10 h-10 object-cover border border-gray-300" alt="" />}
                        <div className="min-w-0">
                            <p className="font-medium truncate">{item.name} <span className="text-gray-400 text-sm font-normal">— {item.role}</span></p>
                            <p className="text-sm text-gray-500 truncate">{item.feedback}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <button onClick={onEdit} className="p-2 border border-black/10 hover:bg-black hover:text-white" title="Edit">
                    <FaEdit size={14} />
                </button>
                <button onClick={onDelete} className="p-2 border border-black/10 hover:bg-red-600 hover:text-white hover:border-red-600" title="Delete">
                    <FaTrash size={14} />
                </button>
            </div>
        </div>
    );
}

/* ──────────────────────── EDITOR MODAL ─────────────────── */
function EditorModal({ tab, item, isAdding, onSave, onClose, uploading, setUploading }: any) {
    const [formData, setFormData] = useState<any>(item || {});
    const fields = fieldConfigs[tab];

    const handleImage = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const r = ref(storage, `${collectionNames[tab]}/${Date.now()}_${file.name}`);
            await uploadBytes(r, file);
            const url = await getDownloadURL(r);
            setFormData((p: any) => ({ ...p, [fieldName]: url }));
        } catch {
            alert("Image upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white border-2 border-black/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-black/10">
                    <h3 className="text-lg font-semibold">
                        {isAdding ? "Add" : "Edit"} {tabLabels[tab].replace(/s$/, "")}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100"><FaTimes size={18} /></button>
                </div>

                <form
                    onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
                    className="p-6 space-y-4"
                >
                    {fields.map((f) => (
                        <div key={f.name}>
                            <label className="block text-sm font-medium mb-2">
                                {f.label} {f.required && <span className="text-red-600">*</span>}
                            </label>

                            {f.type === "text" && (
                                <input
                                    type="text"
                                    value={formData[f.name] ?? ""}
                                    onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                                    className="w-full px-3 py-2 border border-black/10 focus:outline-none focus:ring-1 focus:ring-black"
                                    required={f.required}
                                />
                            )}

                            {f.type === "textarea" && (
                                <textarea
                                    rows={3}
                                    value={formData[f.name] ?? ""}
                                    onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                                    className="w-full px-3 py-2 border border-black/10 focus:outline-none focus:ring-1 focus:ring-black"
                                    required={f.required}
                                />
                            )}

                            {f.type === "select" && (
                                <select
                                    value={formData[f.name] ?? ""}
                                    onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                                    className="w-full px-3 py-2 border border-black/10 focus:outline-none focus:ring-1 focus:ring-black bg-white"
                                    required={f.required}
                                >
                                    <option value="">— select —</option>
                                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                                </select>
                            )}

                            {f.type === "image" && (
                                <div>
                                    {formData[f.name] && (
                                        <img src={formData[f.name]} className="w-full h-40 object-cover border border-gray-300 mb-2" alt="" />
                                    )}
                                    <label className="flex items-center gap-2 px-4 py-2 border border-black/10 cursor-pointer hover:bg-gray-100 w-fit">
                                        <FaImage size={14} />
                                        <span className="text-sm">Choose Image</span>
                                        <input type="file" accept="image/*" onChange={(e) => handleImage(e, f.name)} className="hidden" />
                                    </label>
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={uploading}
                            className="flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                        >
                            <FaSave size={12} /> {uploading ? "Uploading..." : "Save"}
                        </button>
                        <button type="button" onClick={onClose} className="px-5 py-2 border border-black/10 text-sm font-medium hover:bg-gray-100">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ──────────────────── SINGLE CONTENT FORM ──────────────── */
function SingleContentForm({ tab, data, onSave, uploading }: any) {
    const [formData, setFormData] = useState<any>(data);
    useEffect(() => setFormData(data), [data]);
    const fields = fieldConfigs[tab];

    const handleImage = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const r = ref(storage, `${collectionNames[tab]}/${Date.now()}_${file.name}`);
        await uploadBytes(r, file);
        const url = await getDownloadURL(r);
        setFormData((p: any) => ({ ...p, [fieldName]: url }));
    };

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
            className="border border-black/10 p-6 space-y-4 max-w-2xl"
        >
            {fields.map((f) => (
                <div key={f.name}>
                    <label className="block text-sm font-medium mb-2">{f.label}</label>
                    {f.type === "text" && (
                        <input
                            type="text"
                            value={formData[f.name] ?? ""}
                            onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                            className="w-full px-3 py-2 border border-black/10 focus:outline-none focus:ring-1 focus:ring-black"
                        />
                    )}
                    {f.type === "textarea" && (
                        <textarea
                            rows={3}
                            value={formData[f.name] ?? ""}
                            onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                            className="w-full px-3 py-2 border border-black/10 focus:outline-none focus:ring-1 focus:ring-black"
                        />
                    )}
                    {f.type === "image" && (
                        <div>
                            {formData[f.name] && <img src={formData[f.name]} className="w-full h-40 object-cover border border-gray-300 mb-2" alt="" />}
                            <label className="flex items-center gap-2 px-4 py-2 border border-black/10 cursor-pointer hover:bg-gray-100 w-fit">
                                <FaImage size={14} />
                                <span className="text-sm">Choose Image</span>
                                <input type="file" accept="image/*" onChange={(e) => handleImage(e, f.name)} className="hidden" />
                            </label>
                        </div>
                    )}
                </div>
            ))}

            <button
                type="submit"
                disabled={uploading}
                className="flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
                <FaSave size={12} /> {uploading ? "Uploading..." : "Save Changes"}
            </button>
        </form>
    );
}
