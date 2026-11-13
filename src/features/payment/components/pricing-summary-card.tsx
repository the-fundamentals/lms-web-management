import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  classroomMoneyQueryKey,
  fetchClassroomMoney,
} from "../lib/payment-api";
import { formatVnd } from "../lib/vnd";

type PricingSummaryCardProps = {
  classroomId: string;
};

/** Compact read-only classroom default; gear opens the Pricing edit page. */
export function PricingSummaryCard({ classroomId }: PricingSummaryCardProps) {
  const query = useQuery({
    queryKey: [...classroomMoneyQueryKey, classroomId],
    queryFn: () => fetchClassroomMoney(classroomId),
  });

  const amount = query.data?.basePaymentPlanAmount;
  const label =
    query.isPending ? "…" : query.isError ? "—" : formatVnd(amount ?? 0);

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3"
      data-testid="pricing-summary-card"
    >
      <div className="min-w-0">
        <p className="type-secondary text-muted-foreground">Classroom default</p>
        <p className="type-body text-foreground" data-testid="pricing-summary-amount">
          {label === "Free" || label === "…" || label === "—" ? (
            label
          ) : (
            <>
              {label}
              <span className="type-secondary text-muted-foreground"> / session</span>
            </>
          )}
        </p>
      </div>
      <Button asChild size="icon" variant="outline">
        <Link
          aria-label="Edit pricing"
          data-testid="pricing-summary-edit"
          params={{ classroomId }}
          to="/classrooms/$classroomId/settings/pricing"
        >
          <Settings2 aria-hidden className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
