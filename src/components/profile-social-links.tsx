import { ExternalLink } from "lucide-react";

export type SocialLink = { platform: string; url: string; label: string };
export const SOCIAL_PLATFORMS = ["Instagram", "TikTok", "YouTube", "Website"] as const;

/** Only allow http(s) links so stored values can't run scripts. */
export function safeUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function parseSocialLinks(v: unknown): SocialLink[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({ platform: String(x["platform"] ?? "Website"), url: String(x["url"] ?? ""), label: String(x["label"] ?? "") }))
    .filter((x) => safeUrl(x.url));
}

export function ProfileSocialLinks({ links }: { links: unknown }) {
  const list = parseSocialLinks(links);
  if (!list.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm" data-testid="profile-social-links">
      {list.map((l, i) => (
        <li key={i}>
          <a href={safeUrl(l.url)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
            <span className="text-muted-foreground">{l.platform}:</span> {l.label || l.url}
            <ExternalLink className="size-3 opacity-70" />
          </a>
        </li>
      ))}
    </ul>
  );
}
