import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContactForm, ContactLinks } from "@/components/contact-form";
import { INSTAGRAM_URL, SUPPORT_EMAIL } from "@/lib/marketplace";

export function SiteFooter() {
  const [open, setOpen] = useState(false);
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span className="font-display text-base text-foreground">Creator Connect<span className="text-brand-gradient">.</span></span>
        <nav className="flex flex-wrap items-center gap-5">
          <Link to="/explore" className="hover:text-foreground">Explore</Link>
          <Link to="/how-it-works" className="hover:text-foreground">How it works</Link>
          <Link to="/contact" className="hover:text-foreground">Contact us</Link>
          <button type="button" onClick={() => setOpen(true)} className="hover:text-foreground">Quick message</button>
          <a href={`mailto:${SUPPORT_EMAIL}`} aria-label="Email support" className="hover:text-foreground"><Mail className="h-4 w-4" /></a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram @joincreatorconnect" className="hover:text-foreground"><Instagram className="h-4 w-4" /></a>
        </nav>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Contact us</DialogTitle></DialogHeader>
          <ContactLinks />
          <ContactForm onSent={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </footer>
  );
}
