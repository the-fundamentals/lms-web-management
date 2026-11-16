import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useBlocker, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { classroomMembersQueryOptions } from "@/shared/api/classroom-members";
import { parseMoneyDigits } from "@/shared/lib/money";
import { RequestStatus, requestFailedMessage } from "@/shared/ui/request-status";
import type { ClassroomInvoiceLineKind } from "@/generated/types.gen";
import { activeStudents, createAdhocInvoice } from "../lib/payment-api";

type InvoiceCreateProps = {
  classroomId: string;
};

type LineDraft = {
  kind: ClassroomInvoiceLineKind;
  description: string;
  unitPrice: string;
  quantity: string;
};

const emptyLine = (): LineDraft => ({
  kind: "OTHER",
  description: "",
  unitPrice: "",
  quantity: "1",
});

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function InvoiceCreate({ classroomId }: InvoiceCreateProps) {
  const navigate = useNavigate();
  const membersQuery = useQuery(classroomMembersQueryOptions(classroomId));
  const students = useMemo(
    () => activeStudents(membersQuery.data ?? []),
    [membersQuery.data],
  );

  const [memberId, setMemberId] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);

  const dirty =
    Boolean(memberId) ||
    Boolean(note.trim()) ||
    lines.some((l) => l.description.trim() || l.unitPrice);

  useBlocker({
    shouldBlockFn: () => {
      if (!dirty || saving) return false;
      return !window.confirm("You have unsaved changes. Leave this page?");
    },
    enableBeforeUnload: dirty && !saving,
  });

  useEffect(() => {
    if (!memberId && students.length > 0) {
      setMemberId(students[0]!.id);
    }
  }, [memberId, students]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving || !memberId) return;
    const parsed = lines
      .map((line) => {
        const unitPrice = Number(parseMoneyDigits(line.unitPrice) || "0");
        const quantity = Number(line.quantity || "0");
        return {
          kind: line.kind,
          description: line.description.trim(),
          unitPrice,
          quantity,
        };
      })
      .filter((line) => line.description.length > 0 && line.quantity > 0);
    if (parsed.length < 1) {
      setFailure(new Error("Add at least one line with a description"));
      return;
    }
    setSaving(true);
    setFailure(null);
    try {
      const invoice = await createAdhocInvoice(classroomId, {
        memberId,
        ...(note.trim() ? { note: note.trim() } : {}),
        lines: parsed,
      });
      await navigate({
        to: "/classrooms/$classroomId/money/invoices/$invoiceId",
        params: { classroomId, invoiceId: invoice.id },
      });
    } catch (error) {
      setFailure(error);
      setSaving(false);
    }
  }

  return (
    <RequestStatus
      error={membersQuery.error}
      onRetry={() => {
        void membersQuery.refetch();
      }}
      status={
        membersQuery.isPending ? "pending" : membersQuery.isError ? "error" : "success"
      }
    >
      <form className="flex flex-col gap-8" data-testid="invoice-create" onSubmit={onSubmit}>
        <header className="flex flex-col gap-3">
          <Button asChild className="w-fit -ml-2" size="sm" variant="ghost">
            <Link
              params={{ classroomId }}
              to="/classrooms/$classroomId/money/invoices"
            >
              <ArrowLeft aria-hidden className="size-4" />
              Invoices
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <h2 className="type-section text-foreground">New invoice</h2>
            <p className="type-secondary text-muted-foreground">
              Adhoc draft for one student
            </p>
          </div>
        </header>

        <section className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invoice-student">Student</Label>
            <select
              className={selectClassName}
              data-testid="invoice-student"
              id="invoice-student"
              onChange={(e) => setMemberId(e.target.value)}
              value={memberId}
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="invoice-note">Note</Label>
            <Input
              data-testid="invoice-note"
              id="invoice-note"
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              value={note}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3" data-testid="invoice-lines">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">Lines</p>
              <p className="type-secondary text-muted-foreground">
                At least one line with a description.
              </p>
            </div>
            <Button
              data-testid="invoice-add-line"
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
              size="sm"
              type="button"
              variant="outline"
            >
              <Plus aria-hidden className="size-4" />
              Add line
            </Button>
          </div>

          <ul className="flex flex-col gap-3">
            {lines.map((line, index) => (
              <li
                className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/15 p-3 sm:p-4"
                data-testid={`invoice-line-${index}`}
                key={index}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="type-secondary text-muted-foreground">Line {index + 1}</p>
                  {lines.length > 1 ? (
                    <Button
                      aria-label={`Remove line ${index + 1}`}
                      onClick={() =>
                        setLines((prev) => prev.filter((_, i) => i !== index))
                      }
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-12">
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor={`invoice-line-kind-${index}`}>Kind</Label>
                    <select
                      className={selectClassName}
                      data-testid={`invoice-line-kind-${index}`}
                      id={`invoice-line-kind-${index}`}
                      onChange={(e) => {
                        const kind = e.target.value as ClassroomInvoiceLineKind;
                        setLines((prev) =>
                          prev.map((row, i) => (i === index ? { ...row, kind } : row)),
                        );
                      }}
                      value={line.kind}
                    >
                      <option value="LESSON">Lesson</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-5">
                    <Label htmlFor={`invoice-line-description-${index}`}>Description</Label>
                    <Input
                      data-testid={`invoice-line-description-${index}`}
                      id={`invoice-line-description-${index}`}
                      onChange={(e) => {
                        const description = e.target.value;
                        setLines((prev) =>
                          prev.map((row, i) =>
                            i === index ? { ...row, description } : row,
                          ),
                        );
                      }}
                      placeholder="What is this for?"
                      value={line.description}
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-3">
                    <Label htmlFor={`invoice-line-price-${index}`}>Unit price (VND)</Label>
                    <Input
                      data-testid={`invoice-line-price-${index}`}
                      id={`invoice-line-price-${index}`}
                      inputMode="numeric"
                      onChange={(e) => {
                        const unitPrice = parseMoneyDigits(e.target.value);
                        setLines((prev) =>
                          prev.map((row, i) =>
                            i === index ? { ...row, unitPrice } : row,
                          ),
                        );
                      }}
                      value={line.unitPrice}
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor={`invoice-line-qty-${index}`}>Qty</Label>
                    <Input
                      data-testid={`invoice-line-qty-${index}`}
                      id={`invoice-line-qty-${index}`}
                      inputMode="numeric"
                      onChange={(e) => {
                        const quantity = parseMoneyDigits(e.target.value);
                        setLines((prev) =>
                          prev.map((row, i) =>
                            i === index ? { ...row, quantity } : row,
                          ),
                        );
                      }}
                      value={line.quantity}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {failure ? (
          <Alert variant="destructive">
            <AlertDescription>{requestFailedMessage(failure)}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          <Button asChild type="button" variant="ghost">
            <Link
              params={{ classroomId }}
              to="/classrooms/$classroomId/money/invoices"
            >
              Cancel
            </Link>
          </Button>
          <Button data-testid="invoice-create-submit" disabled={saving} type="submit">
            {saving ? "Creating…" : "Create draft"}
          </Button>
        </div>
      </form>
    </RequestStatus>
  );
}
