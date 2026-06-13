import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-text-secondary">
        {icon || <PackageOpen className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-medium text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-text-secondary max-w-sm">{description}</p>
      )}
      {action && (
        <Button className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
