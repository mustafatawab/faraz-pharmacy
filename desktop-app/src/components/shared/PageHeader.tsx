import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  back?: { label: string; onClick: () => void };
}

export default function PageHeader({ title, description, action, back }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          {back && (
            <Button variant="ghost" size="icon" onClick={back.onClick}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        </div>
        {description && <p className="text-sm text-text-secondary">{description}</p>}
      </div>
      {action && (
        <Button onClick={action.onClick} className="gap-2">
          <Plus className="h-4 w-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
}
