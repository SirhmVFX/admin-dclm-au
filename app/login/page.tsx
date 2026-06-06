"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Image from "next/image";

export default function LoginPage() {
    const { signIn } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signIn(email, password);
            router.replace("/admin");
        } catch {
            setError("Invalid email or password. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#07112b] flex-col items-center justify-center p-12">
                <div className="w-20 h-20 mb-6">
                    <Image
                        src="/assets/dlclogo.png"
                        alt="DCLM AU"
                        width={80}
                        height={80}
                        className="w-full h-full object-contain"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                </div>
                <p className="text-xs uppercase tracking-[0.35em] text-blue-300 mb-2">Deeper Life Campus Fellowship</p>
                <h1 className="text-3xl font-semibold text-white text-center">DCLM AU Admin</h1>
                <p className="mt-4 text-gray-400 text-center max-w-xs text-sm">
                    Manage content, teams, and everything that powers the DCLM Australia website.
                </p>
                <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
                    {["Articles", "Teachings", "Team", "Settings"].map((item) => (
                        <div key={item} className="border border-white/10 p-4 text-center">
                            <p className="text-white text-sm font-semibold">{item}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center p-6 bg-white">
                <div className="w-full max-w-sm">
                    <div className="lg:hidden mb-8 text-center">
                        <p className="text-xs uppercase tracking-[0.3em] text-blue-700 mb-1">DCLM Australia</p>
                        <h1 className="text-2xl font-semibold">Admin Panel</h1>
                    </div>

                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">Sign in</h2>
                    <p className="text-sm text-gray-500 mb-8">Enter your admin credentials to continue</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="admin-label">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="admin-input"
                                placeholder="admin@dclm-au.org"
                                required
                            />
                        </div>
                        <div>
                            <label className="admin-label">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="admin-input"
                                placeholder="Enter password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-60"
                        >
                            {loading ? "Signing in…" : "Sign In"}
                        </button>
                    </form>

                    <p className="mt-8 text-xs text-gray-400 text-center">
                        DCLM AU Admin Panel — restricted access only
                    </p>
                </div>
            </div>
        </div>
    );
}
