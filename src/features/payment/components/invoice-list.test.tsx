import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InvoiceList } from "./invoice-list";

const listInvoices = vi.hoisted(() => vi.fn());
const fetchClassroomMoney = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...rest }: { children?: ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => navigate,
}));

vi.mock("../lib/payment-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/payment-api")>("../lib/payment-api");
  return {
    ...actual,
    listInvoices: (...args: unknown[]) => listInvoices(...args),
    fetchClassroomMoney: (...args: unknown[]) => fetchClassroomMoney(...args),
  };
});

function renderList() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <InvoiceList classroomId="c1" />
    </QueryClientProvider>,
  );
}

describe("invoice list", () => {
  beforeEach(() => {
    listInvoices.mockReset();
    fetchClassroomMoney.mockReset();
    navigate.mockReset();
    fetchClassroomMoney.mockResolvedValue({
      id: "c1",
      basePaymentPlanAmount: 300000,
      basePaymentPlanType: "PER_SESSION",
    });
  });
  afterEach(() => cleanup());

  it("empty state shows New invoice and pricing summary", async () => {
    listInvoices.mockResolvedValue([]);
    renderList();
    await waitFor(() => expect(screen.getByTestId("invoice-list-empty")).toBeTruthy());
    expect(screen.getByTestId("new-invoice")).toBeTruthy();
    expect(screen.getByTestId("new-invoice-empty")).toBeTruthy();
    expect(screen.getByTestId("pricing-summary-card")).toBeTruthy();
    expect(screen.getByTestId("pricing-summary-edit")).toBeTruthy();
  });

  it("failed load is distinct from empty", async () => {
    listInvoices.mockRejectedValue(new Error("offline"));
    renderList();
    await waitFor(() => expect(screen.getByText(/offline|failed|retry/i)).toBeTruthy());
    expect(screen.queryByTestId("invoice-list-empty")).toBeNull();
  });

  it("no Generate control in the document", async () => {
    listInvoices.mockResolvedValue([]);
    renderList();
    await waitFor(() => expect(screen.getByTestId("invoice-list-section")).toBeTruthy());
    expect(screen.queryByRole("button", { name: /generate/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /generate/i })).toBeNull();
  });

  it("row opens detail", async () => {
    listInvoices.mockResolvedValue([
      {
        id: "inv1",
        classroomId: "c1",
        memberId: "m1m1m1m1-0000-0000-0000-000000000001",
        status: "DRAFT",
        type: "ADHOC",
        totalAmount: 1000,
        lines: [],
        createdDate: "2026-01-01T00:00:00Z",
      },
    ]);
    renderList();
    await waitFor(() => expect(screen.getByTestId("invoice-row-inv1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("invoice-row-inv1"));
    expect(navigate).toHaveBeenCalledWith({
      to: "/classrooms/$classroomId/money/invoices/$invoiceId",
      params: { classroomId: "c1", invoiceId: "inv1" },
    });
  });
});
