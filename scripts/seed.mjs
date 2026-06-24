/**
 * Seed script — populates the DCLM AU Firebase database with dummy content.
 *
 * Run with:
 *   node scripts/seed.mjs
 *
 * Requires the Firebase Admin SDK env vars to be set, OR simply uses the
 * client SDK via the .env.local values via process.env.
 *
 * Because we are running outside Next.js, export the vars first:
 *
 *   export $(cat .env.local | grep -v '^#' | xargs) && node scripts/seed.mjs
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";

// ── Firebase init ──────────────────────────────────────────

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Helpers ────────────────────────────────────────────────

async function collectionIsEmpty(col) {
    const snap = await getDocs(collection(db, col));
    return snap.empty;
}

async function seedCollection(col, items) {
    if (!(await collectionIsEmpty(col))) {
        console.log(`  ⏭  ${col} already has data, skipping.`);
        return;
    }
    for (const item of items) {
        await addDoc(collection(db, col), {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    }
    console.log(`  ✅  Seeded ${items.length} docs into "${col}"`);
}

// ── Seed data ──────────────────────────────────────────────

const heroSlides = [
    { src: "/assets/heroimage1.jpg", heading: "Teaching the Undiluted Word of God", sub: "We are committed to sound doctrine, holiness, and raising saintly intellectuals for Christ across Australian campuses.", order: 1, active: true },
    { src: "/assets/heroimage2.jpg", heading: "Win, Build and Commission", sub: "DLCF Australia exists to win students and staff for Christ, build them up in faith, and commission them for impact.", order: 2, active: true },
    { src: "/assets/1.jpg", heading: "Contending Earnestly for the Faith", sub: "Standing firm on the faith once delivered to the saints — in prayer, fellowship, and the study of God's Word.", order: 3, active: true },
];

const articles = [
    {
        title: "The Lighthouse at the Harbour",
        description: "The Southern Cross is a constellation of stars used in navigation in the Southern Hemisphere — an emblem found on our national flag, pointing us to something greater.",
        content: "<p>The Southern Cross has guided sailors and explorers for centuries. As believers, we have an even more certain guide — the Word of God and the Holy Spirit. Just as a lighthouse warns ships of danger and guides them to safety, so the light of Christ guides us through the storms of life.</p><p>In a world full of confusion, moral ambiguity, and spiritual darkness, the Christian stands as a lighthouse — illuminating the path of righteousness and hope.</p>",
        imgSrc: "/assets/1.jpg",
        date: "February 25, 2024",
        readingTime: "5 min read",
        published: true,
        featured: true,
    },
    {
        title: "Humanity: Awesome Potential Beset by Innate Limits",
        description: "Today we see unprecedented development in every field of human endeavour — yet new accomplishments in Medicine, Engineering, and AI reveal how much humanity still needs God.",
        content: "<p>We live in the most technologically advanced era in human history. Diseases that once wiped out civilisations are now curable. Machines perform surgery with sub-millimetre precision. Artificial intelligence can process more information in a second than a human mind can in a lifetime.</p><p>Yet with all this progress, the deep questions of meaning, purpose, and morality remain unanswered by science. Only in God do we find the answers to why we are here.</p>",
        imgSrc: "/assets/2.jpg",
        date: "March 10, 2024",
        readingTime: "7 min read",
        published: true,
        featured: false,
    },
    {
        title: "The Sacredness of Human Existence",
        description: "Our civilization today upholds the sacredness of life — yet the deepest questions of human dignity and purpose find their answer only in the Creator.",
        content: "<p>Every human being carries within them the image of God — the Imago Dei. This truth is the foundation of all human dignity, all human rights, and all genuine compassion for the suffering.</p><p>When we lose sight of the Creator, we lose sight of the true worth of the creature. History has shown us repeatedly what happens when human beings are viewed apart from their divine origin — exploitation, genocide, and moral collapse.</p>",
        imgSrc: "/assets/3.jpg",
        date: "March 25, 2024",
        readingTime: "6 min read",
        published: true,
        featured: false,
    },
    {
        title: "The Oasis in the Desert",
        description: "Humanity has never witnessed the prosperity we enjoy today — we live longer and healthier — yet unexpectedly, we are not happier. Where is the true oasis?",
        content: "<p>Prosperity has reached heights our grandparents could never have imagined. Yet surveys consistently show that depression, anxiety, and a profound sense of meaninglessness are at epidemic levels, especially among the young.</p><p>The oasis the human soul truly craves is not found in material wealth, pleasure, or achievement. It is found only in the living water that Jesus offers — a spring that wells up to eternal life (John 4:14).</p>",
        imgSrc: "/assets/4.jpg",
        date: "April 5, 2024",
        readingTime: "8 min read",
        published: true,
        featured: false,
    },
];

const snippets = [
    {
        title: "Choose to Trust in God",
        description: "A reflection on what it means to place your complete trust in God in every situation of life.",
        content: "<p>Trust is not a feeling — it is a decision. Every morning, the believer wakes up and chooses to trust in God's goodness, wisdom, and sovereignty, regardless of what circumstances may suggest.</p><p><em>\"Trust in the Lord with all your heart, and do not lean on your own understanding.\" — Proverbs 3:5</em></p>",
        img: "/assets/9.jpg",
        published: true,
    },
    {
        title: "Forgiveness",
        description: "Exploring the power and necessity of forgiveness as taught and modelled by our Lord Jesus Christ.",
        content: "<p>Forgiveness is one of the most radical acts a human being can perform. It goes against every natural instinct of self-preservation and justice. Yet Jesus not only commanded it — He modelled it from the cross: \"Father, forgive them, for they do not know what they are doing.\"</p><p>Unforgiveness is a prison. The one who refuses to forgive imprisons himself far more than the one he refuses to forgive.</p>",
        img: "/assets/6.jpg",
        published: true,
    },
    {
        title: "Believe in God",
        description: "An encouragement to hold fast to genuine faith in God, especially in the midst of life's challenges.",
        content: "<p>Faith is not the absence of doubt — it is choosing to stand on God's Word even when doubt is present. Abraham believed God and it was counted to him as righteousness. He believed in hope, against hope.</p><p>What are you facing today that seems impossible? Choose to believe God. His Word never fails.</p>",
        img: "/assets/10.jpg",
        published: true,
    },
    {
        title: "Joy as Jesus Comes",
        description: "Meditating on the joy that believers anticipate as we look forward to the coming of our Lord Jesus Christ.",
        content: "<p>The second coming of Jesus is not a cause for fear for the believer — it is the blessed hope. It is the event towards which all of history is moving, and the moment when every tear will be wiped away and every wrong will be made right.</p><p>\"Looking for the blessed hope and the glorious appearing of the great God and our Saviour Jesus Christ.\" — Titus 2:13</p>",
        img: "/assets/8.jpg",
        published: true,
    },
    {
        title: "The Power of Prayer",
        description: "Understanding why prayer is not a last resort but the first and most powerful resource of the believer.",
        content: "<p>Prayer changes things — not because it informs God of what He does not know, but because it aligns the believer's will with God's will and activates the power of heaven on earth.</p><p>The early church turned the world upside down not through political influence or military power, but through prayer and the preaching of the Word.</p>",
        img: "/assets/7.jpg",
        published: true,
    },
];

const teachings = [
    {
        title: "1st Thessalonians",
        description: "A full review of Paul's first letter to the Thessalonians — covering faith, love, holiness, and the hope of Christ's return.",
        content: "<p>Paul's first letter to the Thessalonians is one of the earliest New Testament epistles. Written to a young church under persecution, it is a masterclass in pastoral encouragement, doctrinal clarity, and eschatological hope.</p><p>Key themes: the model church, sanctification and holiness, the rapture, and living as children of the light.</p>",
        teacher: "DLCF Teaching Team",
        bibleVerse: "1 Thessalonians 5:23",
        date: "February 25, 2024",
        imgSrc: "/assets/heroimage1.jpg",
        published: true,
    },
    {
        title: "Lover of the Broken Heart",
        description: "A snippet exploring God's deep love and compassion for those who are hurting, brokenhearted, and in need of His healing touch.",
        content: "<p>God is not distant from our pain. The very God who created the universe is intimately acquainted with grief. Isaiah 53 tells us that the Messiah was \"a man of sorrows and acquainted with grief.\"</p><p>If you are broken today, know that God draws near to the brokenhearted. He is the healer of wounds that no human hand can reach.</p>",
        teacher: "DLCF Teaching Team",
        bibleVerse: "Psalm 34:18",
        date: "June 21, 2024",
        imgSrc: "/assets/heroimage2.jpg",
        published: true,
    },
    {
        title: "Luke 2",
        description: "A reflection on the second chapter of Luke — the birth of Christ, His presentation at the temple, and His early wisdom.",
        content: "<p>Luke 2 is one of the most beloved chapters in all of Scripture. It records the birth of Jesus in Bethlehem, the proclamation of the angels, the visit of the shepherds, and the presentation of Jesus at the temple.</p><p>But perhaps most striking is the closing scene — the twelve-year-old Jesus in the temple, sitting among the teachers, listening and asking questions. \"Did you not know that I must be in My Father's house?\"</p>",
        teacher: "DLCF Teaching Team",
        bibleVerse: "Luke 2:52",
        date: "June 21, 2024",
        imgSrc: "/assets/heroimage1.jpg",
        published: true,
    },
    {
        title: "Joy as Jesus Comes",
        description: "Meditating on the anticipation and joy that fills the heart of every believer as we look forward to the second coming of Jesus.",
        content: "<p>The return of Jesus is the singular hope that sustains the believer through every trial. Paul calls it the \"blessed hope\" — not a vague wish, but a certain expectation grounded in the resurrection.</p><p>As we see the signs of the times converging, we do not despair — we lift our heads, for our redemption draws near.</p>",
        teacher: "DLCF Teaching Team",
        bibleVerse: "Philippians 4:4",
        date: "June 21, 2024",
        imgSrc: "/assets/heroimage2.jpg",
        published: true,
    },
    {
        title: "Believe in God",
        description: "An encouragement drawn from Scripture to hold fast to genuine, unshakeable faith in God regardless of life's circumstances.",
        content: "<p>John 14:1 — \"Let not your hearts be troubled. Believe in God; believe also in me.\" Jesus spoke these words on the night of His arrest, to men who were about to have their world shaken to its core.</p><p>Genuine faith is not faith that has never been tested — it is faith that has been tested and has held. God is faithful, and He will do it.</p>",
        teacher: "DLCF Teaching Team",
        bibleVerse: "John 14:1",
        date: "June 21, 2024",
        imgSrc: "/assets/heroimage1.jpg",
        published: true,
    },
];

const leaders = [
    { name: "Pastor Michael", title: "Fellowship Pastor", image: "/assets/heroimage1.jpg", bio: "Committed to prayer, biblical teaching, and building saints who shine for Christ in their campus and community.", order: 1, active: true },
    { name: "Sis. Grace", title: "Women's Coordinator", image: "/assets/heroimage2.jpg", bio: "Leading women in the fellowship to grow in godliness, wisdom, and effective service for the Kingdom.", order: 2, active: true },
    { name: "Bro. Daniel", title: "Prayer & Outreach Director", image: "/assets/heroimage1.jpg", bio: "Organising campus outreaches and prayer initiatives that win souls and strengthen the body of Christ.", order: 3, active: true },
    { name: "Sis. Ruth", title: "Bible Review Series Host", image: "/assets/heroimage2.jpg", bio: "Hosting the Bible Review Series and facilitating in-depth scripture engagement across the fellowship.", order: 4, active: true },
];

const faqs = [
    { question: "What is DCLM Australia all about?", answer: "We are a Christ-centred fellowship committed to the undiluted word of God, prayer, discipleship, and outreach among students and young professionals in Australia.", order: 1, active: true },
    { question: "Do I need to be a member before attending?", answer: "Not at all. Visitors are welcome to attend services, Bible study meetings, and fellowship activities as we continue to grow together in Christ.", order: 2, active: true },
    { question: "How can I join the weekly programmes?", answer: "You can visit our contact page, reach out through social media, or sign up on this website to receive updates on prayer meetings, Bible study, and monthly programmes.", order: 3, active: true },
    { question: "Does the fellowship provide spiritual support?", answer: "Yes. We offer prayer support, counselling, Bible review series, and weekly teachings to strengthen believers and guide new members in their spiritual journey.", order: 4, active: true },
];

const stats = [
    { value: "100%", label: "Inter-denominational", order: 1, active: true },
    { value: "24/7", label: "Daily Manna Available", order: 2, active: true },
    { value: "Win", label: "Students & Staff", order: 3, active: true },
    { value: "Build", label: "In Faith & Doctrine", order: 4, active: true },
    { value: "Commission", label: "For the Master", order: 5, active: true },
    { value: "AU", label: "Australia Campuses", order: 6, active: true },
];

const testimonials = [
    { name: "Emmanuel Okafor", role: "Campus Member", feedback: "DLCF Australia has been a blessing to my spiritual life. The fellowship, the Word, and the godly community have helped me grow tremendously in my walk with God.", imgSrc: "/assets/1.jpg", published: true, order: 1 },
    { name: "Blessing Adeyemi", role: "Corps Member", feedback: "The Bible Review Series opened my eyes to deep truths in Scripture. I am grateful for the dedication of the team in making this resource available to us.", imgSrc: "/assets/2.jpg", published: true, order: 2 },
    { name: "Samuel Nwosu", role: "Graduate", feedback: "Daily Manna has become an essential part of my morning routine. It keeps me grounded in God's Word no matter how busy my schedule gets.", imgSrc: "/assets/3.jpg", published: true, order: 3 },
    { name: "Grace Mensah", role: "Campus Member", feedback: "DLCF Australia welcomed me warmly when I arrived as an international student. The fellowship gave me a spiritual family far from home.", imgSrc: "/assets/4.jpg", published: true, order: 4 },
    { name: "Daniel Eze", role: "Staff", feedback: "The godly counseling and monthly programmes have been instrumental in shaping my character and deepening my faith in the Lord Jesus Christ.", imgSrc: "/assets/5.jpg", published: true, order: 5 },
    { name: "Ruth Afolabi", role: "Campus Member", feedback: "Being part of DLCF Australia has helped me balance academic excellence with spiritual growth. I am a better person and a stronger believer because of this fellowship.", imgSrc: "/assets/6.jpg", published: true, order: 6 },
];

// ── Run ────────────────────────────────────────────────────

async function main() {
    console.log("\n🌱  DCLM AU — Database Seed Script");
    console.log("──────────────────────────────────");
    console.log(`   Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}\n`);

    await seedCollection("heroSlides", heroSlides);
    await seedCollection("articles", articles);
    await seedCollection("snippets", snippets);
    await seedCollection("teachings", teachings);
    await seedCollection("leaders", leaders);
    await seedCollection("faqs", faqs);
    await seedCollection("stats", stats);
    await seedCollection("testimonials", testimonials);

    console.log("\n✅  Seed complete.\n");
    process.exit(0);
}

main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
