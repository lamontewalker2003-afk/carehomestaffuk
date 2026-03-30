import { useState, useEffect, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JobCard } from "@/components/JobCard";
import { getJobs } from "@/lib/store";
import type { Job } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [socFilter, setSocFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    getJobs().then(allJobs => setJobs(allJobs.filter(j => j.isActive)));
  }, []);

  const locations = useMemo(() => [...new Set(jobs.map(j => j.location).filter(Boolean))], [jobs]);
  const socCodes = useMemo(() => [...new Set(jobs.map(j => j.socCode).filter(Boolean))], [jobs]);
  const types = useMemo(() => [...new Set(jobs.map(j => j.type).filter(Boolean))], [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      if (search) {
        const s = search.toLowerCase();
        const match = j.title.toLowerCase().includes(s) || j.location.toLowerCase().includes(s) ||
          j.socCode.toLowerCase().includes(s) || j.description.toLowerCase().includes(s);
        if (!match) return false;
      }
      if (socFilter !== "all" && j.socCode !== socFilter) return false;
      if (locationFilter !== "all" && j.location !== locationFilter) return false;
      if (typeFilter !== "all" && j.type !== typeFilter) return false;
      return true;
    });
  }, [jobs, search, socFilter, locationFilter, typeFilter]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="bg-hero py-12">
          <div className="container">
            <h1 className="font-heading text-3xl font-bold text-hero-foreground">Available Positions</h1>
            <p className="text-hero-foreground/70 mt-2">Find your next role in the UK care sector</p>
          </div>
        </div>

        <div className="container py-8">
          <div className="bg-card rounded-lg border p-4 mb-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search positions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={socFilter} onValueChange={setSocFilter}>
                <SelectTrigger><SelectValue placeholder="SOC Code" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SOC Codes</SelectItem>
                  {socCodes.map(s => <SelectItem key={s} value={s}>SOC {s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="Job Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No positions match your search criteria.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default JobsPage;
