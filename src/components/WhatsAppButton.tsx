import { useEffect, useState } from "react";
import { getSiteSettings } from "@/lib/store";

export function WhatsAppButton() {
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    getSiteSettings().then(s => {
      setNumber((s.whatsappNumber || "").replace(/[^\d]/g, ""));
      setMessage(s.whatsappMessage || "");
    });
    // Auto-tease the label after 3s, then hide
    const t1 = setTimeout(() => setShowLabel(true), 3000);
    const t2 = setTimeout(() => setShowLabel(false), 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!number) return null;

  const href = `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
      className="fixed bottom-5 right-5 z-50 group flex items-center gap-3"
    >
      {/* Floating label */}
      <span
        className={`hidden sm:inline-block whitespace-nowrap rounded-full bg-card text-card-foreground border shadow-lg px-4 py-2 text-sm font-medium transition-all duration-300 origin-right ${
          showLabel ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-90 translate-x-2 pointer-events-none"
        }`}
      >
        Chat with us on WhatsApp
      </span>

      {/* Animated pulse rings */}
      <span className="relative flex h-14 w-14">
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-40 animate-ping" style={{ animationDelay: "1s" }} />

        {/* Button */}
        <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl ring-4 ring-white/30 transition-transform group-hover:scale-110 group-active:scale-95">
          <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
            <path d="M19.11 17.34c-.29-.14-1.71-.84-1.97-.94-.27-.1-.46-.14-.66.14-.19.28-.75.94-.93 1.13-.17.19-.34.21-.63.07-.29-.14-1.21-.45-2.31-1.42-.85-.76-1.43-1.7-1.6-1.99-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.66-1.59-.9-2.18-.24-.57-.49-.49-.66-.5-.17-.01-.36-.01-.55-.01-.19 0-.5.07-.77.36-.27.28-1.02 1-1.02 2.43s1.05 2.83 1.2 3.02c.14.19 2.06 3.15 5 4.41.7.3 1.24.48 1.67.61.7.22 1.34.19 1.85.12.56-.08 1.71-.7 1.95-1.38.24-.68.24-1.27.17-1.39-.07-.12-.26-.19-.55-.33zM16.02 5.33c-5.9 0-10.7 4.79-10.7 10.69 0 1.89.49 3.74 1.43 5.36L5 26.67l5.41-1.42c1.56.85 3.32 1.3 5.11 1.3h.01c5.9 0 10.7-4.79 10.7-10.69 0-2.85-1.11-5.54-3.13-7.55-2.02-2.02-4.7-3.13-7.56-3.13zm0 19.45h-.01c-1.6 0-3.17-.43-4.54-1.24l-.32-.19-3.36.88.9-3.27-.21-.34c-.89-1.42-1.36-3.06-1.36-4.74 0-4.91 4-8.91 8.91-8.91 2.38 0 4.62.93 6.3 2.61 1.68 1.68 2.61 3.92 2.6 6.31 0 4.91-4 8.91-8.91 8.91z" />
          </svg>
        </span>
      </span>
    </a>
  );
}
