import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InvoiceDetail } from "./invoice-detail";

const fetchInvoice = vi.hoisted(() => vi.fn());
const listActiveStudents = vi.hoisted(() => vi.fn());
const approveInvoice = vi.hoisted(() => vi.fn());
const completeInvoice = vi.hoisted(() => vi.fn());
const cancelInvoice = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...rest }: { children?: ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("../lib/payment-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/payment-api")>("../lib/payment-api");
  return {
    ...actual,
    fetchInvoice: (...args: unknown[]) => fetchInvoice(...args),
    listActiveStudents: (...args: unknown[]) => listActiveStudents(...args),
    approveInvoice: (...args: unknown[]) => approveInvoice(...args),
    completeInvoice: (...args: unknown[]) => completeInvoice(...args),
    cancelInvoice: (...args: unknown[]) => cancelInvoice(...args),
  };
});

function draftInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: "inv1",
    classroomId: "c1",
    memberId: "m1",
    status: "DRAFT",
    type: "ADHOC",
    totalAmount: 1000,
    lines: [
      {
        id: "l1",
        kind: "OTHER",
        description: "Fee",
        unitPrice: 1000,
        quantity: 1,
        finalAmount: 1000,
        createdDate: "2026-01-01T00:00:00Z",
        lastModifiedDate: "2026-01-01T00:00:00Z",
      },
    ],
    createdDate: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function renderDetail() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <InvoiceDetail classroomId="c1" invoiceId="inv1" />
    </QueryClientProvider>,
  );
}

describe("invoice detail", () => {
  beforeEach(() => {
    fetchInvoice.mockReset();
    listActiveStudents.mockReset();
    approveInvoice.mockReset();
    completeInvoice.mockReset();
    cancelInvoice.mockReset();
    listActiveStudents.mockResolvedValue([
      {
        id: "m1",
        accountId: "a1",
        name: "Ann",
        email: "a@x.com",
        role: "STUDENT",
        status: "ACTIVE",
      },
    ]);
  });
  afterEach(() => cleanup());

  it("approves a draft", async () => {
    fetchInvoice.mockResolvedValue(draftInvoice());
    approveInvoice.mockResolvedValue(draftInvoice({ status: "APPROVED" }));
    renderDetail();
    await waitFor(() => expect(screen.getByTestId("invoice-approve")).toBeTruthy());
    fireEvent.click(screen.getByTestId("invoice-approve"));
    await waitFor(() => expect(approveInvoice).toHaveBeenCalledWith("c1", "inv1"));
  });

  it("marks paid with method", async () => {
    fetchInvoice.mockResolvedValue(draftInvoice({ status: "APPROVED" }));
    completeInvoice.mockResolvedValue(draftInvoice({ status: "COMPLETED" }));
    renderDetail();
    await waitFor(() => expect(screen.getByTestId("invoice-mark-paid")).toBeTruthy());
    fireEvent.change(screen.getByTestId("invoice-payment-method"), {
      target: { value: "CASH" },
    });
    fireEvent.click(screen.getByTestId("invoice-mark-paid"));
    await waitFor(() =>
      expect(completeInvoice).toHaveBeenCalledWith("c1", "inv1", {
        paidAmount: 1000,
        paymentMethod: "CASH",
      }),
    );
  });

  it("cancel confirmation names the invoice student", async () => {
    fetchInvoice.mockResolvedValue(draftInvoice());
    renderDetail();
    await waitFor(() => expect(screen.getByTestId("invoice-cancel")).toBeTruthy());
    fireEvent.click(screen.getByTestId("invoice-cancel"));
    await waitFor(() => expect(screen.getByTestId("invoice-cancel-confirm")).toBeTruthy());
    expect(screen.getByTestId("invoice-cancel-confirm").textContent).toMatch(/Ann/i);
  });

  it("COMPLETED hides actions", async () => {
    fetchInvoice.mockResolvedValue(draftInvoice({ status: "COMPLETED" }));
    renderDetail();
    await waitFor(() => expect(screen.getByTestId("invoice-readonly")).toBeTruthy());
    expect(screen.queryByTestId("invoice-approve")).toBeNull();
    expect(screen.queryByTestId("invoice-mark-paid")).toBeNull();
    expect(screen.queryByTestId("invoice-cancel")).toBeNull();
  });
});
