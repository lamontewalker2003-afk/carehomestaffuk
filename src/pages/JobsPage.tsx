import { useState, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JobCard } from "@/components/JobCard";
import { getJobs } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Filter } from "lucide-react";

const SOC_OPTIONS = [
  { value: "", label: "All SOC Codes" },
  { value: "6131", label: "6131 — Nursing Auxiliaries & Assistants" },
  { value: "6135", label: "6135 — Care Workers & Home Carers" },
  { value: "6136", label: "6136 — Senior Care Workers" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All Job Types" },
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Night Shift", label: "Night Shift" },
  { value: "Bank/Agency", label: "Bank/Agency" },
];

const JobsPage = () => {
  const allJobs = getJobs().filter(j => j.isActive);
  const [search, setSearch] = useState("");
  const [socFilter, setSocFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const locations = useMemo(() => {
    const locs = [...new Set(allJobs.map(j => j.location).filter(Boolean))];
    return locs.sort();
  }, [allJobs]);

  const [locationFilter, setLocationFilter] = useState("");

  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      const matchSearch = !search || 
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.location.toLowerCase().includes(search.toLowerCase()) ||
        job.description.toLowerCase().includes(search.toLowerCase()) ||
        job.socCode.includes(search);
      const matchSoc = !socFilter || job.socCode === socFilter;
      const matchType = !typeFilter || job.type === typeFilter;
      const matchLocation = !locationFilter || job.location === locationFilter;
      return matchSearch && matchSoc && matchType && matchLocation;
    });
  }, [allJobs, search, socFilter, typeFilter, locationFilter]);

  const clearFilters = () => {
    setSearch("");
    setSocFilter("");
    setTypeFilter("");
    setLocationFilter("");
  };

  const hasFilters = search || socFilter || typeFilter || locationFilter;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="bg-hero py-12">
          <div className="container">
            <h1 className="font-heading text-3xl font-bold text-hero-foreground">Available Positions</h1>
            <p className="text-hero-foreground/70 mt-2">Browse our current care home vacancies across the UK — visa sponsorship available</p>
          </div>
        </div>

        <div className="container py-8">
          {/* Search & Filters */}
          <div className="bg-card border rounded-lg p-4 mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by job title, location, SOC code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  value={socFilter}
                  onChange={e => setSocFilter(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {SOC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Locations</option>
                  {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {hasFilters && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{filteredJobs.length} position{filteredJobs.length !== 1 ? "s" : ""} found</span>
                <button onClick={clearFilters} className="text-primary hover:underline text-sm font-medium">
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {filteredJobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {hasFilters ? "No positions match your filters. Try adjusting your search criteria." : "No positions available at the moment. Please check back later."}
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default JobsPage;
