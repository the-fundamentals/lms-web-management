import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MoneyPricing } from "./money-pricing";

const fetchClassroomMoney = vi.hoisted(() => vi.fn());
const listCurrentPaymentPlans = vi.hoisted(() => vi.fn());
const listActiveStudents = vi.hoisted(() => vi.fn());
const setClassroomPrice = vi.hoisted(() => vi.fn());
const setStudentPrice = vi.hoisted(() => vi.fn());
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
    fetchClassroomMoney: (...args: unknown[]) => fetchClassroomMoney(...args),
    listCurrentPaymentPlans: (...args: unknown[]) => listCurrentPaymentPlans(...args),
    listActiveStudents: (...args: unknown[]) => listActiveStudents(...args),
    setClassroomPrice: (...args: unknown[]) => setClassroomPrice(...args),
    setStudentPrice: (...args: unknown[]) => setStudentPrice(...args),
  };
});

function renderPricing() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MoneyPricing classroomId="c1" />
    </QueryClientProvider>,
  );
}

describe("money pricing page", () => {
  beforeEach(() => {
    fetchClassroomMoney.mockReset();
    listCurrentPaymentPlans.mockReset();
    listActiveStudents.mockReset();
    setClassroomPrice.mockReset();
    setStudentPrice.mockReset();
  });
  afterEach(() => cleanup());

  it("saves classroom price and shows Free for 0", async () => {
    fetchClassroomMoney.mockResolvedValue({
      id: "c1",
      basePaymentPlanAmount: 0,
      basePaymentPlanType: "PER_SESSION",
    });
    listCurrentPaymentPlans.mockResolvedValue([]);
    listActiveStudents.mockResolvedValue([]);
    setClassroomPrice.mockResolvedValue({
      id: "c1",
      basePaymentPlanAmount: 0,
      basePaymentPlanType: "PER_SESSION",
    });
    renderPricing();
    await waitFor(() => expect(screen.getByTestId("classroom-price-amount")).toBeTruthy());
    expect(screen.getByTestId("classroom-price-display").textContent).toContain("Free");
    fireEvent.click(screen.getByTestId("classroom-price-save"));
    await waitFor(() => expect(setClassroomPrice).toHaveBeenCalledWith("c1", 0));
  });

  it("fromClassroomBase shows Set custom price; save creates override", async () => {
    fetchClassroomMoney.mockResolvedValue({
      id: "c1",
      basePaymentPlanAmount: 100000,
      basePaymentPlanType: "PER_SESSION",
    });
    listCurrentPaymentPlans.mockResolvedValue([
      {
        id: "p1",
        classroomMemberId: "m1",
        amount: 100000,
        type: "PER_SESSION",
        effectiveFrom: "2026-01-01",
        fromClassroomBase: true,
      },
    ]);
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
    setStudentPrice.mockResolvedValue({
      id: "p2",
      classroomMemberId: "m1",
      amount: 50000,
      type: "PER_SESSION",
      effectiveFrom: "2026-01-01",
      fromClassroomBase: false,
    });
    renderPricing();
    await waitFor(() => expect(screen.getByTestId("student-price-menu-m1")).toBeTruthy());
    expect(screen.queryByTestId("student-price-amount-m1")).toBeNull();
    // Radix DropdownMenu opens on pointerdown in jsdom.
    fireEvent.pointerDown(
      screen.getByTestId("student-price-menu-m1"),
      { button: 0, ctrlKey: false },
    );
    await waitFor(() => expect(screen.getByTestId("student-price-customize-m1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("student-price-customize-m1"));
    await waitFor(() => expect(screen.getByTestId("student-price-amount-m1")).toBeTruthy());
    expect(screen.queryByTestId("student-price-kind-m1")).toBeNull();
    expect(screen.getByText("VND")).toBeTruthy();
    expect((screen.getByTestId("student-price-amount-m1") as HTMLInputElement).value).toBe(
      "100,000",
    );
    expect(screen.queryByLabelText(/start/i)).toBeNull();
    fireEvent.change(screen.getByTestId("student-price-amount-m1"), {
      target: { value: "50000" },
    });
    expect((screen.getByTestId("student-price-amount-m1") as HTMLInputElement).value).toBe(
      "50,000",
    );
    fireEvent.click(screen.getByTestId("student-price-save-m1"));
    await waitFor(() => expect(setStudentPrice).toHaveBeenCalledWith("c1", "m1", 50000));
  });

  it("failed load uses shared error screen but keeps page chrome", async () => {
    fetchClassroomMoney.mockRejectedValue(new Error("boom"));
    listCurrentPaymentPlans.mockResolvedValue([]);
    listActiveStudents.mockResolvedValue([]);
    renderPricing();
    await waitFor(() => expect(screen.getByText(/boom|failed|retry/i)).toBeTruthy());
    expect(screen.getByTestId("money-home")).toBeTruthy();
    expect(screen.queryByTestId("money-pricing")).toBeNull();
  });

  it("empty students still shows classroom price", async () => {
    fetchClassroomMoney.mockResolvedValue({
      id: "c1",
      basePaymentPlanAmount: 2000,
      basePaymentPlanType: "PER_SESSION",
    });
    listCurrentPaymentPlans.mockResolvedValue([]);
    listActiveStudents.mockResolvedValue([]);
    renderPricing();
    await waitFor(() => expect(screen.getByTestId("classroom-price")).toBeTruthy());
    expect(screen.getByTestId("money-pricing")).toBeTruthy();
    expect(screen.getByTestId("student-prices-empty")).toBeTruthy();
  });

  it("pricing edit page has no invoice list; badges use fromClassroomBase", async () => {
    fetchClassroomMoney.mockResolvedValue({
      id: "c1",
      basePaymentPlanAmount: 300000,
      basePaymentPlanType: "PER_SESSION",
    });
    listCurrentPaymentPlans.mockResolvedValue([
      {
        id: "p1",
        classroomMemberId: "m1",
        amount: 150000,
        type: "PER_SESSION",
        effectiveFrom: "2026-01-01",
        fromClassroomBase: false,
      },
      {
        id: "p2",
        classroomMemberId: "m3",
        amount: 300000,
        type: "PER_SESSION",
        effectiveFrom: "2026-01-01",
        fromClassroomBase: true,
      },
    ]);
    listActiveStudents.mockResolvedValue([
      {
        id: "m1",
        accountId: "a1",
        name: "Ann",
        email: "a@x.com",
        role: "STUDENT",
        status: "ACTIVE",
      },
      {
        id: "m2",
        accountId: "a2",
        name: "Bob",
        email: "b@x.com",
        role: "STUDENT",
        status: "ACTIVE",
      },
      {
        id: "m3",
        accountId: "a3",
        name: "Cara",
        email: "c@x.com",
        role: "STUDENT",
        status: "ACTIVE",
      },
    ]);
    renderPricing();
    await waitFor(() => expect(screen.getByTestId("money-pricing")).toBeTruthy());
    expect(screen.queryByTestId("invoice-list-section")).toBeNull();
    expect(screen.getByTestId("student-price-kind-m1").textContent).toMatch(/Custom/i);
    expect(screen.getByTestId("student-price-display-m1").textContent).toMatch(/150,000/);
    expect(screen.queryByTestId("student-price-amount-m1")).toBeNull();
    expect(screen.getByTestId("student-price-menu-m1")).toBeTruthy();
    expect(screen.getByTestId("student-price-kind-m2").textContent).toMatch(/No plan/i);
    expect(screen.getByTestId("student-price-menu-m2")).toBeTruthy();
    expect(screen.getByTestId("student-price-kind-m3").textContent).toMatch(
      /Matches default/i,
    );
    expect(screen.getByTestId("student-price-menu-m3")).toBeTruthy();
    expect(screen.queryByTestId("student-price-amount-m3")).toBeNull();
  });
});
