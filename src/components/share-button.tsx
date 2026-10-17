import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Copies the absolute URL for `path` to the clipboard with a toast confirmation. */
export function ShareButton({ path, size = "sm", variant = "ghost", label }: { path: string; size?: "sm" | "icon"; variant?: "ghost" | "outline"; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  };
  return (
    <Button type="button" size={size} variant={variant} onClick={copy} aria-label="Copy link to this page" data-testid="share-btn">
      {copied ? <Check className="size-4 text-success" /> : <Share2 className="size-4" />}
      {label && <span className="ml-1">{copied ? "Copied" : label}</span>}
    </Button>
  );
}
