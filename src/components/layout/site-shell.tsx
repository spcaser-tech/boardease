import Link from "next/link";
import { Home } from "lucide-react";

const links = [
  { href: "/#rooms", label: "Rooms" },
  { href: "/#amenities", label: "Amenities" },
  { href: "/#about", label: "About Us" },
  { href: "/#how", label: "How It Works" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white"><Home size={18} /></span>
          <span className="text-lg">BoardEase</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          {links.map((l) => <a key={l.href} href={l.href} className="hover:text-slate-900">{l.label}</a>)}
        </nav>
        <Link href="/login" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark">Login / Register</Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const badges = [
    { title: "Easy to Use", desc: "User friendly interface for anyone" },
    { title: "Secure System", desc: "Advanced security to protect your data" },
    { title: "Cloud Based", desc: "Access your system anytime anywhere" },
    { title: "Accessible Anywhere", desc: "Use it on any device anytime anywhere" },
  ];
  return (
    <footer id="contact" className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b) => (
            <div key={b.title} className="flex items-start gap-3">
              <div className="mt-1 h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center font-bold">✓</div>
              <div>
                <div className="font-medium text-slate-900">{b.title}</div>
                <div className="text-sm text-slate-600">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row">
          <div>© {new Date().getFullYear()} BoardEase. All rights reserved.</div>
          <div className="h-20 w-20 rounded-md border border-slate-200 bg-white grid place-items-center text-[10px] text-center text-slate-500 p-2">Scan to learn more about BoardEase</div>
        </div>
      </div>
    </footer>
  );
}
