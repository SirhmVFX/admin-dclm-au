# DCLM AU Admin Panel

Full-featured admin panel for the Deeper Christian Life Ministry Australia website.

## Features

- **Firebase Auth** — email/password login, role-based access
- **Team Management** — Super Admin, Admin, Editor roles
- **WYSIWYG Editor** — TipTap-powered rich text for articles, snippets, and teachings
- **Cloudinary uploads** — image upload with 8 MB limit
- **All client sections** manageable:
  - Hero Slides
  - Articles (with full content editor)
  - Bible Snippets
  - Teachings (Bible Review Series)
  - Leaders / Team
  - Testimonials
  - FAQs
  - Stats
  - Contact Messages (inbox)
  - Site Settings (name, contact, social, CTA, footer)

## Setup

1. Copy `.env.local` and fill in your Firebase + Cloudinary credentials
2. `npm install`
3. `npm run dev`

### Firebase Setup
- Enable **Email/Password** authentication in Firebase Console
- Create a Firestore database
- Add the first Super Admin manually in Firestore `adminUsers` collection with your Firebase Auth UID

### Cloudinary Setup
- Create a free Cloudinary account
- Create an **unsigned upload preset** in Settings > Upload
- Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

## Collections (Firestore)

| Collection | Purpose |
|---|---|
| `heroSlides` | Homepage hero slides |
| `articles` | Articles page content |
| `snippets` | Bible snippets |
| `teachings` | Bible review series teachings |
| `leaders` | Leadership team |
| `testimonials` | Member testimonials |
| `faqs` | Frequently asked questions |
| `stats` | Homepage stats |
| `siteSettings` | Global site settings (single doc) |
| `adminUsers` | Admin user profiles + roles |
| `contactMessages` | Messages from contact form |

## Routes

| Route | Description |
|---|---|
| `/login` | Admin login |
| `/admin` | Dashboard |
| `/admin/hero` | Hero slides |
| `/admin/articles` | Articles |
| `/admin/snippets` | Snippets |
| `/admin/teachings` | Teachings |
| `/admin/leaders` | Leaders |
| `/admin/testimonials` | Testimonials |
| `/admin/faqs` | FAQs |
| `/admin/stats` | Stats |
| `/admin/messages` | Contact messages |
| `/admin/team` | Admin team management |
| `/admin/settings` | Site settings |
