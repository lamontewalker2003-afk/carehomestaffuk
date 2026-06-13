import { useEffect, useState } from "react";
import { getSiteSettings } from "@/lib/store";
import type { SiteSettings } from "@/lib/store";
import { Megaphone, X } from "lucide-react";

export function AnnouncementBar() {
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => { getSiteSettings().then(setSite); }, []);

  const a = site?.announcement;
  if (!a?.enabled || !a.message || dismissed) return null;

  const key = `chsuk:announce:${(a.message || "").slice(0, 80)}`;
  if (typeof window !== "undefined" && sessionStorage.getItem(key) === "1") return null;

  const variant = a.variant || "info";
  const bg =
    variant === "success" ? "bg-emerald-600 text-white" :
    variant === "warning" ? "bg-amber-500 text-amber-950" :
    "bg-primary text-primary-foreground";

  return (
    <div className={`${bg} relative`}>
      <div className="container py-2 text-sm flex items-center justify-center gap-3 text-center pr-10">
        <Megaphone className="h-4 w-4 shrink-0 hidden sm:inline" />
        <span className="font-medium">{a.message}</span>
        {a.link && a.ctaLabel && (
          <a href={a.link} className="underline font-semibold whitespace-nowrap hover:opacity-90">
            {a.ctaLabel} →
          </a>
        )}
      </div>
      <button
        aria-label="Dismiss"
        onClick={() => { sessionStorage.setItem(key, "1"); setDismissed(true); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
