// app/admin/about/page.tsx
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

import Link from "next/link";
import {
    FaTrash, FaEdit, FaPlus, FaSave, FaTimes, FaImage,
} from "react-icons/fa";
import { db, storage } from "@/lib/firebase";

/* ───────────────────────── TYPES ───────────────────────── */
type Tab =
    | "hero"
    | "intro"
    | "stats"
    | "missionvision"
    | "howwework"
    | "processsteps"
    | "values";

type FieldDef = {
    name: string;
    label: string;
    type: "text" | "textarea" | "image";
    required?: boolean;
};

/* ──────────────────────── CONFIG ───────────────────────── */
const tabLabels: Record<Tab, string> = {
    hero: "Hero Section",
    intro: "Intro Statement",
    stats: "Stats Cards",
    missionvision: "Mission & Vision",
    howwework: "How We Work",
    processsteps: "Process Steps",
    values: "Core Values",
};

const collectionNames: Record<Tab, string> = {
    hero: "aboutHero",
    intro: "aboutIntro",
    stats: "aboutStats",
    missionvision: "aboutMissionVision",
    howwework: "aboutHowWeWork",
    processsteps: "aboutProcessSteps",
    values: "aboutValues",
};

const fieldConfigs: Record<Tab, FieldDef[]> = {
    hero: [
        { name: "tag", label: "Tag (small text above heading)", type: "text", required: true },
        { name: "heading", label: "Main Heading", type: "textarea", required: true },
        { name: "image", label: "Hero Image", type: "image" },
    ],
    intro: [
        { name: "heading", label: "Centered Statement", type: "textarea", required: true },
    ],
    stats: [
        { name: "value", label: "Big Value (e.g. Win, AU)", type: "text", required: true },
        { name: "label", label: "Card Label", type: "text", required: true },
        { name: "description", label: "Description", type: "textarea", required: true },
    ],
    missionvision: [
        { name: "missionTitle", label: "Mission Title", type: "text", required: true },
        { name: "missionText", label: "Mission Text", type: "textarea", required: true },
        { name: "visionTitle", label: "Vision Title", type: "text", required: true },
        { name: "visionText", label: "Vision Text", type: "textarea", required: true },
    ],
    howwework: [
        { name: "heading", label: "Section Heading", type: "text", required: true },
        { name: "description", label: "Section Description", type: "textarea", required: true },
        { name: "image", label: "Side Image", type: "image" },
    ],
    processsteps: [
        { name: "id", label: 'Step Number (e.g. "01")', type: "text", required: true },
        { name: "label", label: "Step Label", type: "text", required: true },
        { name: "description", label: "Step Description", type: "textarea", required: true },
    ],
    values: [
        { name: "label", label: "Value Name (e.g. Excellence)", type: "text", required: true },
        { name: "description", label: "Description", type: "textarea", required: true },
        { name: "image", label: "Background Image", type: "image" },
    ],
};

/* ──────────────────────── PAGE ─────────────────────────── */
export default function AboutAdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>("hero");

    const [data, setData] = useState<Record<Tab, any[]>>({
        hero: [], intro: [], stats: [], missionvision: [],
        howwework: [], processsteps: [], values: [],
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
            const listTabs: Tab[] = ["stats", "processsteps", "values"];
            const newData: any = { ...data };
            for (const tab of listTabs) {
                const snap = await getDocs(collection(db, collectionNames[tab]));
                newData[tab] = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
                    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
            }
            setData(newData);

            const singleTabs: Tab[] = ["hero", "intro", "missionvision", "howwework"];
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

    const isSingle =
        activeTab === "hero" ||
        activeTab === "intro" ||
        activeTab === "missionvision" ||
        activeTab === "howwework";
    const items = data[activeTab];

    return (
        <div className="min-h-screen bg-white text-black">
            {/* HEADER */}
            <header className="border-b-2 border-black/10 px-6 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">About Us Admin</h1>
                    <p className="text-xs text-gray-600 mt-0.5">Manage every section of the About page</p>
                </div>
                <Link
                    href="/admin"
                    className="px-4 py-2 border border-black/10 text-sm font-medium hover:bg-black hover:text-white transition-colors"
                >
                    ← Landing Page
                </Link>
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
                {tab === "stats" && (
                    <div>
                        <p className="text-blue-500 text-sm font-bold">{item.value}</p>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-500 truncate">{item.description}</p>
                    </div>
                )}
                {tab === "processsteps" && (
                    <div className="flex items-start gap-3">
                        <span className="shrink-0 w-10 h-10 bg-black text-white flex items-center justify-center text-sm font-bold">
                            {item.id}
                        </span>
                        <div className="min-w-0">
                            <p className="font-medium">{item.label}</p>
                            <p className="text-sm text-gray-500 truncate">{item.description}</p>
                        </div>
                    </div>
                )}
                {tab === "values" && (
                    <div className="flex items-center gap-3">
                        {item.image && (
                            <img src={item.image} className="w-16 h-12 object-cover border border-black/10" alt="" />
                        )}
                        <div className="min-w-0">
                            <p className="font-medium">{item.label}</p>
                            <p className="text-sm text-gray-500 truncate">{item.description}</p>
                        </div>
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
    tab: Tab;
    item: any;
    isAdding: boolean;
    onSave: (item: any) => Promise<void>;
    onClose: () => void;
    uploading: boolean;
    setUploading: (v: boolean) => void;
}) {
    const [formData, setFormData] = useState<any>(item || {});
    const fields = (fieldConfigs as Record<string, FieldDef[]>)[tab];


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

                            {f.type === "image" && (
                                <div>
                                    {formData[f.name] && (
                                        <img src={formData[f.name]} className="w-full h-40 object-cover border border-black/10 mb-2" alt="" />
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

                    <div className="flex items-center gap-3 pt-4 border-t border-black/10">
                        <button
                            type="submit"
                            disabled={uploading}
                            className="flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                        >
                            <FaSave size={12} /> {uploading ? "Uploading..." : "Save"}
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
function SingleContentForm({ tab, data, onSave, uploading }: {
    tab: Tab;
    data: any;
    onSave: (data: any) => Promise<void>;
    uploading: boolean;
}) {
    const [formData, setFormData] = useState<any>(data);
    useEffect(() => setFormData(data), [data]);
    const fields = (fieldConfigs as Record<string, FieldDef[]>)[tab];


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
                    {f.type === "image" && (
                        <div>
                            {formData[f.name] && (
                                <img src={formData[f.name]} className="w-full h-40 object-cover border border-black/10 mb-2" alt="" />
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
