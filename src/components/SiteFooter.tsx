import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSiteSettings, defaultSiteSettings } from "@/lib/store";
import type { SiteSettings } from "@/lib/store";
import { Mail, Phone, MapPin } from "lucide-react";

export function SiteFooter() {
  const [site, setSite] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => { getSiteSettings().then(setSite); }, []);

  const baseName = (site.siteName || "CareHomeStaffUK").replace(/UK$/i, "");
  const hasUK = /UK$/i.test(site.siteName || "");

  return (
    <footer className="bg-hero text-hero-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-1 mb-4">
              <span className="font-heading text-xl font-bold text-hero-foreground">{baseName}</span>
              {hasUK && <span className="font-heading text-xl font-bold text-hero-accent">UK</span>}
            </Link>
            <p className="text-sm text-hero-foreground/70">{site.footerTagline}</p>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-hero-foreground/70">
              <li><Link to="/jobs" className="hover:text-hero-accent transition-colors">Browse Jobs</Link></li>
              <li><Link to="/apply" className="hover:text-hero-accent transition-colors">Apply Now</Link></li>
              <li><Link to="/visa-info" className="hover:text-hero-accent transition-colors">Visa Information</Link></li>
              <li><Link to="/about" className="hover:text-hero-accent transition-colors">About Us</Link></li>
              <li><Link to="/faq" className="hover:text-hero-accent transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Get in Touch</h4>
            <ul className="space-y-3 text-sm text-hero-foreground/70">
              {site.contactEmail && (
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0 text-hero-accent" />
                  <a href={`mailto:${site.contactEmail}`} className="hover:text-hero-accent break-all">{site.contactEmail}</a>
                </li>
              )}
              {site.contactPhone && (
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0 text-hero-accent" />
                  <a href={`tel:${site.contactPhone.replace(/[^\d+]/g, '')}`} className="hover:text-hero-accent">{site.contactPhone}</a>
                </li>
              )}
              {site.contactAddress && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-hero-accent" />
                  <span>{site.contactAddress}</span>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">SOC Codes We Recruit</h4>
            <ul className="space-y-2 text-sm text-hero-foreground/70">
              <li>6131 — Nursing Auxiliaries & Assistants</li>
              <li>6135 — Care Workers & Home Carers</li>
              <li>6136 — Senior Care Workers</li>
            </ul>
            <p className="text-xs text-hero-foreground/50 mt-4">{site.officeHours}</p>
          </div>
        </div>

        <div className="border-t border-hero-foreground/10 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-hero-foreground/50">
          <div className="text-center sm:text-left">
            <p>© {site.footerYear || new Date().getFullYear()} {site.footerCompanyName || site.siteName}. All rights reserved.</p>
            {site.footerExtraNote && <p className="mt-1 text-hero-foreground/40">{site.footerExtraNote}</p>}
          </div>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-hero-accent transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-hero-accent transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-hero-accent transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
