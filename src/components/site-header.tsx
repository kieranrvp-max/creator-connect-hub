import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const linkCls = "text-sm text-muted-foreground hover:text-foreground transition-colors";
const activeCls = { className: "text-sm font-semibold text-foreground" };

export function SiteHeader() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/explore" className="font-display text-xl font-semibold">
          slot<span className="text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-4 overflow-x-auto">
          <Link to="/explore" className={linkCls} activeProps={activeCls}>Explore</Link>
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
