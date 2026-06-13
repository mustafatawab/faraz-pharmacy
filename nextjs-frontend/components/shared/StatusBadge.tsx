import { Badge } from "@/components/ui/badge";
import type { SaleStatus, ArrearStatus, ProductStatus } from "@/types";
import { cn } from "@/lib/utils";

type StatusType = SaleStatus | ArrearStatus | ProductStatus | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" | "outline"; pulse?: boolean }> = {
  "paid": { label: "Paid", variant: "success" },
  "partial": { label: "Partial", variant: "warning" },
  "pending": { label: "Pending", variant: "warning" },
  "settled": { label: "Settled", variant: "success" },
  "in-stock": { label: "In Stock", variant: "success" },
  "low-stock": { label: "Low Stock", variant: "warning", pulse: true },
  "expired": { label: "Expired", variant: "danger" },
  "expiring-soon": { label: "Expiring Soon", variant: "warning" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: "outline" as const };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        config.pulse && "animate-pulse",
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
