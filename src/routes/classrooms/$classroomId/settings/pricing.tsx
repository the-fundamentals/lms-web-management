import { createFileRoute } from "@tanstack/react-router";
import { MoneyPricing } from "@/features/payment/components/money-pricing";

export const Route = createFileRoute("/classrooms/$classroomId/settings/pricing")({
  component: ClassroomSettingsPricingRoute,
});

function ClassroomSettingsPricingRoute() {
  const { classroomId } = Route.useParams();
  return <MoneyPricing classroomId={classroomId} />;
}
