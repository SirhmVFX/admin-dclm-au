"use client";

import { useEffect, useState, useMemo } from "react";
import { getPageViews, PageView, getItemViewCounts, ItemViewCount } from "@/lib/firestore";
import { MdTrendingUp, MdPeople, MdArticle, MdMenuBook, MdAutoStories, MdHome, MdRefresh, MdRemoveRedEye, MdBarChart } from "react-icons/md";

const SECTION_LABELS: Record<string, string> = {
    home: "Home",
    articles: "Articles",
    teachings: "Teachings",
    snippets: "Bible Snippets",
    "bible-doctrine": "Bible Doctrine",
    "daily-manna": "Daily Manna",
    events: "Events",
    about: "About Us",
    contact: "Contact",
    other: "Other",
};

const SECTION_COLORS: Record<string, string> = {
    home: "#16a34a",
    articles: "#2563eb",
    teachings: "#7c3aed",
    snippets: "#db2777",
    "bible-doctrine": "#d97706",
    "daily-manna": "#059669",
    events: "#dc2626",
    about: "#0891b2",
    contact: "#64748b",
    other: "#94a3b8",
};

const ITEM_TYPE_LABELS: Record<string, string> = {
    article: "Article",
    teaching: "Teaching",
    snippet: "Bible Snippet",
    doctrine: "Bible Doctrine",
    event: "Event",
};

const ITEM_TYPE_COLORS: Record<string, string> = {
    article: "#2563eb",
    teaching: "#7c3aed",
    snippet: "#db2777",
    doctrine: "#d97706",
    event: "#dc2626",
};

const DAY_OPTIONS = [7, 14, 30, 90];
const TABS = ["page-views", "content-views"] as const;
type Tab = typeof TABS[number];

