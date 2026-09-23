"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuditFilterOptions } from "@/actions/audit.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Filter, RotateCcw } from "lucide-react";

interface AuditFilterBarProps {
  filterOptions: AuditFilterOptions;
}

export function AuditFilterBar({ filterOptions }: AuditFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [action, setAction] = useState(searchParams.get("action") || "ALL");
  const [entity, setEntity] = useState(searchParams.get("entity") || "ALL");
  const [actorId, setActorId] = useState(searchParams.get("actorId") || "ALL");
  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || "");
  const [toDate, setToDate] = useState(searchParams.get("toDate") || "");

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (action && action !== "ALL") params.set("action", action);
    if (entity && entity !== "ALL") params.set("entity", entity);
    if (actorId && actorId !== "ALL") params.set("actorId", actorId);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    params.set("page", "1");
    router.push(`/registrar/audit?${params.toString()}`);
  };

  const handleReset = () => {
    setAction("ALL");
    setEntity("ALL");
    setActorId("ALL");
    setFromDate("");
    setToDate("");
    router.push("/registrar/audit");
  };

  return (
    <form
      onSubmit={handleApply}
      className="p-3 bg-muted/20 border border-border rounded-sm space-y-3 text-xs"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* Action Type */}
        <div className="space-y-1">
          <Label htmlFor="audit-action" className="text-[11px] text-muted-foreground font-mono">
            Action Type
          </Label>
          <Select value={action} onValueChange={(v) => v && setAction(v)}>
            <SelectTrigger id="audit-action" className="h-8 text-xs bg-card">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Actions</SelectItem>
              {filterOptions.actions.map((act) => (
                <SelectItem key={act} value={act}>
                  {act}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity Type */}
        <div className="space-y-1">
          <Label htmlFor="audit-entity" className="text-[11px] text-muted-foreground font-mono">
            Target Entity
          </Label>
          <Select value={entity} onValueChange={(v) => v && setEntity(v)}>
            <SelectTrigger id="audit-entity" className="h-8 text-xs bg-card">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Entities</SelectItem>
              {filterOptions.entities.map((ent) => (
                <SelectItem key={ent} value={ent}>
                  {ent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actor */}
        <div className="space-y-1">
          <Label htmlFor="audit-actor" className="text-[11px] text-muted-foreground font-mono">
            Actor / Staff
          </Label>
          <Select value={actorId} onValueChange={(v) => v && setActorId(v)}>
            <SelectTrigger id="audit-actor" className="h-8 text-xs bg-card">
              <SelectValue placeholder="All Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Staff</SelectItem>
              {filterOptions.actors.map((usr) => (
                <SelectItem key={usr.id} value={usr.id}>
                  {usr.name} ({usr.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="space-y-1">
          <Label htmlFor="audit-from" className="text-[11px] text-muted-foreground font-mono">
            Timestamp From
          </Label>
          <Input
            id="audit-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-8 text-xs bg-card"
          />
        </div>

        {/* Date To */}
        <div className="space-y-1">
          <Label htmlFor="audit-to" className="text-[11px] text-muted-foreground font-mono">
            Timestamp To
          </Label>
          <Input
            id="audit-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-8 text-xs bg-card"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-border/40">
        <Button type="submit" size="sm" className="h-8 text-xs rounded-sm">
          <Filter className="size-3 mr-1" />
          Apply Filters
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="h-8 text-xs rounded-sm"
        >
          <RotateCcw className="size-3 mr-1" />
          Reset Filters
        </Button>
      </div>
    </form>
  );
}
