// app/admin/contact/page.tsx
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


import Link from "next/link";
import {
    FaTrash, FaEdit, FaPlus, FaSave, FaTimes,
} from "react-icons/fa";
import { db } from "@/lib/firebase";

/* ───────────────────────── TYPES ───────────────────────── */
type Tab = "hero" | "cards" | "info" | "contactdetails";

type FieldDef = {
    name: string;
    label: string;
    type: "text" | "textarea" | "select";
    required?: boolean;
    options?: string[];
};

/* ──────────────────────── CONFIG ───────────────────────── */
const tabLabels: Record<Tab, string> = {
    hero: "Hero Section",
    cards: "Contact Cards",
    info: "Info Column",
    contactdetails: "Site Details",
};

const collectionNames: Record<Tab, string> = {
    hero: "contactHero",
    cards: "contactCards",
    info: "contactInfo",
    contactdetails: "contactDetails",
};

const ICON_OPTIONS = [
    "chat",
    "prayer",
    "users",
    "location",
    "phone",
    "email",
];

const fieldConfigs: Record<Tab, FieldDef[]> = {
    hero: [
        { name: "heading", label: "Heading", type: "text", required: true },
        { name: "subtext", label: "Subtext", type: "textarea" },
    ],
    cards: [
        { name: "title", label: "Card Title", type: "text", required: true },
        { name: "description", label: "Description", type: "textarea", required: true },
        { name: "icon", label: "Icon", type: "select", options: ICON_OPTIONS, required: true },
        { name: "ctaLabel", label: "Link Label (e.g. campus@dclm-au.org)", type: "text" },
        { name: "ctaHref", label: "Link Href (e.g. mailto:campus@dclm-au.org)", type: "text" },
    ],
    info: [
        { name: "title", label: 'Column Title (e.g. "Send us a message")', type: "text", required: true },
        { name: "subtitle", label: 'Subtitle (e.g. "Get in touch")', type: "text" },
        { name: "description", label: "Description", type: "textarea", required: true },
    ],
    contactdetails: [
        { name: "address", label: "Address", type: "text" },
        { name: "phone", label: "Phone", type: "text" },
        { name: "emailLabel", label: "Email Display Label", type: "text" },
        { name: "emailHref", label: "Email mailto Link", type: "text" },
    ],
};

/* ──────────────────────── PAGE ─────────────────────────── */
export default function ContactAdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>("hero");

    const [data, setData] = useState<Record<Tab, any[]>>({
        hero: [], cards: [], info: [], contactdetails: [],
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
            const newData: any = { ...data };
            const snap = await getDocs(collection(db, collectionNames.cards));
            newData.cards = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
                .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
            setData(newData);

            const newSingle: any = { ...singleContent };
            const singleTabs: Tab[] = ["hero", "info", "contactdetails"];
            for (const tab of singleTabs) {
                const s = await getDocs(collection(db, collectionNames[tab]));
                if (!s.empty) {
                    newSingle[tab] = { id: s.docs[0].id, ...s.docs[0].data() };
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
            await fetchAll();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading...</div>;

    const isSingle =
        activeTab === "hero" || activeTab === "info" || activeTab === "contactdetails";
    const items = data[activeTab];

    return (
        <div className="min-h-screen bg-white text-black">
            {/* HEADER */}
            <header className="border-b-2 border-black/10 px-6 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Contact Page Admin</h1>
                    <p className="text-xs text-gray-600 mt-0.5">Manage the Contact page content</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin"
                        className="px-4 py-2 border border-black/10 text-sm font-medium hover:bg-black hover:text-white transition-colors"
                    >
                        ← Landing
                    </Link>
                    <Link
                        href="/admin/about"
                        className="px-4 py-2 border border-black/10 text-sm font-medium hover:bg-black hover:text-white transition-colors"
                    >
                        About
                    </Link>
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
                                items.map((item) => (
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
        <div className="flex items-center gap-4 p-4 border-b border-black/10 last:border-b-0 hover:bg-gray-50">
            <div className="flex-1 min-w-0">
                {tab === "cards" && (
                    <div>
                        <p className="font-medium">
                            {item.title}
                            <span className="text-xs text-gray-400 ml-2">[{item.icon}]</span>
                        </p>
                        <p className="text-sm text-gray-500 truncate">{item.description}</p>
                        {item.ctaLabel && (
                            <p className="text-xs text-primary mt-1 truncate">
                                → {item.ctaLabel} ({item.ctaHref})
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <button onClick={onEdit} className="p-2 border border-black/10 hover:bg-black hover:text-white" title="Edit">
                    <FaEdit size={14} />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 border border-black/10 hover:bg-red-600 hover:text-white hover:border-red-600"
                    title="Delete"
                >
                    <FaTrash size={14} />
                </button>
            </div>
        </div>
    );
}

/* ──────────────────────── EDITOR MODAL ─────────────────── */
function EditorModal({ tab, item, isAdding, onSave, onClose, uploading, setUploading }: {
    tab: Tab;            // ← add this (replace `any` or omit)
    item: any;
    isAdding: boolean;
    onSave: (item: any) => void;
    onClose: () => void;
    uploading: boolean;
    setUploading: (uploading: boolean) => void;
}) {
    const [formData, setFormData] = useState<any>(item || {});
    const fields = (fieldConfigs as Record<string, FieldDef[]>)[tab];


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white border border-black/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                                    className="w-full px-3 py-2 border border-black/10 focus:outline-none focus:border-black"
                                    required={f.required}
                                />
                            )}

                            {f.type === "textarea" && (
                                <textarea
                                    rows={3}
                                    value={formData[f.name] ?? ""}
                                    onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                                    className="w-full px-3 py-2 border border-black/10 focus:outline-none focus:border-black"
                                    required={f.required}
                                />
                            )}

                            {f.type === "select" && (
                                <select
                                    value={formData[f.name] ?? ""}
                                    onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                                    className="w-full px-3 py-2 border border-black/10 focus:outline-none focus:border-black bg-white"
                                    required={f.required}
                                >
                                    <option value="">— select —</option>
                                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                                </select>
                            )}
                        </div>
                    ))}

                    <div className="flex items-center gap-3 pt-4 border-t border-black/10">
                        <button
                            type="submit"
                            disabled={uploading}
                            className="flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                        >
                            <FaSave size={12} /> {uploading ? "Saving..." : "Save"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 border border-black/10 text-sm font-medium hover:bg-gray-100"
                        >
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
    const fields = (fieldConfigs as Record<string, FieldDef[]>)[tab];


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
                            className="w-full px-3 py-2 border border-black/10 focus:outline-none focus:border-black"
                        />
                    )}
                    {f.type === "textarea" && (
                        <textarea
                            rows={3}
                            value={formData[f.name] ?? ""}
                            onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                            className="w-full px-3 py-2 border border-black/10 focus:outline-none focus:border-black"
                        />
                    )}
                </div>
            ))}

            <button
                type="submit"
                disabled={uploading}
                className="flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
                <FaSave size={12} /> {uploading ? "Saving..." : "Save Changes"}
            </button>
        </form>
    );
}
