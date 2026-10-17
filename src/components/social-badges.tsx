import { BadgeCheck, CircleDashed, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount, type SocialAccount } from "@/lib/marketplace";

type Social = Pick<SocialAccount, "platform" | "handle" | "followers" | "avg_views" | "verified">;

export const PLATFORM_LABEL = { tiktok: "TikTok", instagram: "Instagram" } as const;

export function socialUrl(platform: Social["platform"], handle: string): string | null {
  const h = handle.trim().replace(/^https?:\/\/\S+\/@?/i, "").replace(/^@/, "").replace(/\/+$/, "");
  if (!h || !/^[\w.\-]+$/.test(h)) return null;
  const urls: Record<string, string> = {
    instagram: `https://instagram.com/${h}`,
    tiktok: `https://www.tiktok.com/@${h}`,
    youtube: `https://www.youtube.com/@${h}`,
  };
  return urls[platform] ?? null;
}

export function SocialBadge({ s }: { s: Social }) {
  const name = PLATFORM_LABEL[s.platform as keyof typeof PLATFORM_LABEL] ?? s.platform;
  const stats = `${formatCount(s.followers)} followers${s.avg_views != null ? ` · ${formatCount(s.avg_views)} avg views` : ""}`;
  const href = s.handle ? socialUrl(s.platform, s.handle) : null;
  const className = cn(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
    s.verified
      ? "border border-[#A855F7]/50 bg-[#A855F7]/10 text-white shadow-[0_0_12px_rgba(168,85,247,0.35)]"
      : "border border-white/10 bg-white/5 text-muted-foreground",
    href && "transition hover:border-[#EC4899]/60 hover:text-white",
  );
  const inner = (
    <>
      {s.verified ? <BadgeCheck className="size-3.5 text-[#EC4899]" /> : <CircleDashed className="size-3.5" />}
      <span className="font-semibold">{s.verified ? `✓ Verified ${name}` : `${name} · Unverified`}</span>
      <span className="opacity-80">{stats}</span>
      {href && <ExternalLink className="size-3 opacity-70" />}
    </>
  );
  const title = s.verified ? `Verified via ${name}` : "Self-reported — not verified";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}
        data-testid={`social-badge-${s.platform}`} title={`${title} — open ${name} profile`}
        onClick={(e) => e.stopPropagation()}>
        {inner}
      </a>
    );
  }
  return <span className={className} data-testid={`social-badge-${s.platform}`} title={title}>{inner}</span>;
}

export function SocialBadges({ socials, className }: { socials: Social[]; className?: string }) {
  if (!socials.length) return null;
  return <div className={cn("flex flex-wrap gap-1.5", className)}>{socials.map((s) => <SocialBadge key={s.platform} s={s} />)}</div>;
}
