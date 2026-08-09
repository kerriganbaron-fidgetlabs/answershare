import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}. ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name}. ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
  },
  robots: { index: true, follow: true },
};

const NAV = [
  { href: "/categories", label: "Categories" },
  { href: "/check", label: "Check a domain" },
  { href: "/methodology", label: "Methodology" },
  { href: "/data", label: "Data" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-dvh flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-text"
        >
          Skip to content
        </a>

        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
            <Link href="/" className="font-semibold tracking-tight">
              {SITE.name}
              <span className="ml-2 text-sm font-normal text-text-muted">
                {SITE.tagline}
              </span>
            </Link>
            <nav aria-label="Main">
              <ul className="flex flex-wrap gap-5 text-sm">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-text-muted underline-offset-4 hover:text-text hover:underline"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        <main id="main" className="flex-1">
          {children}
        </main>

        <footer className="mt-20 border-t border-border bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-text-muted">
            <p className="max-w-2xl">
              {SITE.name} measures which sources AI answer engines cite for
              commercial questions. Every figure is derived from archived runs
              that you can download and re-score yourself.
            </p>
            <ul className="mt-5 flex flex-wrap gap-5">
              <li>
                <Link href="/methodology" className="underline underline-offset-4">
                  Methodology
                </Link>
              </li>
              <li>
                <Link href="/data" className="underline underline-offset-4">
                  Raw data
                </Link>
              </li>
              <li>
                <Link href="/disclosure" className="underline underline-offset-4">
                  Disclosure
                </Link>
              </li>
            </ul>
            <p className="mt-6 text-xs">
              Dataset licensed CC BY 4.0. Not affiliated with any measured
              engine or vendor.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
