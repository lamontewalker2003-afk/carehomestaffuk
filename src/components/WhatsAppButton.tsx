import { useEffect, useState, ReactNode } from "react";
import { getSiteSettings } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const LS_KEY = "chsuk:user-whatsapp-uk";

/**
 * Validates a UK WhatsApp number. Accepts:
 *  - 07XXXXXXXXX (11 digits)
 *  - +447XXXXXXXXX / 00447XXXXXXXXX
 *  - 447XXXXXXXXX
 * Returns the international form (no +, no leading 0) e.g. 447123456789
 */
export function normaliseUkMobile(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  let n = digits;
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("0")) n = "44" + n.slice(1);
  if (n.startsWith("7") && n.length === 10) n = "44" + n;
  if (!n.startsWith("44")) return null;
  if (n.length !== 12 || n[2] !== "7") return null;
  return n;
}

export function getStoredUkMobile(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(LS_KEY);
  if (!stored) return null;
  return normaliseUkMobile(stored);
}

let openGateGlobal: ((onVerified: (uk: string) => void) => void) | null = null;

/**
 * Opens WhatsApp to the given business number, gating behind UK number verification.
 * Always opens the bare wa.me link — NEVER a pre-filled message.
 */
export function openWhatsAppGated(businessNumber: string) {
  const num = (businessNumber || "").replace(/[^\d]/g, "");
  if (!num) {
    toast({ title: "WhatsApp not configured", variant: "destructive" });
    return;
  }
  const open = () => window.open(`https://wa.me/${num}`, "_blank", "noopener,noreferrer");
  const verified = getStoredUkMobile();
  if (verified) { open(); return; }
  if (openGateGlobal) { openGateGlobal(() => open()); return; }
  // Fallback (gate not mounted yet) — open anyway
  open();
}

/** Wraps any clickable element to trigger the gated WhatsApp open. Hidden when admin disables WhatsApp globally. */
export function WhatsAppLink({ children, className }: { children: ReactNode; className?: string }) {
  const [num, setNum] = useState("");
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    getSiteSettings().then(s => {
      setNum((s.whatsappNumber || "").replace(/[^\d]/g, ""));
      setEnabled(s.whatsappEnabled !== false);
    });
  }, []);
  if (!num || !enabled) return null;
  return (
    <button type="button" className={className} onClick={(e) => { e.preventDefault(); openWhatsAppGated(num); }}>
      {children}
    </button>
  );
}

export function WhatsAppButton() {
  const [number, setNumber] = useState("");
  const [label, setLabel] = useState("Chat with us on WhatsApp");
  const [enabled, setEnabled] = useState(true);
  const [showLabel, setShowLabel] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [userPhone, setUserPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingCb, setPendingCb] = useState<((uk: string) => void) | null>(null);

  useEffect(() => {
    getSiteSettings().then(s => {
      setNumber((s.whatsappNumber || "").replace(/[^\d]/g, ""));
      if (s.whatsappLabel) setLabel(s.whatsappLabel);
      setEnabled(s.whatsappEnabled !== false);
    });
    // Register global gate opener so other components can use it
    openGateGlobal = (cb) => {
      setErrorMsg(""); setUserPhone(""); setPendingCb(() => cb); setGateOpen(true);
    };
    const t1 = setTimeout(() => setShowLabel(true), 3000);
    const t2 = setTimeout(() => setShowLabel(false), 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); openGateGlobal = null; };
  }, []);

  if (!number || !enabled) return null;

  const openWa = () => window.open(`https://wa.me/${number}`, "_blank", "noopener,noreferrer");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const stored = getStoredUkMobile();
    if (stored) { openWa(); return; }
    setErrorMsg(""); setUserPhone(""); setPendingCb(() => openWa); setGateOpen(true);
  };

  const handleSubmitGate = () => {
    const ok = normaliseUkMobile(userPhone);
    if (!ok) { setErrorMsg("Please enter a valid UK mobile number (e.g. 07123 456789 or +44 7123 456789)."); return; }
    localStorage.setItem(LS_KEY, ok);
    setGateOpen(false);
    toast({ title: "Opening WhatsApp…", description: `Verified UK number +${ok}` });
    pendingCb?.(ok);
    setPendingCb(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        onMouseEnter={() => setShowLabel(true)}
        onMouseLeave={() => setShowLabel(false)}
        className="fixed bottom-5 right-5 z-50 group flex items-center gap-3 bg-transparent border-0 p-0 cursor-pointer"
      >
        <span
          className={`hidden sm:inline-block whitespace-nowrap rounded-full bg-card text-card-foreground border shadow-lg px-4 py-2 text-sm font-medium transition-all duration-300 origin-right ${
            showLabel ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-90 translate-x-2 pointer-events-none"
          }`}
        >
          {label}
        </span>

        <span className="relative flex h-14 w-14">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-40 animate-ping" style={{ animationDelay: "1s" }} />
          <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl ring-4 ring-white/30 transition-transform group-hover:scale-110 group-active:scale-95">
            <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
              <path d="M19.11 17.34c-.29-.14-1.71-.84-1.97-.94-.27-.1-.46-.14-.66.14-.19.28-.75.94-.93 1.13-.17.19-.34.21-.63.07-.29-.14-1.21-.45-2.31-1.42-.85-.76-1.43-1.7-1.6-1.99-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.66-1.59-.9-2.18-.24-.57-.49-.49-.66-.5-.17-.01-.36-.01-.55-.01-.19 0-.5.07-.77.36-.27.28-1.02 1-1.02 2.43s1.05 2.83 1.2 3.02c.14.19 2.06 3.15 5 4.41.7.3 1.24.48 1.67.61.7.22 1.34.19 1.85.12.56-.08 1.71-.7 1.95-1.38.24-.68.24-1.27.17-1.39-.07-.12-.26-.19-.55-.33zM16.02 5.33c-5.9 0-10.7 4.79-10.7 10.69 0 1.89.49 3.74 1.43 5.36L5 26.67l5.41-1.42c1.56.85 3.32 1.3 5.11 1.3h.01c5.9 0 10.7-4.79 10.7-10.69 0-2.85-1.11-5.54-3.13-7.55-2.02-2.02-4.7-3.13-7.56-3.13zm0 19.45h-.01c-1.6 0-3.17-.43-4.54-1.24l-.32-.19-3.36.88.9-3.27-.21-.34c-.89-1.42-1.36-3.06-1.36-4.74 0-4.91 4-8.91 8.91-8.91 2.38 0 4.62.93 6.3 2.61 1.68 1.68 2.61 3.92 2.6 6.31 0 4.91-4 8.91-8.91 8.91z" />
            </svg>
          </span>
        </span>
      </button>

      <Dialog open={gateOpen} onOpenChange={(o) => { setGateOpen(o); if (!o) setPendingCb(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify your UK WhatsApp number</DialogTitle>
            <DialogDescription>
              To prevent spam, we only chat with applicants on UK numbers. Please enter your UK WhatsApp number to start a conversation. We save it only on this device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="uk-wa">UK mobile number</Label>
            <Input
              id="uk-wa"
              autoFocus
              inputMode="tel"
              placeholder="07123 456789 or +44 7123 456789"
              value={userPhone}
              onChange={(e) => { setUserPhone(e.target.value); setErrorMsg(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmitGate(); }}
            />
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            <p className="text-xs text-muted-foreground">Only UK mobile numbers (+44 7…) are accepted.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGateOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitGate} className="bg-[#25D366] hover:bg-[#1ebe5b] text-white">
              Verify & open WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
