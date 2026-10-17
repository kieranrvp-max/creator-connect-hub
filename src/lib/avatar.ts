import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Upload an avatar image for the user; returns the storage path to save on the profile. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

/** Resolve a stored avatar value (storage path or legacy https URL) to a displayable URL. */
export function useAvatarUrl(value: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(value?.startsWith("http") ? value : null);
  useEffect(() => {
    let alive = true;
    if (!value) { setUrl(null); return; }
    if (value.startsWith("http")) { setUrl(value); return; }
    supabase.storage.from("avatars").createSignedUrl(value, 60 * 60).then(({ data }) => {
      if (alive) setUrl(data?.signedUrl ?? null);
    });
    return () => { alive = false; };
  }, [value]);
  return url;
}
