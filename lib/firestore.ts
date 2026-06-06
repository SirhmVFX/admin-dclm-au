import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
    where,
    limit,
    DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Types ──────────────────────────────────────────────────

export interface HeroSlide {
    id?: string;
    src: string;
    heading: string;
    sub: string;
    order: number;
    active: boolean;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Article {
    id?: string;
    title: string;
    description: string;
    content: string; // HTML from WYSIWYG
    imgSrc: string;
    date: string;
    readingTime: string;
    published: boolean;
    featured: boolean;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Snippet {
    id?: string;
    title: string;
    description: string;
    content: string; // HTML from WYSIWYG
    img: string;
    published: boolean;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Teaching {
    id?: string;
    title: string;
    description: string;
    content: string; // HTML from WYSIWYG
    teacher: string;
    bibleVerse: string;
    date: string;
    imgSrc: string;
    published: boolean;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Testimonial {
    id?: string;
    name: string;
    role: string;
    feedback: string;
    imgSrc: string;
    published: boolean;
    order: number;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Leader {
    id?: string;
    name: string;
    title: string;
    image: string;
    bio: string;
    order: number;
    active: boolean;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface FAQItem {
    id?: string;
    question: string;
    answer: string;
    order: number;
    active: boolean;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Stat {
    id?: string;
    value: string;
    label: string;
    order: number;
    active: boolean;
}

export interface SiteSettings {
    id?: string;
    siteName: string;
    siteDescription: string;
    email: string;
    phone: string;
    address: string;
    facebookUrl: string;
    instagramUrl: string;
    youtubeUrl: string;
    logoUrl: string;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaBody: string;
    ctaButtonText: string;
    ctaButtonUrl: string;
    footerCopyright: string;
    updatedAt?: Timestamp;
}

export interface AdminUser {
    id?: string;
    email: string;
    name: string;
    role: "super_admin" | "admin" | "editor";
    active: boolean;
    uid: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface ContactMessage {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    message: string;
    read: boolean;
    createdAt?: Timestamp;
}

// ── Generic helpers ────────────────────────────────────────

async function getAll<T>(col: string): Promise<T[]> {
    const snap = await getDocs(collection(db, col));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

async function getOrdered<T>(col: string, field = "order"): Promise<T[]> {
    const q = query(collection(db, col), orderBy(field));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

async function getOne<T>(col: string, id: string): Promise<T | null> {
    const snap = await getDoc(doc(db, col, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as T;
}

async function create<T extends DocumentData>(col: string, data: Omit<T, "id">): Promise<string> {
    const ref = await addDoc(collection(db, col), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

async function update<T extends DocumentData>(col: string, id: string, data: Partial<T>): Promise<void> {
    await updateDoc(doc(db, col, id), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

async function remove(col: string, id: string): Promise<void> {
    await deleteDoc(doc(db, col, id));
}

// ── Collection-specific helpers ───────────────────────────

// Hero Slides
export const getHeroSlides = () => getOrdered<HeroSlide>("heroSlides");
export const createHeroSlide = (data: Omit<HeroSlide, "id">) => create<HeroSlide>("heroSlides", data);
export const updateHeroSlide = (id: string, data: Partial<HeroSlide>) => update<HeroSlide>("heroSlides", id, data);
export const deleteHeroSlide = (id: string) => remove("heroSlides", id);

// Articles
export const getArticles = () => getOrdered<Article>("articles", "createdAt");
export const getArticle = (id: string) => getOne<Article>("articles", id);
export const createArticle = (data: Omit<Article, "id">) => create<Article>("articles", data);
export const updateArticle = (id: string, data: Partial<Article>) => update<Article>("articles", id, data);
export const deleteArticle = (id: string) => remove("articles", id);

// Snippets
export const getSnippets = () => getOrdered<Snippet>("snippets", "createdAt");
export const getSnippet = (id: string) => getOne<Snippet>("snippets", id);
export const createSnippet = (data: Omit<Snippet, "id">) => create<Snippet>("snippets", data);
export const updateSnippet = (id: string, data: Partial<Snippet>) => update<Snippet>("snippets", id, data);
export const deleteSnippet = (id: string) => remove("snippets", id);

// Teachings
export const getTeachings = () => getOrdered<Teaching>("teachings", "createdAt");
export const getTeaching = (id: string) => getOne<Teaching>("teachings", id);
export const createTeaching = (data: Omit<Teaching, "id">) => create<Teaching>("teachings", data);
export const updateTeaching = (id: string, data: Partial<Teaching>) => update<Teaching>("teachings", id, data);
export const deleteTeaching = (id: string) => remove("teachings", id);

// Testimonials
export const getTestimonials = () => getOrdered<Testimonial>("testimonials");
export const createTestimonial = (data: Omit<Testimonial, "id">) => create<Testimonial>("testimonials", data);
export const updateTestimonial = (id: string, data: Partial<Testimonial>) => update<Testimonial>("testimonials", id, data);
export const deleteTestimonial = (id: string) => remove("testimonials", id);

// Leaders
export const getLeaders = () => getOrdered<Leader>("leaders");
export const createLeader = (data: Omit<Leader, "id">) => create<Leader>("leaders", data);
export const updateLeader = (id: string, data: Partial<Leader>) => update<Leader>("leaders", id, data);
export const deleteLeader = (id: string) => remove("leaders", id);

// FAQs
export const getFAQs = () => getOrdered<FAQItem>("faqs");
export const createFAQ = (data: Omit<FAQItem, "id">) => create<FAQItem>("faqs", data);
export const updateFAQ = (id: string, data: Partial<FAQItem>) => update<FAQItem>("faqs", id, data);
export const deleteFAQ = (id: string) => remove("faqs", id);

// Stats
export const getStats = () => getOrdered<Stat>("stats");
export const createStat = (data: Omit<Stat, "id">) => create<Stat>("stats", data);
export const updateStat = (id: string, data: Partial<Stat>) => update<Stat>("stats", id, data);
export const deleteStat = (id: string) => remove("stats", id);

// Site Settings (single doc)
export async function getSiteSettings(): Promise<SiteSettings | null> {
    const snap = await getDocs(collection(db, "siteSettings"));
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as SiteSettings;
}

export async function saveSiteSettings(data: Partial<SiteSettings>): Promise<void> {
    const snap = await getDocs(collection(db, "siteSettings"));
    if (snap.empty) {
        await addDoc(collection(db, "siteSettings"), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    } else {
        await updateDoc(doc(db, "siteSettings", snap.docs[0].id), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    }
}

// Admin Users
export const getAdminUsers = () => getAll<AdminUser>("adminUsers");
export const createAdminUser = (data: Omit<AdminUser, "id">) => create<AdminUser>("adminUsers", data);
export const updateAdminUser = (id: string, data: Partial<AdminUser>) => update<AdminUser>("adminUsers", id, data);
export const deleteAdminUser = (id: string) => remove("adminUsers", id);
export async function getAdminUserByUid(uid: string): Promise<AdminUser | null> {
    const q = query(collection(db, "adminUsers"), where("uid", "==", uid), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as AdminUser;
}

// Contact Messages
export const getContactMessages = () => getOrdered<ContactMessage>("contactMessages", "createdAt");
export const markMessageRead = (id: string) => updateDoc(doc(db, "contactMessages", id), { read: true });
export const deleteContactMessage = (id: string) => remove("contactMessages", id);

// Dashboard stats
export async function getDashboardStats() {
    const [articles, teachings, snippets, testimonials, leaders, messages] = await Promise.all([
        getDocs(collection(db, "articles")),
        getDocs(collection(db, "teachings")),
        getDocs(collection(db, "snippets")),
        getDocs(collection(db, "testimonials")),
        getDocs(collection(db, "leaders")),
        getDocs(query(collection(db, "contactMessages"), where("read", "==", false))),
    ]);
    return {
        articles: articles.size,
        teachings: teachings.size,
        snippets: snippets.size,
        testimonials: testimonials.size,
        leaders: leaders.size,
        unreadMessages: messages.size,
    };
}
