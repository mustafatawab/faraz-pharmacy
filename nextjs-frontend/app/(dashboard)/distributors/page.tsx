"use client";

import { useQuery } from "@tanstack/react-query";
import { Factory, Phone, Package, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useState } from "react";
import type { Distributor } from "@/types";

export default function DistributorsPage() {
  const [search, setSearch] = useState("");
  const { data: distributors = [], isLoading } = useQuery({
    queryKey: ["distributors"],
    queryFn: api.distributors.list,
  });

  const filtered = distributors.filter((d: Distributor) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.contact.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Distributors" subtitle="Manage your supplier network" />
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
        <Input placeholder="Search distributors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : filtered.map((dist: Distributor) => (
              <Card key={dist.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Factory className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-text-primary truncate">{dist.name}</h3>
                      <p className="text-xs text-text-secondary mt-0.5">{dist.contact}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-text-secondary"><Phone className="h-3 w-3" />{dist.phone}</div>
                        <div className="flex items-center gap-1 text-xs text-text-secondary"><Package className="h-3 w-3" />{dist.productCount ?? 0} products</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">Edit</Button>
                  </div>
                </CardContent>
              </Card>
            ))
        }
      </div>
    </div>
  );
}
