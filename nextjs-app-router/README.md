# Aura Hospital - Next.js (App Router) Landing Page

This folder contains the complete, production-ready, standalone **Next.js (App Router)** setup for the Aura Hospital public landing page.

## Structure
- `app/layout.tsx`: Root Next.js App Router layout with SEO metadata and dark monochrome typography.
- `app/page.tsx`: Client-rendered Next.js page leveraging the modular landing components.
- Components are located in `../components/`:
  - `Navbar.tsx` (Sticky glassmorphic top navigation with "H+" badge and anchor links)
  - `Hero.tsx` (Hero with pulsing emerald indicator, large light typography, and dual CTAs)
  - `StatsBar.tsx` (3-column dark grid with key metrics)
  - `ServicesGrid.tsx` (6 detailed service cards: 01 to 06 with hover highlights)
  - `SpecialistsSection.tsx` (Consultant roster with qualifications and booking triggers)
  - `AboutSection.tsx` (2-column facility overview with NABH compliance specs)
  - `ContactSection.tsx` (Emergency casualty hotline, OPD booking, and Darbhanga campus info)
  - `Footer.tsx` (Full legal, accreditation, and directory links)

## Deployment in a Next.js App
Simply copy `app/` and `components/` into your Next.js project root.
Dependencies required:
- `lucide-react`
- `tailwindcss`
