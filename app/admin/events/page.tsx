"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    getEvents, createEvent, updateEvent, deleteEvent,
    Event, EventScheduleItem, EventSpeaker,
} from "@/lib/firestore";
import ImageUpload from "@/components/ImageUpload";
import WysiwygEditor from "@/components/WysiwygEditor";
import { MdAdd, MdEdit, MdDelete, MdClose, MdEvent, MdLink } from "react-icons/md";

const emptyEvent: Omit<Event, "id"> = {
    title: "", subtitle: "", theme: "", tagline: "", type: "Conference",
    biblePassage: "", bibleText: "",
    startDate: "", endDate: "", schedule: [],
    venueName: "", venueAddress: "", venueCity: "", venueMapUrl: "",
    speakers: [], featuring: "", targetAudience: "",
    posterImage: "", bannerImage: "", galleryImages: [],
    description: "", highlights: [],
    registrationUrl: "", registrationLabel: "Register Here",
    contactPhone: "", contactEmail: "", websiteUrl: "",
    published: false, featured: false, status: "upcoming",
};

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Event | null>(null);
    const [form, setForm] = useState<Omit<Event, "id">>(emptyEvent);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        const data = await getEvents();
        setEvents([...data].reverse());
        setLoading(false);
    }
    useEffect(() => { load(); }, []);

    function openNew() { setEditing(null); setForm(emptyEvent); setError(""); setShowModal(true); }
    function openEdit(e: Event) {
        setEditing(e);
        setForm({
            title: e.title, subtitle: e.subtitle, theme: e.theme, tagline: e.tagline, type: e.type,
            biblePassage: e.biblePassage, bibleText: e.bibleText,
            startDate: e.startDate, endDate: e.endDate, schedule: e.schedule ?? [],
            venueName: e.venueName, venueAddress: e.venueAddress, venueCity: e.venueCity, venueMapUrl: e.venueMapUrl ?? "",
            speakers: e.speakers ?? [], featuring: e.featuring ?? "", targetAudience: e.targetAudience ?? "",
            posterImage: e.posterImage ?? "", bannerImage: e.bannerImage ?? "", galleryImages: e.galleryImages ?? [],
            description: e.description ?? "", highlights: e.highlights ?? [],
            registrationUrl: e.registrationUrl ?? "", registrationLabel: e.registrationLabel ?? "Register Here",
            contactPhone: e.contactPhone ?? "", contactEmail: e.contactEmail ?? "", websiteUrl: e.websiteUrl ?? "",
            published: e.published, featured: e.featured ?? false, status: e.status ?? "upcoming",
        });
        setError(""); setShowModal(true);
    }

    async function handleSave() {
        if (!form.title.trim()) { setError("Title is required."); return; }
        if (!form.startDate.trim()) { setError("Start date is required."); return; }
        setSaving(true); setError("");
        try {
            if (editing?.id) await updateEvent(editing.id, form);
            else await createEvent(form);
            setShowModal(false); await load();
        } catch (e) { setError(e instanceof Error ? e.message : "Failed."); }
        finally { setSaving(false); }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this event?")) return;
        await deleteEvent(id); await load();
    }

    async function togglePublished(e: Event) {
        if (!e.id) return;
        await updateEvent(e.id, { published: !e.published }); await load();
    }

    // Schedule helpers
    function addSchedule() {
        setForm((p) => ({ ...p, schedule: [...p.schedule, { day: "", time: "", description: "" }] }));
    }
    function updateSchedule(i: number, field: keyof EventScheduleItem, val: string) {
        setForm((p) => ({ ...p, schedule: p.schedule.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }));
    }
    function removeSchedule(i: number) {
        setForm((p) => ({ ...p, schedule: p.schedule.filter((_, idx) => idx !== i) }));
    }

    // Speaker helpers
    function addSpeaker() {
        setForm((p) => ({ ...p, speakers: [...p.speakers, { name: "", title: "", image: "" }] }));
    }
    function updateSpeaker(i: number, field: keyof EventSpeaker, val: string) {
        setForm((p) => ({ ...p, speakers: p.speakers.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }));
    }
    function removeSpeaker(i: number) {
        setForm((p) => ({ ...p, speakers: p.speakers.filter((_, idx) => idx !== i) }));
    }

    // Highlights helpers
    function addHighlight() {
        setForm((p) => ({ ...p, highlights: [...p.highlights, ""] }));
    }
    function updateHighlight(i: number, val: string) {
        setForm((p) => ({ ...p, highlights: p.highlights.map((h, idx) => idx === i ? val : h) }));
    }
    function removeHighlight(i: number) {
        setForm((p) => ({ ...p, highlights: p.highlights.filter((_, idx) => idx !== i) }));
    }

    // Gallery helpers
    function addGalleryImage(url: string) {
        if (!url) return;
        setForm((p) => ({ ...p, galleryImages: [...p.galleryImages, url] }));
    }
    function removeGalleryImage(i: number) {
        setForm((p) => ({ ...p, galleryImages: p.galleryImages.filter((_, idx) => idx !== i) }));
    }

    const statusBadge = (status: Event["status"]) => {
        const map = { upcoming: "badge-blue", ongoing: "badge-green", past: "badge-gray" };
        return map[status] ?? "badge-gray";
    };

    return (
        <div className="w-full space-y-4">
            <div className="section-header">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Events</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Manage upcoming events shown on the website</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openNew}>
                    <MdAdd size={16} /> New Event
                </button>
            </div>

            {loading ? <div className="admin-card text-sm text-gray-500">Loading…</div>
                : events.length === 0 ? <div className="admin-card text-sm text-gray-500 text-center py-8">No events yet.</div>
                    : (
                        <div className="admin-card p-0 overflow-hidden overflow-x-auto">
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Poster</th><th>Title</th><th>Dates</th><th>Venue</th><th>Status</th><th>Published</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {events.map((e) => (
                                        <tr key={e.id}>
                                            <td>
                                                {e.posterImage
                                                    ? <Image src={e.posterImage} alt="" width={48} height={64} className="w-12 h-16 object-cover" />
                                                    : <div className="w-12 h-16 bg-gray-100 flex items-center justify-center"><MdEvent size={20} className="text-gray-400" /></div>
                                                }
                                            </td>
                                            <td>
                                                <p className="font-semibold text-gray-800 max-w-xs truncate">{e.title}</p>
                                                <p className="text-xs text-gray-400 truncate">{e.subtitle}</p>
                                            </td>
                                            <td className="text-xs text-gray-500 whitespace-nowrap">
                                                <p>{e.startDate}</p>
                                                {e.endDate && e.endDate !== e.startDate && <p>to {e.endDate}</p>}
                                            </td>
                                            <td className="text-xs text-gray-500 max-w-35 truncate">{e.venueCity || e.venueName}</td>
                                            <td><span className={`badge ${statusBadge(e.status)}`}>{e.status}</span></td>
                                            <td>
                                                <button onClick={() => togglePublished(e)}>
                                                    <span className={`badge ${e.published ? "badge-green" : "badge-yellow"}`}>
                                                        {e.published ? "Live" : "Draft"}
                                                    </span>
                                                </button>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button className="btn-secondary py-1 px-2 text-xs" onClick={() => openEdit(e)}><MdEdit size={14} /></button>
                                                    <button className="btn-danger py-1 px-2 text-xs" onClick={() => handleDelete(e.id!)}><MdDelete size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

            {/* ── MODAL ── */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ maxWidth: 820 }}>
                        <div className="modal-header">
                            <h2 className="text-base font-semibold">{editing ? "Edit Event" : "New Event"}</h2>
                            <button onClick={() => setShowModal(false)}><MdClose size={20} /></button>
                        </div>
                        <div className="p-5 space-y-6 overflow-y-auto max-h-[80vh]">
                            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

                            {/* ── IDENTITY ── */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-1">Event Identity</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="admin-label">Title *</label>
                                        <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Winning in Warfares" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="admin-label">Subtitle</label>
                                        <input className="admin-input" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="e.g. A Prophetic & Deliverance Conference" />
                                    </div>
                                    <div>
                                        <label className="admin-label">Event Type</label>
                                        <select className="admin-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                            {["Conference", "Youth Camp", "Seminar", "Retreat", "Workshop", "Service", "Other"].map((t) => (
                                                <option key={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="admin-label">Status</label>
                                        <select className="admin-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Event["status"] })}>
                                            <option value="upcoming">Upcoming</option>
                                            <option value="ongoing">Ongoing</option>
                                            <option value="past">Past</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="admin-label">Theme</label>
                                        <input className="admin-input" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} placeholder="e.g. Walk in Victory!" />
                                    </div>
                                    <div>
                                        <label className="admin-label">Tagline</label>
                                        <input className="admin-input" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="e.g. You Shall Win This Warfare!" />
                                    </div>
                                    <div>
                                        <label className="admin-label">Target Audience</label>
                                        <input className="admin-input" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} placeholder="e.g. Year 7–12, Youth and Campus" />
                                    </div>
                                    <div>
                                        <label className="admin-label">Featuring</label>
                                        <input className="admin-input" value={form.featuring} onChange={(e) => setForm({ ...form, featuring: e.target.value })} placeholder="e.g. Deeper Life Choir & Vibrant Worship" />
                                    </div>
                                </div>
                            </section>

                            {/* ── SCRIPTURE ── */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-1">Scripture / Bible Theme</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="admin-label">Bible Passage Reference</label>
                                        <input className="admin-input" value={form.biblePassage} onChange={(e) => setForm({ ...form, biblePassage: e.target.value })} placeholder="e.g. Philippians 2:15-16 (KJV)" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="admin-label">Bible Text</label>
                                        <textarea className="admin-input" rows={3} value={form.bibleText} onChange={(e) => setForm({ ...form, bibleText: e.target.value })} placeholder="Full scripture text…" />
                                    </div>
                                </div>
                            </section>

                            {/* ── DATES ── */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-1">Date & Schedule</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="admin-label">Start Date *</label>
                                        <input className="admin-input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} placeholder="e.g. July 2, 2026" />
                                    </div>
                                    <div>
                                        <label className="admin-label">End Date</label>
                                        <input className="admin-input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} placeholder="e.g. July 5, 2026" />
                                    </div>
                                </div>
                                {/* Schedule items */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="admin-label mb-0">Daily Schedule</label>
                                        <button type="button" className="btn-secondary py-1 px-2 text-xs flex items-center gap-1" onClick={addSchedule}><MdAdd size={13} /> Add Day</button>
                                    </div>
                                    {form.schedule.length === 0 ? (
                                        <p className="text-xs text-gray-400 border border-dashed border-gray-200 py-3 text-center">No schedule yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {form.schedule.map((s, i) => (
                                                <div key={i} className="grid grid-cols-7 gap-2 items-center">
                                                    <input className="admin-input col-span-2" placeholder="Day (e.g. Thursday)" value={s.day} onChange={(e) => updateSchedule(i, "day", e.target.value)} />
                                                    <input className="admin-input col-span-2" placeholder="Time (e.g. 5:00 PM)" value={s.time} onChange={(e) => updateSchedule(i, "time", e.target.value)} />
                                                    <input className="admin-input col-span-2" placeholder="Details (optional)" value={s.description} onChange={(e) => updateSchedule(i, "description", e.target.value)} />
                                                    <button type="button" onClick={() => removeSchedule(i)} className="text-gray-400 hover:text-red-500"><MdClose size={15} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* ── VENUE ── */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-1">Venue</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="admin-label">Venue Name</label>
                                        <input className="admin-input" value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} placeholder="e.g. Deeper Life Bible Church Auditorium" />
                                    </div>
                                    <div>
                                        <label className="admin-label">Street Address</label>
                                        <input className="admin-input" value={form.venueAddress} onChange={(e) => setForm({ ...form, venueAddress: e.target.value })} placeholder="e.g. 49-51 Cameron Street" />
                                    </div>
                                    <div>
                                        <label className="admin-label">City / State</label>
                                        <input className="admin-input" value={form.venueCity} onChange={(e) => setForm({ ...form, venueCity: e.target.value })} placeholder="e.g. Cranbourne, VIC" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="admin-label">Google Maps URL <span className="text-gray-400 font-normal">(optional)</span></label>
                                        <input className="admin-input" value={form.venueMapUrl} onChange={(e) => setForm({ ...form, venueMapUrl: e.target.value })} placeholder="https://maps.google.com/..." />
                                    </div>
                                </div>
                            </section>

                            {/* ── SPEAKERS ── */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-1">Speakers / Ministers</h3>
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs text-gray-500">Add ministers or guest speakers for this event.</p>
                                    <button type="button" className="btn-secondary py-1 px-2 text-xs flex items-center gap-1" onClick={addSpeaker}><MdAdd size={13} /> Add Speaker</button>
                                </div>
                                {form.speakers.length === 0 ? (
                                    <p className="text-xs text-gray-400 border border-dashed border-gray-200 py-3 text-center">No speakers yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {form.speakers.map((sp, i) => (
                                            <div key={i} className="border border-gray-200 p-3 bg-gray-50 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-gray-600">Speaker {i + 1}</span>
                                                    <button type="button" onClick={() => removeSpeaker(i)} className="text-gray-400 hover:text-red-500"><MdClose size={15} /></button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input className="admin-input" placeholder="Name" value={sp.name} onChange={(e) => updateSpeaker(i, "name", e.target.value)} />
                                                    <input className="admin-input" placeholder="Title / Role" value={sp.title} onChange={(e) => updateSpeaker(i, "title", e.target.value)} />
                                                </div>
                                                <ImageUpload value={sp.image} onChange={(url) => updateSpeaker(i, "image", url)} label="Speaker Photo" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* ── MEDIA ── */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-1">Images</h3>
                                <ImageUpload value={form.posterImage} onChange={(url) => setForm({ ...form, posterImage: url })} label="Event Poster (portrait)" />
                                <ImageUpload value={form.bannerImage} onChange={(url) => setForm({ ...form, bannerImage: url })} label="Banner / Hero Image (landscape)" />
                                {/* Gallery */}
                                <div>
                                    <label className="admin-label">Gallery Images</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {form.galleryImages.map((img, i) => (
                                            <div key={i} className="relative">
                                                <Image src={img} alt="" width={80} height={60} className="w-20 h-14 object-cover border border-gray-200" />
                                                <button type="button" onClick={() => removeGalleryImage(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">×</button>
                                            </div>
                                        ))}
                                    </div>
                                    <ImageUpload value="" onChange={(url) => { if (url) addGalleryImage(url); }} label="Add Gallery Image" />
                                </div>
                            </section>

                            {/* ── DESCRIPTION ── */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-1">Description & Highlights</h3>
                                <div>
                                    <label className="admin-label">Event Description</label>
                                    <WysiwygEditor content={form.description} onChange={(html) => setForm({ ...form, description: html })} placeholder="Describe the event in detail…" />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="admin-label mb-0">Highlights / Pillars</label>
                                        <button type="button" className="btn-secondary py-1 px-2 text-xs flex items-center gap-1" onClick={addHighlight}><MdAdd size={13} /> Add</button>
                                    </div>
                                    {form.highlights.length === 0 ? (
                                        <p className="text-xs text-gray-400 border border-dashed border-gray-200 py-3 text-center">e.g. Worship · Word · Warfare · Winners</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {form.highlights.map((h, i) => (
                                                <div key={i} className="flex items-center gap-1 border border-gray-200 px-2 py-1">
                                                    <input className="text-sm border-none outline-none bg-transparent w-28" value={h} onChange={(e) => updateHighlight(i, e.target.value)} placeholder="e.g. Worship" />
                                                    <button type="button" onClick={() => removeHighlight(i)} className="text-gray-400 hover:text-red-500"><MdClose size={13} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* ── REGISTRATION & CONTACT ── */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-1">Registration & Contact</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="admin-label flex items-center gap-1"><MdLink size={13} /> Registration URL</label>
                                        <input className="admin-input" value={form.registrationUrl} onChange={(e) => setForm({ ...form, registrationUrl: e.target.value })} placeholder="https://..." />
                                    </div>
                                    <div>
                                        <label className="admin-label">Registration Button Label</label>
                                        <input className="admin-input" value={form.registrationLabel} onChange={(e) => setForm({ ...form, registrationLabel: e.target.value })} placeholder="Register Here" />
                                    </div>
                                    <div>
                                        <label className="admin-label">Contact Phone</label>
                                        <input className="admin-input" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+61 4..." />
                                    </div>
                                    <div>
                                        <label className="admin-label">Contact Email</label>
                                        <input className="admin-input" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="info@dclm-au.org" />
                                    </div>
                                    <div>
                                        <label className="admin-label">Website URL</label>
                                        <input className="admin-input" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://dclm-au.org" />
                                    </div>
                                </div>
                            </section>

                            {/* ── VISIBILITY ── */}
                            <section className="flex gap-6 pt-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published (visible on website)
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured (highlight on homepage)
                                </label>
                            </section>

                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Event"}</button>
                                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
