"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats } from "@/lib/firestore";
import { useAuth } from "@/lib/auth";
import {
    MdArticle,
    MdMenuBook,
    MdAutoStories,
    MdPeople,
    MdStar,
    MdEmail,
    MdArrowForward,
} from "react-icons/md";

interface Stats {
    articles: number;
    teachings: number;
    snippets: number;
    testimonials: number;
    leaders: number;
    unreadMessages: number;
}

const statCards = (s: Stats) => [
    { label: "Articles", value: s.articles, icon: MdArticle, href: "/admin/articles", color: "bg-blue-50 text-blue-700" },
    { label: "Teachings", value: s.teachings, icon: MdMenuBook, href: "/admin/teachings", color: "bg-indigo-50 text-indigo-700" },
    { label: "Snippets", value: s.snippets, icon: MdAutoStories, href: "/admin/snippets", color: "bg-purple-50 text-purple-700" },
    { label: "Leaders", value: s.leaders, icon: MdPeople, href: "/admin/leaders", color: "bg-green-50 text-green-700" },
    { label: "Testimonials", value: s.testimonials, icon: MdStar, href: "/admin/testimonials", color: "bg-yellow-50 text-yellow-700" },
    { label: "Unread Messages", value: s.unreadMessages, icon: MdEmail, href: "/admin/messages", color: "bg-red-50 text-red-700" },
];

const quickLinks = [
    { label: "New Article", href: "/admin/articles?new=1" },
    { label: "New Teaching", href: "/admin/teachings?new=1" },
    { label: "New Snippet", href: "/admin/snippets?new=1" },
    { label: "Add Leader", href: "/admin/leaders?new=1" },
    { label: "Add FAQ", href: "/admin/faqs?new=1" },
    { label: "Edit Site Settings", href: "/admin/settings" },
    { label: "Manage Team", href: "/admin/team" },
    { label: "View Messages", href: "/admin/messages" },
];

export default function DashboardPage() {
    const { adminUser } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getDashboardStats()
            .then(setStats)
            .catch((e) => setError(e.message))
            .finally(() => setLoadingStats(false));
    }, []);

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Welcome */}
            <div>
                <h1 className="text-xl font-semibold text-gray-900">
                    Welcome back{adminUser?.name ? `, ${adminUser.name}` : ""}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage all content and settings for the DCLM AU website from here.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                    {error}
                </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {loadingStats
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="stat-card animate-pulse">
                            <div className="h-4 bg-gray-200 w-1/2 mb-3" />
                            <div className="h-8 bg-gray-200 w-1/3" />
                        </div>
                    ))
                    : stats &&
                    statCards(stats).map((card) => (
                        <Link key={card.label} href={card.href} className="stat-card hover:border-blue-300 transition-colors block">
                            <div className={`inline-flex p-2 mb-3 ${card.color}`}>
                                <card.icon size={18} />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                        </Link>
                    ))}
            </div>

            {/* Quick actions */}
            <div className="admin-card">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {quickLinks.map((l) => (
                        <Link
                            key={l.label}
                            href={l.href}
                            className="flex items-center justify-between px-3 py-2 border border-gray-200 text-sm text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors"
                        >
                            <span>{l.label}</span>
                            <MdArrowForward size={14} className="shrink-0" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Content sections overview */}
            <div className="admin-card">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                    Content Sections
                </h2>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Section</th>
                            <th>Description</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { name: "Hero Slides", desc: "Homepage banner slideshow images and text", href: "/admin/hero" },
                            { name: "Articles", desc: "Blog articles with WYSIWYG content editor", href: "/admin/articles" },
                            { name: "Snippets", desc: "Short Bible reflections", href: "/admin/snippets" },
                            { name: "Teachings", desc: "In-depth Bible Review Series teachings", href: "/admin/teachings" },
                            { name: "Leaders", desc: "Leadership team profiles on About page", href: "/admin/leaders" },
                            { name: "Testimonials", desc: "Member testimonials on homepage", href: "/admin/testimonials" },
                            { name: "FAQs", desc: "Frequently asked questions", href: "/admin/faqs" },
                            { name: "Stats", desc: "Homepage / About page statistics", href: "/admin/stats" },
                            { name: "Site Settings", desc: "Global settings: name, contact info, social links", href: "/admin/settings" },
                        ].map((row) => (
                            <tr key={row.name}>
                                <td className="font-semibold text-gray-800">{row.name}</td>
                                <td className="text-gray-500">{row.desc}</td>
                                <td>
                                    <Link href={row.href} className="text-blue-700 text-xs font-semibold hover:underline">
                                        Manage →
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