function formatDate(ts: any): string {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatShortDate(date: Date): string {
    return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

interface DayStat { date: string; count: number }
interface SectionStat { section: string; count: number; pct: number }
interface PageStat { path: string; title: string; count: number }

export default function AnalyticsPage() {
    const [views, setViews] = useState<PageView[]>([]);
    const [itemViews, setItemViews] = useState<ItemViewCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [itemLoading, setItemLoading] = useState(true);
    const [days, setDays] = useState(30);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("page-views");
    const [activeItemType, setActiveItemType] = useState<string>("all");

    const load = async () => {
        setLoading(true);
        try {
            const data = await getPageViews(days);
            setViews(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadItemViews = async () => {
        setItemLoading(true);
        try {
            const data = await getItemViewCounts();
            setItemViews(data);
        } catch (e) {
            console.error(e);
        } finally {
            setItemLoading(false);
        }
    };

    useEffect(() => { load(); }, [days]);
    useEffect(() => { loadItemViews(); }, []);

    // ── Aggregations ──────────────────────────────────────────────────────

    const totalViews = views.length;
    const uniqueSessions = useMemo(() => new Set(views.map(v => v.sessionId)).size, [views]);

    // Views per day (last N days)
    const dailyStats: DayStat[] = useMemo(() => {
        const map: Record<string, number> = {};
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            map[formatShortDate(d)] = 0;
        }
        views.forEach(v => {
            const d = v.timestamp?.toDate ? v.timestamp.toDate() : new Date();
            const key = formatShortDate(d);
            if (key in map) map[key]++;
        });
        return Object.entries(map).map(([date, count]) => ({ date, count }));
    }, [views, days]);

    const maxDaily = Math.max(...dailyStats.map(d => d.count), 1);

    // Views by section
    const sectionStats: SectionStat[] = useMemo(() => {
        const map: Record<string, number> = {};
        views.forEach(v => { map[v.section || "other"] = (map[v.section || "other"] || 0) + 1; });
        const total = Object.values(map).reduce((s, n) => s + n, 0) || 1;
        return Object.entries(map)
            .map(([section, count]) => ({ section, count, pct: Math.round(count / total * 100) }))
            .sort((a, b) => b.count - a.count);
    }, [views]);

    // Top pages
    const pageStats: PageStat[] = useMemo(() => {
        const filtered = activeSection ? views.filter(v => v.section === activeSection) : views;
        const map: Record<string, { title: string; count: number }> = {};
        filtered.forEach(v => {
            if (!map[v.path]) map[v.path] = { title: v.title || v.path, count: 0 };
            map[v.path].count++;
        });
        return Object.entries(map)
            .map(([path, { title, count }]) => ({ path, title, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);
    }, [views, activeSection]);

    // Top referrers
    const referrerStats = useMemo(() => {
        const map: Record<string, number> = {};
        views.forEach(v => {
            const ref = v.referrer || "direct";
            let key = ref;
            if (ref !== "direct") {
                try { key = new URL(ref).hostname.replace("www.", ""); } catch { key = ref; }
            }
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map)
            .map(([referrer, count]) => ({ referrer, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [views]);

    // Recent visits
    const recentViews = views.slice(0, 25);

    // ── Item view aggregations ──────────────────────────────────────────────

    const filteredItemViews = useMemo(() => {
        if (activeItemType === "all") return itemViews;
        return itemViews.filter(v => v.itemType === activeItemType);
    }, [itemViews, activeItemType]);

    const totalItemViews = useMemo(() => itemViews.reduce((s, v) => s + v.count, 0), [itemViews]);

    const itemTypeSummary = useMemo(() => {
        const map: Record<string, number> = {};
        itemViews.forEach(v => { map[v.itemType] = (map[v.itemType] || 0) + v.count; });
        return Object.entries(map)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count);
    }, [itemViews]);

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <MdTrendingUp size={22} className="text-blue-600" />
                        Site Analytics
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Page views tracked across the DCLM AU website
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Day range selector */}
                    <div className="flex border border-gray-200 overflow-hidden">
                        {DAY_OPTIONS.map(d => (
                            <button
                                key={d}
                                onClick={() => setDays(d)}
                                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${days === d ? "bg-blue-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                            >
                                {d}d
                            </button>
                        ))}
                    </div>
                    <button onClick={load} disabled={loading} className="btn-secondary flex items-center gap-1.5 py-1.5 text-xs">
                        <MdRefresh size={14} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── TAB NAV ── */}
            <div className="flex border-b border-gray-200 gap-1">
                <button
                    onClick={() => setActiveTab("page-views")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === "page-views" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                    <MdTrendingUp size={16} />
                    Page Views
                </button>
                <button
                    onClick={() => setActiveTab("content-views")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === "content-views" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                    <MdRemoveRedEye size={16} />
                    Content Views
                    {totalItemViews > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold">
                            {totalItemViews.toLocaleString()}
                        </span>
                    )}
                </button>
            </div>

            {/* ── PAGE VIEWS TAB ── */}
            {activeTab === "page-views" && (
                <>
                    {loading ? (
                        <div className="admin-card text-sm text-gray-500 text-center py-16">Loading analytics…</div>
                    ) : (
                        <>
                            {/* ── KPI CARDS ── */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { label: "Total Views", value: totalViews.toLocaleString(), icon: MdTrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
                                    { label: "Unique Sessions", value: uniqueSessions.toLocaleString(), icon: MdPeople, color: "text-green-700", bg: "bg-green-50" },
                                    { label: "Avg/Day", value: Math.round(totalViews / Math.max(days, 1)).toLocaleString(), icon: MdArticle, color: "text-purple-700", bg: "bg-purple-50" },
                                    { label: "Sections", value: sectionStats.length, icon: MdHome, color: "text-orange-600", bg: "bg-orange-50" },
                                ].map(card => (
                                    <div key={card.label} className="stat-card">
                                        <div className={`inline-flex p-2 mb-3 ${card.bg} ${card.color}`}>
                                            <card.icon size={18} />
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                                        <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* ── DAILY CHART ── */}
                            <div className="admin-card">
                                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                    Daily Views — last {days} days
                                </h2>
                                <div className="flex items-end gap-1 h-36 overflow-x-auto pb-2">
                                    {dailyStats.map(({ date, count }) => (
                                        <div key={date} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: days <= 14 ? 32 : 18 }}>
                                            <span className="text-[9px] text-gray-400 font-medium">{count || ""}</span>
                                            <div
                                                className="w-full bg-blue-600 rounded-sm transition-all"
                                                style={{ height: `${Math.round((count / maxDaily) * 100)}px`, minHeight: count > 0 ? 2 : 0 }}
                                                title={`${date}: ${count} views`}
                                            />
                                            {days <= 30 && (
                                                <span className="text-[8px] text-gray-400 rotate-45 origin-left">{date.split(" ")[0]}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* ── SECTION BREAKDOWN ── */}
                                <div className="admin-card">
                                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                        Traffic by Section
                                        {activeSection && (
                                            <button onClick={() => setActiveSection(null)} className="ml-2 text-xs text-blue-600 font-normal normal-case hover:underline">
                                                clear filter
                                            </button>
                                        )}
                                    </h2>
                                    <div className="space-y-3">
                                        {sectionStats.map(({ section, count, pct }) => {
                                            const color = SECTION_COLORS[section] ?? "#94a3b8";
                                            const isActive = activeSection === section;
                                            return (
                                                <button
                                                    key={section}
                                                    onClick={() => setActiveSection(isActive ? null : section)}
                                                    className={`w-full text-left transition-opacity ${activeSection && !isActive ? "opacity-40" : ""}`}
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {SECTION_LABELS[section] ?? section}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {count.toLocaleString()} <span className="text-xs text-gray-400">({pct}%)</span>
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all"
                                                            style={{ width: `${pct}%`, background: color }}
                                                        />
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        {sectionStats.length === 0 && (
                                            <p className="text-sm text-gray-400">No data for this period.</p>
                                        )}
                                    </div>
                                </div>

                                {/* ── TOP PAGES ── */}
                                <div className="admin-card">
                                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                        Top Pages
                                        {activeSection && (
                                            <span className="ml-1 text-xs text-blue-600 font-normal normal-case">
                                                ({SECTION_LABELS[activeSection] ?? activeSection} only)
                                            </span>
                                        )}
                                    </h2>
                                    {pageStats.length === 0 ? (
                                        <p className="text-sm text-gray-400">No data for this period.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="admin-table">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Page</th>
                                                        <th>Views</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pageStats.map(({ path, title, count }, i) => (
                                                        <tr key={path}>
                                                            <td className="text-gray-400 text-xs">{i + 1}</td>
                                                            <td>
                                                                <div className="font-medium text-gray-800 text-sm truncate max-w-[220px]" title={title}>
                                                                    {title && title !== path ? title : path}
                                                                </div>
                                                                <div className="text-xs text-gray-400 truncate max-w-[220px]">{path}</div>
                                                            </td>
                                                            <td className="font-semibold text-gray-900">{count.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* ── REFERRERS ── */}
                                <div className="admin-card">
                                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                        Top Traffic Sources
                                    </h2>
                                    {referrerStats.length === 0 ? (
                                        <p className="text-sm text-gray-400">No referrer data yet.</p>
                                    ) : (
                                        <table className="admin-table">
                                            <thead><tr><th>Source</th><th>Visits</th></tr></thead>
                                            <tbody>
                                                {referrerStats.map(({ referrer, count }) => (
                                                    <tr key={referrer}>
                                                        <td>
                                                            <span className={`text-sm font-medium ${referrer === "direct" ? "text-gray-500 italic" : "text-gray-800"}`}>
                                                                {referrer === "direct" ? "Direct / Unknown" : referrer}
                                                            </span>
                                                        </td>
                                                        <td className="font-semibold text-gray-900">{count.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* ── RECENT VISITS ── */}
                                <div className="admin-card">
                                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                        Recent Visits
                                    </h2>
                                    {recentViews.length === 0 ? (
                                        <p className="text-sm text-gray-400">No recent visits.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="admin-table">
                                                <thead><tr><th>Time</th><th>Page</th><th>Section</th></tr></thead>
                                                <tbody>
                                                    {recentViews.map(v => (
                                                        <tr key={v.id}>
                                                            <td className="text-xs text-gray-400 whitespace-nowrap">
                                                                {formatDate(v.timestamp)}
                                                            </td>
                                                            <td className="text-xs text-gray-700 max-w-[160px] truncate" title={v.path}>
                                                                {v.path}
                                                            </td>
                                                            <td>
                                                                <span
                                                                    className="badge text-[10px] px-1.5 py-0.5"
                                                                    style={{
                                                                        background: (SECTION_COLORS[v.section] ?? "#94a3b8") + "22",
                                                                        color: SECTION_COLORS[v.section] ?? "#64748b",
                                                                    }}
                                                                >
                                                                    {SECTION_LABELS[v.section] ?? v.section}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── CONTENT PERFORMANCE ── */}
                            <div className="admin-card">
                                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                    Content Performance
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    {[
                                        { section: "articles", label: "Articles", icon: MdArticle },
                                        { section: "teachings", label: "Teachings", icon: MdMenuBook },
                                        { section: "snippets", label: "Snippets", icon: MdAutoStories },
                                        { section: "bible-doctrine", label: "Bible Doctrine", icon: MdMenuBook },
                                        { section: "daily-manna", label: "Daily Manna", icon: MdAutoStories },
                                    ].map(({ section, label, icon: Icon }) => {
                                        const stat = sectionStats.find(s => s.section === section);
                                        const count = stat?.count ?? 0;
                                        const color = SECTION_COLORS[section];
                                        return (
                                            <button
                                                key={section}
                                                onClick={() => setActiveSection(activeSection === section ? null : section)}
                                                className={`p-4 border transition-all text-left ${activeSection === section ? "border-current shadow-sm" : "border-gray-200 hover:border-gray-400"}`}
                                                style={activeSection === section ? { borderColor: color, background: color + "0d" } : {}}
                                            >
                                                <div style={{ color }} className="mb-2"><Icon size={20} /></div>
                                                <p className="text-2xl font-bold text-gray-900">{count.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                                                <p className="text-xs text-gray-400">views</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ── CONTENT VIEWS TAB ── */}
            {activeTab === "content-views" && (
                <>
                    {/* KPI */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="stat-card">
                            <div className="inline-flex p-2 mb-3 bg-blue-50 text-blue-600">
                                <MdRemoveRedEye size={18} />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{totalItemViews.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">Total Content Views</p>
                        </div>
                        <div className="stat-card">
                            <div className="inline-flex p-2 mb-3 bg-purple-50 text-purple-700">
                                <MdBarChart size={18} />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{itemViews.length.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">Unique Items Viewed</p>
                        </div>
                        {itemTypeSummary.slice(0, 2).map(({ type, count }) => (
                            <div key={type} className="stat-card">
                                <div className="inline-flex p-2 mb-3" style={{ background: (ITEM_TYPE_COLORS[type] ?? "#94a3b8") + "18", color: ITEM_TYPE_COLORS[type] ?? "#64748b" }}>
                                    <MdArticle size={18} />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{count.toLocaleString()}</p>
                                <p className="text-xs text-gray-500 mt-1">{ITEM_TYPE_LABELS[type] ?? type} Views</p>
                            </div>
                        ))}
                    </div>

                    {/* Type filter pills */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setActiveItemType("all")}
                            className={`px-3 py-1.5 text-xs font-semibold border transition-colors ${activeItemType === "all" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                        >
                            All Types
                        </button>
                        {itemTypeSummary.map(({ type, count }) => (
                            <button
                                key={type}
                                onClick={() => setActiveItemType(activeItemType === type ? "all" : type)}
                                className={`px-3 py-1.5 text-xs font-semibold border transition-colors ${activeItemType === type ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                                style={activeItemType === type ? { background: ITEM_TYPE_COLORS[type] ?? "#64748b", borderColor: ITEM_TYPE_COLORS[type] ?? "#64748b" } : {}}
                            >
                                {ITEM_TYPE_LABELS[type] ?? type}
                                <span className="ml-1.5 opacity-70">{count.toLocaleString()}</span>
                            </button>
                        ))}
                    </div>

                    {/* Top items table */}
                    <div className="admin-card p-0 overflow-hidden overflow-x-auto">
                        {itemLoading ? (
                            <div className="text-sm text-gray-500 text-center py-12">Loading content views…</div>
                        ) : filteredItemViews.length === 0 ? (
                            <div className="text-sm text-gray-400 text-center py-12">No content views recorded yet.</div>
                        ) : (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Content</th>
                                        <th>Type</th>
                                        <th>Views</th>
                                        <th>Share</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItemViews.map(({ itemId, itemType, itemTitle, count }, i) => {
                                        const color = ITEM_TYPE_COLORS[itemType] ?? "#94a3b8";
                                        const total = filteredItemViews.reduce((s, v) => s + v.count, 0) || 1;
                                        const pct = Math.round(count / total * 100);
                                        return (
                                            <tr key={itemId}>
                                                <td className="text-gray-400 text-xs w-8">{i + 1}</td>
                                                <td>
                                                    <div className="font-medium text-gray-800 text-sm truncate max-w-[260px]" title={itemTitle}>
                                                        {itemTitle || itemId}
                                                    </div>
                                                    <div className="text-xs text-gray-400 font-mono truncate max-w-[260px]">{itemId}</div>
                                                </td>
                                                <td>
                                                    <span
                                                        className="badge text-[10px] px-2 py-0.5 whitespace-nowrap"
                                                        style={{ background: color + "18", color }}
                                                    >
                                                        {ITEM_TYPE_LABELS[itemType] ?? itemType}
                                                    </span>
                                                </td>
                                                <td className="font-bold text-gray-900 text-sm">{count.toLocaleString()}</td>
                                                <td className="w-32">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-gray-100 overflow-hidden">
                                                            <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
                                                        </div>
                                                        <span className="text-xs text-gray-400 w-7 text-right">{pct}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Per-type breakdown cards */}
                    {itemTypeSummary.length > 0 && (
                        <div className="admin-card">
                            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                Views by Content Type
                            </h2>
                            <div className="space-y-3">
                                {itemTypeSummary.map(({ type, count }) => {
                                    const color = ITEM_TYPE_COLORS[type] ?? "#94a3b8";
                                    const pct = Math.round(count / (totalItemViews || 1) * 100);
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setActiveItemType(activeItemType === type ? "all" : type)}
                                            className={`w-full text-left transition-opacity ${activeItemType !== "all" && activeItemType !== type ? "opacity-40" : ""}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {ITEM_TYPE_LABELS[type] ?? type}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {count.toLocaleString()} <span className="text-xs text-gray-400">({pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={loadItemViews}
                            disabled={itemLoading}
                            className="btn-secondary flex items-center gap-1.5 py-1.5 text-xs"
                        >
                            <MdRefresh size={14} className={itemLoading ? "animate-spin" : ""} />
                            Refresh Content Views
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
