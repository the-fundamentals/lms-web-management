import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAllClassrooms } from "../../generated/sdk.gen";
import { client } from "./client";
import { createQueryClient } from "./query-client";
import { clearAccessToken, setAccessToken } from "./token";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

function stubFetch(impl?: (request: Request) => Promise<Response>): Request[] {
  const calls: Request[] = [];
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    calls.push(request);
    if (impl) return impl(request);
    return Promise.resolve(jsonResponse({ ok: true }));
  });
  return calls;
}

function listClassrooms(signal?: AbortSignal): Promise<unknown> {
  return getAllClassrooms({
    body: {},
    signal,
    throwOnError: true,
  }).then((result) => result.data);
}

describe("query client", () => {
  const queryClient = createQueryClient();

  beforeEach(() => {
    clearAccessToken();
    queryClient.clear();
    vi.stubEnv("VITE_API_BASE_URL", "http://api.test");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("a query calls the configured client", async () => {
    const spy = vi.spyOn(client, "post");
    stubFetch();

    await queryClient.fetchQuery({
      queryFn: ({ signal }) => listClassrooms(signal),
      queryKey: ["classrooms"],
    });

    expect(spy).toHaveBeenCalled();
    expect(queryClient.getQueryData(["classrooms"])).toEqual({ ok: true });
  });

  it("the query sends the bearer token", async () => {
    setAccessToken("test-token");
    const calls = stubFetch();

    await queryClient.fetchQuery({
      queryFn: ({ signal }) => listClassrooms(signal),
      queryKey: ["classrooms"],
    });

    expect(calls[0]?.method).toBe("POST");
    expect(calls[0]?.url).toBe("http://api.test/admin/classrooms/query");
    expect(calls[0]?.headers.get("Authorization")).toBe("Bearer test-token");
    expect(JSON.stringify(queryClient.getQueryData(["classrooms"]))).not.toContain("test-token");
    expect(queryClient.getQueryData(["classrooms"])).not.toHaveProperty("request");
  });

  it("the query aborts at 15 seconds", async () => {
    vi.useFakeTimers();
    const calls = stubFetch(
      (request) =>
        new Promise((_resolve, reject) => {
          request.signal.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }),
    );

    const pending = queryClient.fetchQuery({
      queryFn: ({ signal }) => listClassrooms(signal),
      queryKey: ["classrooms"],
    });
    const rejection = expect(pending).rejects.toThrow(/timed out/i);

    await vi.advanceTimersByTimeAsync(15_000);

    await rejection;
    expect(calls[0]?.signal.aborted).toBe(true);
  });

  it("a response after the abort is ignored", async () => {
    vi.useFakeTimers();
    let resolveFetch: ((response: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const pending = queryClient.fetchQuery({
      queryFn: ({ signal }) => listClassrooms(signal),
      queryKey: ["classrooms"],
    });
    const rejection = expect(pending).rejects.toThrow(/timed out/i);
    await vi.advanceTimersByTimeAsync(15_000);
    await rejection;

    resolveFetch?.(jsonResponse({ late: true }));
    await vi.advanceTimersByTimeAsync(0);

    expect(queryClient.getQueryData(["classrooms"])).toBeUndefined();
  });

  it("a second query after clearAccessToken sends no bearer token", async () => {
    setAccessToken("test-token");
    const calls = stubFetch();
    await queryClient.fetchQuery({
      queryFn: ({ signal }) => listClassrooms(signal),
      queryKey: ["classrooms", "first"],
    });

    clearAccessToken();
    await queryClient.fetchQuery({
      queryFn: ({ signal }) => listClassrooms(signal),
      queryKey: ["classrooms", "second"],
    });

    expect(calls[1]?.headers.has("Authorization")).toBe(false);
  });
});
