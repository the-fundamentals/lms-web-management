import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { client } from "./client";
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

describe("client", () => {
  beforeEach(() => {
    clearAccessToken();
    vi.stubEnv("VITE_API_BASE_URL", "http://api.test");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("the request uses VITE_API_BASE_URL", async () => {
    const calls = stubFetch();

    await client.post({ body: { name: "Nguyễn" }, url: "/classrooms" });

    expect(calls[0]?.url).toBe("http://api.test/classrooms");
    expect(await calls[0]?.text()).toContain("Nguyễn");
  });

  it("a stored token is sent as Authorization: Bearer", async () => {
    setAccessToken("test-token");
    const calls = stubFetch();

    await client.get({ url: "/classrooms" });

    expect(calls[0]?.headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("no token means no Authorization header", async () => {
    const calls = stubFetch();

    await client.get({ url: "/classrooms" });

    expect(calls[0]?.headers.has("Authorization")).toBe(false);
  });

  it("the request aborts at 15 seconds", async () => {
    vi.useFakeTimers();
    const calls = stubFetch(
      (request) =>
        new Promise((_resolve, reject) => {
          request.signal.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }),
    );

    const pending = client.get({ url: "/classrooms" });
    const rejection = expect(pending).rejects.toThrow(/timed out/i);

    await vi.advanceTimersByTimeAsync(15_000);

    await rejection;
    expect(calls[0]?.signal.aborted).toBe(true);
  });

  it("the error string does not contain the token", async () => {
    setAccessToken("test-token");
    stubFetch(
      () =>
        Promise.resolve(
          new Response(JSON.stringify({ message: "upstream failed for test-token" }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
          }),
        ),
    );

    await expect(client.get({ url: "/classrooms" })).rejects.toEqual({
      message: "upstream failed for ",
    });
  });
});
