"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import {
    MdDashboard,
    MdArticle,
    MdMenuBook,
    MdPeople,
    MdSettings,
    MdEmail,
    MdLogout,
    MdMenu,
    MdClose,
    MdQuestionAnswer,
    MdStar,
    MdBarChart,
    MdSlideshow,
    MdAutoStories,
    MdOutlineGroups,
    MdLabel,
    MdFacebook,
} from "react-icons/md";

const navSections = [
    {
        label: "Overview",
        items: [
            { href: "/admin", label: "Dashboard", icon: MdDashboard },
        ],
    },
    {
        label: "Pages",
        items: [
            { href: "/admin/homepage", label: "HomePage", icon: MdSlideshow },
            { href: "/admin/about", label: "About Page", icon: MdArticle },
            { href: "/admin/contact", label: "Contact Page", icon: MdAutoStories },
        ],
    },
    {
        label: "Content",
        items: [
            { href: "/admin/hero", label: "Hero Slides", icon: MdSlideshow },
            { href: "/admin/articles", label: "Articles", icon: MdArticle },
            { href: "/admin/article-categories", label: "Article Categories", icon: MdLabel },
            { href: "/admin/snippets", label: "Bible Snippets", icon: MdAutoStories },
            { href: "/admin/facebook-posts", label: "Facebook Posts", icon: MdFacebook },
            { href: "/admin/teachings", label: "Teachings", icon: MdMenuBook },
        ],
    },
    {
        label: "About",
        items: [
            { href: "/admin/leaders", label: "Leaders", icon: MdPeople },
            { href: "/admin/testimonials", label: "Testimonials", icon: MdStar },
            { href: "/admin/stats", label: "Stats", icon: MdBarChart },
            { href: "/admin/faqs", label: "FAQs", icon: MdQuestionAnswer },
        ],
    },
    {
        label: "Manage",
        items: [
            { href: "/admin/messages", label: "Messages", icon: MdEmail },
            { href: "/admin/team", label: "Team", icon: MdOutlineGroups },
            { href: "/admin/settings", label: "Site Settings", icon: MdSettings },
        ],
    },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, adminUser, loading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#07112b]">
                <p className="text-white text-sm">Loading…</p>
            </div>
        );
    }

    if (!user) return null;

    async function handleSignOut() {
        await signOut();
        router.replace("/login");
    }

    const Sidebar = () => (
        <div className="admin-sidebar flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
                <div className="w-9 h-9 bg-[#112FE2] flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">D</span>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-blue-300">DCLM Australia</p>
                    <p className="text-sm font-semibold text-white">Admin Panel</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 overflow-y-auto">
                {navSections.map((section) => (
                    <div key={section.label}>
                        <p className="nav-section-label">{section.label}</p>
                        {section.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`nav-item ${isActive ? "active" : ""}`}
                                >
                                    <item.icon size={16} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* User */}
            <div className="border-t border-white/10 p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-700 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold uppercase">
                            {(adminUser?.name || user.email || "A")[0]}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                            {adminUser?.name || "Admin"}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-gray-400 text-xs hover:text-white transition-colors w-full"
                >
                    <MdLogout size={14} />
                    Sign out
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex flex-col admin-sidebar fixed left-0 top-0 h-full z-40 overflow-y-auto">
                <Sidebar />
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <aside
                className={`fixed left-0 top-0 h-full z-40 lg:hidden transition-transform duration-300 overflow-y-auto admin-sidebar ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                style={{ width: 260 }}
            >
                <Sidebar />
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col lg:ml-[260px]">
                {/* Top bar */}
                <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
                    <button
                        className="lg:hidden p-1"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <MdMenu size={22} />
                    </button>
                    <div className="hidden lg:block">
                        <p className="text-sm font-semibold text-gray-700 capitalize">
                            {pathname.replace("/admin/", "").replace("/admin", "Dashboard").replace(/-/g, " ") || "Dashboard"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                        <span className="text-xs text-gray-500 hidden sm:block">{user.email}</span>
                        {adminUser?.role && (
                            <span className="badge badge-blue">{adminUser.role.replace("_", " ")}</span>
                        )}
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}
