import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const linkCls = "relative shrink-0 whitespace-nowrap text-sm hover:text-foreground transition-colors";
const inactiveCls = { className: "text-muted-foreground" };
const activeCls = { className: "shrink-0 whitespace-nowrap text-sm font-semibold text-foreground after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-brand-gradient" };

function NavLinks({ className, prefix }: { className: string; prefix: string }) {
  const { user, profile } = useAuth();
  const dashboardTo = profile?.user_type === "creator" ? "/dashboard/creator" : "/dashboard/sponsor";
  return (
    <nav className={className}>
      <Link to="/explore" className={linkCls} activeProps={activeCls} inactiveProps={inactiveCls} data-testid={`${prefix}-nav-explore`}>Explore</Link>
      <Link to="/how-it-works" className={linkCls} activeProps={activeCls} inactiveProps={inactiveCls} data-testid={`${prefix}-nav-how-it-works`}>How It Works</Link>
      {!user && (
        <>
          <Link to="/auth" search={{ role: "sponsor" }} className={linkCls} inactiveProps={inactiveCls} data-testid={`${prefix}-nav-brands`}>Brands</Link>
          <Link to="/auth" search={{ role: "creator" }} className={linkCls} inactiveProps={inactiveCls} data-testid={`${prefix}-nav-creators`}>Creators</Link>
        </>
      )}
      <Link to="/contact" className={linkCls} activeProps={activeCls} inactiveProps={inactiveCls} data-testid={`${prefix}-nav-contact`}>Contact</Link>
      {user && (
        <>
          <Link to={dashboardTo} className={linkCls} activeProps={activeCls} inactiveProps={inactiveCls} data-testid={`${prefix}-nav-dashboard`}>Dashboard</Link>
          <Link to="/account" className={linkCls} activeProps={activeCls} inactiveProps={inactiveCls} data-testid={`${prefix}-nav-account`}>Account</Link>
        </>
      )}
    </nav>
  );
}

export function SiteHeader() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="shrink-0 font-display text-xl font-semibold text-foreground" data-testid="header-logo">
          Creator Connect<span className="text-brand-gradient">.</span>
        </Link>
        <div className="flex items-center gap-5">
          <NavLinks className="hidden items-center gap-6 md:flex" prefix="desktop" />
          {!ready ? <span className="h-8 w-[74px] shrink-0" aria-hidden /> : (user ? (
            <Button variant="ghost" size="sm" className="shrink-0" data-testid="header-sign-out-btn" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>Sign out</Button>
          ) : (
            <Button asChild size="sm" className="shrink-0 rounded-full border-0 bg-brand-gradient px-4 text-white" data-testid="header-sign-in-btn"><Link to="/auth">Sign in</Link></Button>
          ))}
        </div>
      </div>
      <NavLinks className="flex items-center gap-5 overflow-x-auto border-t px-4 py-2.5 md:hidden" prefix="mobile" />
    </header>
  );
}
