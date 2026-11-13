import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asPublicObjectKey, uploadPublicAvatar } from "./upload-public-avatar";

type Captured = {
  body: string;
  headers: Headers;
  method: string;
  url: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

describe("upload public avatar", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://api.test");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("asPublicObjectKey keeps an existing public/ prefix", () => {
    expect(asPublicObjectKey("public/abc")).toBe("public/abc");
    expect(asPublicObjectKey("abc")).toBe("public/abc");
  });

  it("requests a public upload URL, PUTs the file, and returns the key without confirm-public", async () => {
    const calls: Captured[] = [];
    const uploadUrl = "http://api.test/upload-landing";
    const downloadUrl = "http://api.test/download-landing";
    const objectKey = "public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const body = await request.clone().text();
      calls.push({ body, headers: request.headers, method: request.method, url: request.url });

      if (request.url.endsWith("/private/storage") && request.method === "POST") {
        expect(body).toContain('"isPublic":true');
        return jsonResponse({ downloadUrl, objectKey, uploadUrl });
      }
      if (request.url === uploadUrl && request.method === "PUT") {
        return new Response(null, { status: 200 });
      }
      return jsonResponse({ message: "unexpected" }, 500);
    });

    const file = new File(["avatar-bytes"], "avatar.png", { type: "image/png" });
    const uploaded = await uploadPublicAvatar(file);

    expect(uploaded).toEqual({ downloadUrl, objectKey });
    expect(calls.some((call) => call.url.endsWith("/private/storage"))).toBe(true);
    expect(calls.some((call) => call.url === uploadUrl && call.method === "PUT")).toBe(true);
    expect(calls.some((call) => call.url.includes("/test/storage/confirm-public"))).toBe(false);
  });

  it("prefixes a bare object key with public/", async () => {
    const uploadUrl = "http://api.test/upload-landing";
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      if (request.url.endsWith("/private/storage")) {
        return jsonResponse({
          objectKey: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          uploadUrl,
        });
      }
      if (request.url === uploadUrl) return new Response(null, { status: 200 });
      return jsonResponse({ message: "unexpected" }, 500);
    });

    const uploaded = await uploadPublicAvatar(new File(["x"], "a.jpg", { type: "image/jpeg" }));
    expect(uploaded.objectKey).toBe("public/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(uploaded.downloadUrl).toBeUndefined();
  });
});
