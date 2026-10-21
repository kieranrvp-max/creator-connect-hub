import type { ReactNode } from "react";

export const LEGAL_EMAIL = "kieran@creatorconnecthub.co.uk";
export const LEGAL_UPDATED = "20 October 2026";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">Legal</p>
      <h1 className="mt-2 text-4xl font-semibold md:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated {LEGAL_UPDATED}</p>
      <p className="mt-6 text-muted-foreground">{intro}</p>
      <div className="mt-10 space-y-6">{children}</div>
    </main>
  );
}

export function LegalSection({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card/60 p-6 backdrop-blur md:p-8">
      <h2 className="text-2xl font-semibold"><span className="text-brand-gradient">{n}.</span> {title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground [&_ul]:space-y-2">{children}</div>
    </section>
  );
}

export function MailLink() {
  return <a href={`mailto:${LEGAL_EMAIL}`} className="font-medium text-primary underline-offset-4 hover:underline">{LEGAL_EMAIL}</a>;
}
