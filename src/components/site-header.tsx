import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const linkCls = "shrink-0 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground transition-colors";
const activeCls = { className: "shrink-0 whitespace-nowrap text-sm font-semibold text-foreground" };

export function SiteHeader() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/explore" className="shrink-0 font-display text-xl font-semibold">
          Creator Connect<span className="text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-3 overflow-x-auto sm:gap-5">
          <Link to="/explore" className={linkCls} activeProps={activeCls}>Explore</Link>
          <Link to="/how-it-works" className={linkCls} activeProps={activeCls}>How it works</Link>
          <Link to="/dashboard/creator" className={linkCls} activeProps={activeCls}>Creator</Link>
          <Link to="/dashboard/sponsor" className={linkCls} activeProps={activeCls}>Sponsor</Link>
          {user && <Link to="/account" className={linkCls} activeProps={activeCls}>Account</Link>}
          {ready && (user ? (
            <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/explore" }); }}>Sign out</Button>
          ) : (
            <Button asChild size="sm"><Link to="/auth">Sign in</Link></Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
