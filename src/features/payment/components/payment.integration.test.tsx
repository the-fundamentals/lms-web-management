import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MoneyPricing } from "./money-pricing";
import { InvoiceDetail } from "./invoice-detail";

const setClassroomBasePaymentPlan = vi.hoisted(() => vi.fn());
const getClassroomById = vi.hoisted(() => vi.fn());
const getAllClassroomPaymentPlans = vi.hoisted(() => vi.fn());
const getAllClassroomMembers = vi.hoisted(() => vi.fn());
const queryClassroomInvoices = vi.hoisted(() => vi.fn());
const createClassroomInvoiceAdhoc = vi.hoisted(() => vi.fn());
const getClassroomInvoiceById = vi.hoisted(() => vi.fn());
const approveClassroomInvoice = vi.hoisted(() => vi.fn());
const completeClassroomInvoice = vi.hoisted(() => vi.fn());
const cancelClassroomInvoice = vi.hoisted(() => vi.fn());
const createClassroomMemberPaymentPlan = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...rest }: { children?: ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => navigate,
  useBlocker: vi.fn(),
}));

vi.mock("@/generated/sdk.gen", () => ({
  setClassroomBasePaymentPlan: (...args: unknown[]) => setClassroomBasePaymentPlan(...args),
  getClassroomById: (...args: unknown[]) => getClassroomById(...args),
  getAllClassroomPaymentPlans: (...args: unknown[]) => getAllClassroomPaymentPlans(...args),
  getAllClassroomMembers: (...args: unknown[]) => getAllClassroomMembers(...args),
  queryClassroomInvoices: (...args: unknown[]) => queryClassroomInvoices(...args),
  createClassroomInvoiceAdhoc: (...args: unknown[]) => createClassroomInvoiceAdhoc(...args),
  getClassroomInvoiceById: (...args: unknown[]) => getClassroomInvoiceById(...args),
  approveClassroomInvoice: (...args: unknown[]) => approveClassroomInvoice(...args),
  completeClassroomInvoice: (...args: unknown[]) => completeClassroomInvoice(...args),
  cancelClassroomInvoice: (...args: unknown[]) => cancelClassroomInvoice(...args),
  createClassroomMemberPaymentPlan: (...args: unknown[]) =>
    createClassroomMemberPaymentPlan(...args),
  generateClassroomInvoices: vi.fn(),
}));

vi.mock("@/shared/api/query-client", () => ({
  queryClient: { invalidateQueries: vi.fn(async () => undefined) },
}));

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe("payment integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllClassroomPaymentPlans.mockResolvedValue({ data: [] });
    getAllClassroomMembers.mockResolvedValue({ data: [] });
    queryClassroomInvoices.mockResolvedValue({ data: [] });
  });
  afterEach(() => cleanup());

  it("set classroom price then reload shows amount", async () => {
    getClassroomById
      .mockResolvedValueOnce({
        data: {
          id: "c1",
          basePaymentPlanAmount: 0,
          basePaymentPlanType: "PER_SESSION",
        },
      })
      .mockResolvedValue({
        data: {
          id: "c1",
          basePaymentPlanAmount: 150000,
          basePaymentPlanType: "PER_SESSION",
        },
      });
    setClassroomBasePaymentPlan.mockResolvedValue({
      data: {
        id: "c1",
        basePaymentPlanAmount: 150000,
        basePaymentPlanType: "PER_SESSION",
      },
    });
    render(
      <QueryClientProvider client={client()}>
        <MoneyPricing classroomId="c1" />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("classroom-price-amount")).toBeTruthy());
    fireEvent.change(screen.getByTestId("classroom-price-amount"), {
      target: { value: "150000" },
    });
    fireEvent.click(screen.getByTestId("classroom-price-save"));
    await waitFor(() => expect(setClassroomBasePaymentPlan).toHaveBeenCalled());
    expect(document.body.textContent).not.toMatch(/Bearer |eyJ|access_token/i);
  });

  it("approve then complete reaches COMPLETED", async () => {
    getClassroomInvoiceById
      .mockResolvedValueOnce({
        data: {
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
          lastModifiedDate: "2026-01-01T00:00:00Z",
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: "inv1",
          classroomId: "c1",
          memberId: "m1",
          status: "APPROVED",
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
          lastModifiedDate: "2026-01-01T00:00:00Z",
        },
      })
      .mockResolvedValue({
        data: {
          id: "inv1",
          classroomId: "c1",
          memberId: "m1",
          status: "COMPLETED",
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
          lastModifiedDate: "2026-01-01T00:00:00Z",
        },
      });
    getAllClassroomMembers.mockResolvedValue({
      data: [
        {
          id: "m1",
          classroomId: "c1",
          accountId: "a1",
          name: "Ann",
          email: "a@x.com",
          role: "STUDENT",
          status: "ACTIVE",
          createdDate: "2026-01-01T00:00:00Z",
          lastModifiedDate: "2026-01-01T00:00:00Z",
        },
      ],
    });
    approveClassroomInvoice.mockResolvedValue({
      data: {
        id: "inv1",
        classroomId: "c1",
        memberId: "m1",
        status: "APPROVED",
        type: "ADHOC",
        totalAmount: 1000,
        lines: [],
        createdDate: "2026-01-01T00:00:00Z",
        lastModifiedDate: "2026-01-01T00:00:00Z",
      },
    });
    completeClassroomInvoice.mockResolvedValue({
      data: {
        id: "inv1",
        classroomId: "c1",
        memberId: "m1",
        status: "COMPLETED",
        type: "ADHOC",
        totalAmount: 1000,
        lines: [],
        createdDate: "2026-01-01T00:00:00Z",
        lastModifiedDate: "2026-01-01T00:00:00Z",
      },
    });

    const qc = client();
    const { rerender } = render(
      <QueryClientProvider client={qc}>
        <InvoiceDetail classroomId="c1" invoiceId="inv1" />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("invoice-approve")).toBeTruthy());
    fireEvent.click(screen.getByTestId("invoice-approve"));
    await waitFor(() => expect(approveClassroomInvoice).toHaveBeenCalled());
    rerender(
      <QueryClientProvider client={qc}>
        <InvoiceDetail classroomId="c1" invoiceId="inv1" />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("invoice-mark-paid")).toBeTruthy());
    fireEvent.click(screen.getByTestId("invoice-mark-paid"));
    await waitFor(() => expect(completeClassroomInvoice).toHaveBeenCalled());
    expect(document.body.textContent).not.toMatch(/Bearer |eyJ|access_token/i);
  });
});
