export const SITE = {
  name: "Answer Share",
  tagline: "Who AI answer engines actually cite",
  description:
    "An open, continuously re-measured record of which sources AI answer engines cite when people ask commercial questions. Every number is derived from archived runs you can download and re-score.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://answershare.vercel.app",
  repo: "https://github.com/kerriganbaron-fidgetlabs/answershare",
} as const;
