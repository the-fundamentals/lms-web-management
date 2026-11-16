import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InvoiceList } from "./invoice-list";

const listInvoices = vi.hoisted(() => vi.fn());
const listClassroomMembers = vi.hoisted(() => vi.fn());
const fetchClassroomMoney = vi.hoisted(() => vi.fn());
const fetchInvoice = vi.hoisted(() => vi.fn());
const approveInvoice = vi.hoisted(() => vi.fn());
const cancelInvoice = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...rest }: { children?: ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/shared/api/classroom-members", () => ({
  classroomMembersQueryKey: ["classroom-members"],
  classroomMembersQueryOptions: (classroomId: string) => ({
    queryKey: ["classroom-members", classroomId],
    queryFn: () => listClassroomMembers(classroomId),
  }),
  listClassroomMembers: (...args: unknown[]) => listClassroomMembers(...args),
}));

vi.mock("../lib/payment-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/payment-api")>("../lib/payment-api");
  return {
    ...actual,
    listInvoices: (...args: unknown[]) => listInvoices(...args),
    fetchClassroomMoney: (...args: unknown[]) => fetchClassroomMoney(...args),
    fetchInvoice: (...args: unknown[]) => fetchInvoice(...args),
    approveInvoice: (...args: unknown[]) => approveInvoice(...args),
    cancelInvoice: (...args: unknown[]) => cancelInvoice(...args),
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
    listClassroomMembers.mockReset();
    fetchClassroomMoney.mockReset();
    fetchInvoice.mockReset();
    approveInvoice.mockReset();
    cancelInvoice.mockReset();
    listClassroomMembers.mockResolvedValue([]);
    fetchClassroomMoney.mockResolvedValue({
      id: "c1",
      basePaymentPlanAmount: 300000,
      basePaymentPlanType: "PER_SESSION",
    });
    fetchInvoice.mockResolvedValue({
      id: "inv1",
      classroomId: "c1",
      memberId: "m1",
      status: "DRAFT",
      type: "ADHOC",
      totalAmount: 1000,
      lines: [],
      createdDate: "2026-01-01T00:00:00Z",
      lastModifiedDate: "2026-01-01T00:00:00Z",
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
        lastModifiedDate: "2026-01-01T00:00:00Z",
      },
    ]);
    renderList();
    await waitFor(() => expect(screen.getByTestId("invoice-row-inv1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("invoice-open-inv1"));
    await waitFor(() => expect(screen.getByTestId("invoice-detail-sheet")).toBeTruthy());
    await waitFor(() => expect(screen.getByTestId("invoice-detail")).toBeTruthy());
  });

  it("draft row can approve from the row menu", async () => {
    listInvoices.mockResolvedValue([
      {
        id: "inv1",
        classroomId: "c1",
        memberId: "m1",
        status: "DRAFT",
        type: "ADHOC",
        totalAmount: 1000,
        lines: [],
        createdDate: "2026-01-01T00:00:00Z",
        lastModifiedDate: "2026-01-01T00:00:00Z",
      },
    ]);
    approveInvoice.mockResolvedValue({
      id: "inv1",
      classroomId: "c1",
      memberId: "m1",
      status: "APPROVED",
      type: "ADHOC",
      totalAmount: 1000,
      lines: [],
      createdDate: "2026-01-01T00:00:00Z",
      lastModifiedDate: "2026-01-01T00:00:00Z",
    });
    renderList();
    await waitFor(() => expect(screen.getByTestId("invoice-menu-inv1")).toBeTruthy());
    // Radix DropdownMenu opens on pointerdown in jsdom.
    fireEvent.pointerDown(screen.getByTestId("invoice-menu-inv1"), {
      button: 0,
      ctrlKey: false,
    });
    await waitFor(() => expect(screen.getByTestId("invoice-approve-inv1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("invoice-approve-inv1"));
    await waitFor(() => expect(approveInvoice).toHaveBeenCalledWith("c1", "inv1"));
  });

  it("row shows member name from shared members cache", async () => {
    listInvoices.mockResolvedValue([
      {
        id: "inv1",
        classroomId: "c1",
        memberId: "m1",
        status: "DRAFT",
        type: "ADHOC",
        totalAmount: 1000,
        lines: [],
        createdDate: "2026-01-01T00:00:00Z",
        lastModifiedDate: "2026-01-01T00:00:00Z",
      },
    ]);
    listClassroomMembers.mockResolvedValue([
      {
        id: "m1",
        classroomId: "c1",
        accountId: "a1",
        name: "Alice Dummy",
        email: "alice@x.com",
        role: "STUDENT",
        status: "ACTIVE",
      },
    ]);
    renderList();
    await waitFor(() =>
      expect(screen.getByTestId("invoice-row-inv1").textContent).toMatch(/Alice Dummy/),
    );
  });

  it("list view groups GENERATED by billingStart; table switch works", async () => {
    listInvoices.mockResolvedValue([
      {
        id: "inv1",
        classroomId: "c1",
        memberId: "m1",
        status: "DRAFT",
        type: "GENERATED",
        billingStart: "2026-10-01",
        billingEnd: "2026-11-01",
        totalAmount: 2100000,
        lines: [],
        createdDate: "2026-11-01T00:00:00Z",
        lastModifiedDate: "2026-11-01T00:00:00Z",
      },
      {
        id: "inv2",
        classroomId: "c1",
        memberId: "m1",
        status: "DRAFT",
        type: "ADHOC",
        totalAmount: 50000,
        lines: [],
        createdDate: "2026-11-15T00:00:00Z",
        lastModifiedDate: "2026-11-15T00:00:00Z",
      },
    ]);
    renderList();
    await waitFor(() => expect(screen.getByTestId("invoice-month-2026-10")).toBeTruthy());
    expect(screen.getByTestId("invoice-month-2026-11")).toBeTruthy();
    expect(screen.getByTestId("invoice-list").getAttribute("data-view")).toBe("list");
    expect(screen.getByTestId("invoice-billing-inv1").textContent).toMatch(
      /1 Oct 2026 – 1 Nov 2026/,
    );
    expect(screen.getByTestId("invoice-type-inv1").textContent).toMatch(/Generated/i);
    expect(screen.getByTestId("invoice-status-inv1").textContent).toMatch(/DRAFT/i);
    expect(screen.getByTestId("invoice-row-inv1").textContent).not.toMatch(
      /Automatically-generated|during month/i,
    );
    fireEvent.click(screen.getByTestId("invoices-view-table"));
    await waitFor(() =>
      expect(screen.getByTestId("invoice-list").getAttribute("data-view")).toBe("table"),
    );
  });
});
