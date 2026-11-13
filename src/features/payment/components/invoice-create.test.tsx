import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InvoiceCreate } from "./invoice-create";

const createAdhocInvoice = vi.hoisted(() => vi.fn());
const listActiveStudents = vi.hoisted(() => vi.fn());
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

vi.mock("../lib/payment-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/payment-api")>("../lib/payment-api");
  return {
    ...actual,
    createAdhocInvoice: (...args: unknown[]) => createAdhocInvoice(...args),
    listActiveStudents: (...args: unknown[]) => listActiveStudents(...args),
  };
});

function renderCreate() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <InvoiceCreate classroomId="c1" />
    </QueryClientProvider>,
  );
}

describe("invoice create", () => {
  beforeEach(() => {
    createAdhocInvoice.mockReset();
    listActiveStudents.mockReset();
    navigate.mockReset();
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

  it("posts create once and opens detail", async () => {
    createAdhocInvoice.mockResolvedValue({ id: "inv1" });
    renderCreate();
    await waitFor(() => expect(screen.getByTestId("invoice-create")).toBeTruthy());
    fireEvent.change(screen.getByTestId("invoice-line-description-0"), {
      target: { value: "Fee" },
    });
    fireEvent.change(screen.getByTestId("invoice-line-price-0"), {
      target: { value: "1000" },
    });
    fireEvent.click(screen.getByTestId("invoice-create-submit"));
    await waitFor(() => expect(createAdhocInvoice).toHaveBeenCalledTimes(1));
    expect(createAdhocInvoice).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        memberId: "m1",
        lines: [expect.objectContaining({ description: "Fee", unitPrice: 1000, quantity: 1 })],
      }),
    );
    expect(navigate).toHaveBeenCalledWith({
      to: "/classrooms/$classroomId/money/invoices/$invoiceId",
      params: { classroomId: "c1", invoiceId: "inv1" },
    });
  });

  it("double-submit guard", async () => {
    let resolveCreate: (v: unknown) => void = () => undefined;
    createAdhocInvoice.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    renderCreate();
    await waitFor(() => expect(screen.getByTestId("invoice-create")).toBeTruthy());
    fireEvent.change(screen.getByTestId("invoice-line-description-0"), {
      target: { value: "Fee" },
    });
    fireEvent.change(screen.getByTestId("invoice-line-price-0"), {
      target: { value: "1000" },
    });
    fireEvent.click(screen.getByTestId("invoice-create-submit"));
    fireEvent.click(screen.getByTestId("invoice-create-submit"));
    expect(createAdhocInvoice).toHaveBeenCalledTimes(1);
    resolveCreate({ id: "inv1" });
    await waitFor(() => expect(navigate).toHaveBeenCalled());
  });

  it("requires at least one line", async () => {
    renderCreate();
    await waitFor(() => expect(screen.getByTestId("invoice-create")).toBeTruthy());
    fireEvent.click(screen.getByTestId("invoice-create-submit"));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(createAdhocInvoice).not.toHaveBeenCalled();
  });

  it("dirty form arms leave blocker", async () => {
    const { useBlocker } = await import("@tanstack/react-router");
    renderCreate();
    await waitFor(() => expect(screen.getByTestId("invoice-create")).toBeTruthy());
    fireEvent.change(screen.getByTestId("invoice-line-description-0"), {
      target: { value: "Fee" },
    });
    expect(useBlocker).toHaveBeenCalled();
    const last = vi.mocked(useBlocker).mock.calls.at(-1)?.[0] as {
      shouldBlockFn: () => boolean;
      enableBeforeUnload?: boolean;
    };
    expect(last.enableBeforeUnload).toBe(true);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    expect(last.shouldBlockFn()).toBe(true);
    confirmSpy.mockRestore();
  });
});
