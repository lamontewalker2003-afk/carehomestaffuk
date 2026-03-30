import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";

const COOKIE_KEY = "chsuk_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = (level: "all" | "essential") => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ level, date: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-fade-in">
      <div className="max-w-3xl mx-auto bg-card border rounded-lg shadow-lg p-5">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-sm mb-1">Cookie Notice</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to ensure our website functions correctly and to improve your experience. 
              In accordance with the UK GDPR and the Privacy and Electronic Communications Regulations (PECR), 
              we require your consent before setting non-essential cookies.
            </p>

            {showDetails && (
              <div className="mt-3 space-y-2 text-xs text-muted-foreground border-t pt-3">
                <div>
                  <strong className="text-foreground">Essential Cookies:</strong> Required for the website to function. These cannot be disabled. 
                  They include session management and security cookies.
                </div>
                <div>
                  <strong className="text-foreground">Analytics Cookies:</strong> Help us understand how visitors interact with our website, 
                  allowing us to improve our services. Data is anonymised.
                </div>
                <p className="text-xs">
                  For full details, see our{" "}
                  <Link to="/privacy-policy" className="text-primary underline">Privacy Policy</Link> and{" "}
                  <Link to="/terms" className="text-primary underline">Terms of Service</Link>.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Button size="sm" onClick={() => accept("all")} className="bg-primary text-primary-foreground text-xs h-8">
                Accept All
              </Button>
              <Button size="sm" variant="outline" onClick={() => accept("essential")} className="text-xs h-8">
                Essential Only
              </Button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-primary underline hover:no-underline ml-1"
              >
                {showDetails ? "Hide details" : "Cookie details"}
              </button>
            </div>
          </div>
          <button onClick={() => setVisible(false)} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
