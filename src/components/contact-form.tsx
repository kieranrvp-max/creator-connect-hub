import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Instagram, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INSTAGRAM_URL, SUPPORT_EMAIL } from "@/lib/marketplace";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  message: z.string().trim().min(1, "Please write a message").max(2000),
});

export function ContactLinks() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button asChild variant="outline" className="flex-1"><a href={`mailto:${SUPPORT_EMAIL}`}><Mail className="mr-2 h-4 w-4" />{SUPPORT_EMAIL}</a></Button>
      <Button asChild variant="outline" className="flex-1"><a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"><Instagram className="mr-2 h-4 w-4" />@joincreatorconnect</a></Button>
    </div>
  );
}

export function ContactForm({ onSent }: { onSent?: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.from("contact_submissions").insert(parsed.data);
    setBusy(false);
    if (error) return toast.error("Couldn't send your message. Please try again.");
    toast.success("Thanks — your message has been sent!");
    setForm({ name: "", email: "", message: "" });
    onSent?.();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="c-name">Name</Label><Input id="c-name" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="c-email">Email</Label><Input id="c-email" type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="c-msg">Message</Label><Textarea id="c-msg" rows={5} maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
      <Button type="submit" disabled={busy} className="w-full rounded-full border-0 bg-brand-gradient text-white">{busy ? "Sending…" : "Send message"}</Button>
    </form>
  );
}
