import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseMoneyDigits } from "@/shared/lib/money";
import { MoneyInput } from "@/shared/ui/money-input";
import { RequestStatus, requestFailedMessage } from "@/shared/ui/request-status";
import {
  classroomMoneyQueryKey,
  fetchClassroomMoney,
  listActiveStudents,
  listCurrentPaymentPlans,
  paymentPlansQueryKey,
  setClassroomPrice,
  setStudentPrice,
  type PaymentPlanRow,
} from "../lib/payment-api";
import { formatMoneyDigits } from "@/shared/lib/money";
import { formatVnd } from "../lib/vnd";

type MoneyPricingProps = {
  classroomId: string;
};

function parseWholeAmount(raw: string): number | null {
  const digits = parseMoneyDigits(raw);
  if (digits.length === 0) return 0;
  if (!/^\d+$/.test(digits)) return null;
  const amount = Number(digits);
  if (!Number.isSafeInteger(amount) || amount < 0) return null;
  return amount;
}

/** Prefer API `fromClassroomBase`; no plan → none. */
function studentPriceKind(plan: PaymentPlanRow | undefined): "none" | "default" | "custom" {
  if (!plan) return "none";
  if (plan.fromClassroomBase) return "default";
  return "custom";
}

/** Edit classroom default + student overrides under Settings. */
export function MoneyPricing({ classroomId }: MoneyPricingProps) {
  const moneyQuery = useQuery({
    queryKey: [...classroomMoneyQueryKey, classroomId],
    queryFn: () => fetchClassroomMoney(classroomId),
  });
  const plansQuery = useQuery({
    queryKey: [...paymentPlansQueryKey, classroomId],
    queryFn: () => listCurrentPaymentPlans(classroomId),
  });
  const studentsQuery = useQuery({
    queryKey: ["classroom-money-students", classroomId],
    queryFn: () => listActiveStudents(classroomId),
  });

  const pending =
    moneyQuery.isPending || plansQuery.isPending || studentsQuery.isPending;
  const error = moneyQuery.error ?? plansQuery.error ?? studentsQuery.error;
  const failed = moneyQuery.isError || plansQuery.isError || studentsQuery.isError;

  const plansByMember = useMemo(() => {
    const map = new Map<string, PaymentPlanRow>();
    for (const plan of plansQuery.data ?? []) {
      map.set(plan.classroomMemberId, plan);
    }
    return map;
  }, [plansQuery.data]);

  const [classroomDraft, setClassroomDraft] = useState<string | null>(null);
  const [classroomSaving, setClassroomSaving] = useState(false);
  const [classroomFailure, setClassroomFailure] = useState<unknown>(null);
  const [studentDrafts, setStudentDrafts] = useState<Record<string, string>>({});
  /** Members who clicked Set custom price while still on classroom base / no plan. */
  const [customizingIds, setCustomizingIds] = useState<Record<string, true>>({});
  const [studentSavingId, setStudentSavingId] = useState<string | null>(null);
  const [studentFailure, setStudentFailure] = useState<unknown>(null);

  const classroomAmount = moneyQuery.data?.basePaymentPlanAmount ?? 0;
  const classroomValue =
    classroomDraft ?? String(moneyQuery.data ? classroomAmount : "");
  const classroomPreview = parseWholeAmount(classroomValue) ?? classroomAmount;

  async function saveClassroomPrice() {
    const amount = parseWholeAmount(classroomValue);
    if (amount === null || classroomSaving) return;
    setClassroomSaving(true);
    setClassroomFailure(null);
    try {
      await setClassroomPrice(classroomId, amount);
      setClassroomDraft(null);
    } catch (err) {
      setClassroomFailure(err);
    } finally {
      setClassroomSaving(false);
    }
  }

  async function saveStudentPrice(memberId: string) {
    const raw = studentDrafts[memberId];
    if (raw === undefined || studentSavingId) return;
    const amount = parseWholeAmount(raw);
    if (amount === null) return;
    setStudentSavingId(memberId);
    setStudentFailure(null);
    try {
      await setStudentPrice(classroomId, memberId, amount);
      setStudentDrafts((prev) => {
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
      setCustomizingIds((prev) => {
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
    } catch (err) {
      setStudentFailure(err);
    } finally {
      setStudentSavingId(null);
    }
  }

  function beginCustomPrice(memberId: string, seedAmount: number) {
    setCustomizingIds((prev) => ({ ...prev, [memberId]: true }));
    setStudentDrafts((prev) => ({
      ...prev,
      [memberId]: String(seedAmount),
    }));
  }

  function cancelCustomPrice(memberId: string) {
    setCustomizingIds((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
    setStudentDrafts((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-5" data-testid="money-home">
      <header className="flex flex-col gap-1">
        <p className="font-medium text-foreground">Pricing</p>
        <p className="type-secondary text-muted-foreground max-w-xl">
          Classroom default, then per-student overrides when needed.
        </p>
      </header>

      <RequestStatus
        error={error}
        onRetry={() => {
          void moneyQuery.refetch();
          void plansQuery.refetch();
          void studentsQuery.refetch();
        }}
        status={pending ? "pending" : failed ? "error" : "success"}
      >
        <div className="flex flex-col gap-6" data-testid="money-pricing">
          <section
            className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5"
            data-testid="classroom-price"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">Classroom default</p>
                <p className="type-secondary text-muted-foreground">
                  Per session · whole VND · 0 is Free
                </p>
                <p
                  className="mt-3 type-page text-foreground tabular-nums"
                  data-testid="classroom-price-display"
                >
                  {formatVnd(classroomPreview)}
                  {classroomPreview > 0 ? (
                    <span className="type-secondary ml-1.5 text-muted-foreground">
                      / session
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex w-40 flex-col gap-1.5">
                  <Label htmlFor="classroom-price-amount">Amount (VND)</Label>
                  <Input
                    data-testid="classroom-price-amount"
                    id="classroom-price-amount"
                    inputMode="numeric"
                    onChange={(e) => setClassroomDraft(parseMoneyDigits(e.target.value))}
                    value={classroomValue}
                  />
                </div>
                <Button
                  data-testid="classroom-price-save"
                  disabled={classroomSaving}
                  onClick={() => void saveClassroomPrice()}
                  type="button"
                >
                  {classroomSaving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
            {classroomFailure ? (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {requestFailedMessage(classroomFailure)}
              </p>
            ) : null}
          </section>

          <section className="flex flex-col gap-3" data-testid="student-prices">
            <div>
              <p className="font-medium text-foreground">Student overrides</p>
              <p className="type-secondary text-muted-foreground">
                Followers of the classroom default stay in sync. Custom rates apply
                immediately.
              </p>
            </div>
            {(studentsQuery.data ?? []).length === 0 ? (
              <p
                className="rounded-xl border border-dashed border-border px-4 py-6 type-secondary text-muted-foreground"
                data-testid="student-prices-empty"
              >
                No active students yet.
              </p>
            ) : (
              <ul className="overflow-hidden rounded-xl border border-border divide-y divide-border">
                {(studentsQuery.data ?? []).map((student) => {
                  const plan = plansByMember.get(student.id);
                  const kind = studentPriceKind(plan);
                  const editing = Boolean(customizingIds[student.id]);
                  const draft = studentDrafts[student.id];
                  const seed =
                    kind === "custom"
                      ? (plan?.amount ?? 0)
                      : kind === "default"
                        ? (plan?.amount ?? classroomAmount)
                        : classroomAmount;
                  const value = draft ?? String(seed);

                  const kindBadge =
                    kind === "none" ? (
                      <Badge
                        data-testid={`student-price-kind-${student.id}`}
                        variant="outline"
                      >
                        No plan
                      </Badge>
                    ) : kind === "default" ? (
                      <Badge
                        data-testid={`student-price-kind-${student.id}`}
                        variant="secondary"
                      >
                        Matches default
                      </Badge>
                    ) : (
                      <Badge
                        data-testid={`student-price-kind-${student.id}`}
                        variant="default"
                      >
                        Custom
                      </Badge>
                    );

                  return (
                    <li
                      className="flex flex-col gap-3 bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      data-testid={`student-price-row-${student.id}`}
                      key={student.id}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{student.name}</p>
                        <p className="type-secondary truncate text-muted-foreground">
                          {student.email}
                        </p>
                      </div>

                      {editing ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <MoneyInput
                            aria-label={`Amount for ${student.name}`}
                            className="w-40"
                            data-testid={`student-price-amount-${student.id}`}
                            id={`student-price-${student.id}`}
                            onValueChange={(digits) =>
                              setStudentDrafts((prev) => ({
                                ...prev,
                                [student.id]: digits,
                              }))
                            }
                            value={value}
                          />
                          <Button
                            data-testid={`student-price-save-${student.id}`}
                            disabled={studentSavingId === student.id || draft === undefined}
                            onClick={() => void saveStudentPrice(student.id)}
                            type="button"
                          >
                            {studentSavingId === student.id ? "Saving…" : "Save"}
                          </Button>
                          <Button
                            data-testid={`student-price-cancel-${student.id}`}
                            onClick={() => cancelCustomPrice(student.id)}
                            type="button"
                            variant="ghost"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex shrink-0 items-center gap-2">
                          {kindBadge}
                          {kind === "custom" ? (
                            <span
                              className="tabular-nums text-foreground"
                              data-testid={`student-price-display-${student.id}`}
                            >
                              {formatMoneyDigits(String(seed))}
                              <span className="type-secondary ml-1 text-muted-foreground">
                                VND
                              </span>
                            </span>
                          ) : null}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-label={`Actions for ${student.name}`}
                                data-testid={`student-price-menu-${student.id}`}
                                size="icon-sm"
                                type="button"
                                variant="ghost"
                              >
                                <MoreHorizontal aria-hidden className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {kind === "custom" ? (
                                <DropdownMenuItem
                                  data-testid={`student-price-customize-${student.id}`}
                                  onSelect={() => beginCustomPrice(student.id, seed)}
                                >
                                  Update
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  data-testid={`student-price-customize-${student.id}`}
                                  onSelect={() => beginCustomPrice(student.id, seed)}
                                >
                                  Set custom price
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {studentFailure ? (
              <p className="text-sm text-destructive" role="alert">
                {requestFailedMessage(studentFailure)}
              </p>
            ) : null}
          </section>
        </div>
      </RequestStatus>
    </div>
  );
}
