"use client";

import { useEffect, useState } from "react";
import {
    getContactMessages,
    markMessageRead,
    deleteContactMessage,
    ContactMessage,
} from "@/lib/firestore";
import { MdDelete, MdMarkEmailRead, MdClose } from "react-icons/md";

export default function MessagesPage() {
    const [items, setItems] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<ContactMessage | null>(null);

    async function load() {
        setLoading(true);
        const data = await getContactMessages();
        setItems([...data].reverse());
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function handleMarkRead(id: string) {
        await markMessageRead(id);
        await load();
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this message?")) return;
        await deleteContactMessage(id);
        setSelected(null);
        await load();
    }

    function formatDate(ts: ContactMessage["createdAt"]) {
        if (!ts) return "–";
        const d = ts.toDate ? ts.toDate() : new Date(ts as unknown as number);
        return d.toLocaleDateString("en-AU", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    const unread = items.filter((m) => !m.read).length;

    return (
        <div className="max-w-5xl space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Contact Messages</h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Messages from the contact form &nbsp;
                        {unread > 0 && <span className="badge badge-red">{unread} unread</span>}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="admin-card text-sm text-gray-500">Loading…</div>
            ) : items.length === 0 ? (
                <div className="admin-card text-sm text-gray-500 text-center py-8">No messages yet.</div>
            ) : (
                <div className="admin-card p-0 overflow-hidden overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Message</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {items.map((m) => (
                                <tr key={m.id} className={!m.read ? "bg-blue-50" : ""}>
                                    <td className="font-medium text-gray-800 whitespace-nowrap">
                                        {m.firstName} {m.lastName}
                                    </td>
                                    <td className="text-gray-600 text-xs">{m.email}</td>
                                    <td className="text-gray-600 text-xs">{m.phone || "–"}</td>
                                    <td>
                                        <button
                                            className="text-blue-700 text-xs hover:underline text-left max-w-[180px] truncate block"
                                            onClick={() => setSelected(m)}
                                        >
                                            {m.message}
                                        </button>
                                    </td>
                                    <td className="text-gray-500 text-xs whitespace-nowrap">{formatDate(m.createdAt)}</td>
                                    <td>
                                        <span className={`badge ${m.read ? "badge-gray" : "badge-blue"}`}>
                                            {m.read ? "Read" : "New"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            {!m.read && (
                                                <button className="btn-secondary py-1 px-2" title="Mark as read" onClick={() => handleMarkRead(m.id!)}>
                                                    <MdMarkEmailRead size={14} />
                                                </button>
                                            )}
                                            <button className="btn-danger py-1 px-2" onClick={() => handleDelete(m.id!)}>
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

            {/* Message detail modal */}
            {selected && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div className="modal-header">
                            <h2 className="text-base font-semibold">Message from {selected.firstName} {selected.lastName}</h2>
                            <button onClick={() => setSelected(null)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="admin-label inline">Email</span><p>{selected.email}</p></div>
                                <div><span className="admin-label inline">Phone</span><p>{selected.phone || "–"}</p></div>
                                <div><span className="admin-label inline">Date</span><p>{formatDate(selected.createdAt)}</p></div>
                                <div><span className="admin-label inline">Status</span>
                                    <p><span className={`badge ${selected.read ? "badge-gray" : "badge-blue"}`}>{selected.read ? "Read" : "New"}</span></p>
                                </div>
                            </div>
                            <div>
                                <span className="admin-label">Message</span>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap border border-gray-200 p-4 bg-gray-50">{selected.message}</p>
                            </div>
                            <div className="flex gap-3">
                                <a
                                    href={`mailto:${selected.email}`}
                                    className="btn-primary text-sm"
                                >
                                    Reply by Email
                                </a>
                                {!selected.read && (
                                    <button className="btn-secondary" onClick={() => { handleMarkRead(selected.id!); setSelected(null); }}>
                                        Mark as Read
                                    </button>
                                )}
                                <button className="btn-danger ml-auto" onClick={() => handleDelete(selected.id!)}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
