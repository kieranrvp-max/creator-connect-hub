import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const linkCls = "shrink-0 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground transition-colors";
const activeCls = { className: "shrink-0 whitespace-nowrap text-sm font-semibold text-foreground" };

function NavLinks({ className }: { className: string }) {
  const { user } = useAuth();
  return (
    <div className={className}>
      <Link to="/explore" className={linkCls} activeProps={activeCls}>Explore</Link>
      <Link to="/how-it-works" className={linkCls} activeProps={activeCls}>How it works</Link>
      <Link to="/dashboard/creator" className={linkCls} activeProps={activeCls}>Creator</Link>
      <Link to="/dashboard/sponsor" className={linkCls} activeProps={activeCls}>Sponsor</Link>
      {user && <Link to="/account" className={linkCls} activeProps={activeCls}>Account</Link>}
    </div>
  );
}

export function SiteHeader() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/explore" className="shrink-0 font-display text-xl font-semibold">
          Creator Connect<span className="text-primary">.</span>
        </Link>
        <div className="flex items-center gap-4">
          <NavLinks className="hidden items-center gap-5 sm:flex" />
          {ready && (user ? (
            <Button variant="ghost" size="sm" className="shrink-0" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/explore" }); }}>Sign out</Button>
          ) : (
            <Button asChild size="sm" className="shrink-0"><Link to="/auth">Sign in</Link></Button>
          ))}
        </div>
      </div>
      {/* On phones the links get their own scrollable row so Sign in stays visible */}
      <NavLinks className="flex items-center gap-4 overflow-x-auto border-t px-4 py-2 sm:hidden" />
    </header>
  );
}
