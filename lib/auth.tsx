"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";
import { getAdminUserByUid, AdminUser } from "./firestore";

interface AuthContextType {
    user: User | null;
    adminUser: AdminUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    createAdmin: (email: string, password: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const admin = await getAdminUserByUid(firebaseUser.uid);
                setAdminUser(admin);
            } else {
                setAdminUser(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    async function signIn(email: string, password: string) {
        await signInWithEmailAndPassword(auth, email, password);
    }

    async function signOut() {
        await firebaseSignOut(auth);
    }

    async function createAdmin(email: string, password: string): Promise<User> {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        return cred.user;
    }

    return (
        <AuthContext.Provider
            value={{ user, adminUser, loading, signIn, signOut, createAdmin }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
