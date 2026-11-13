import { afterEach, describe, expect, it, vi } from "vitest";
import { publicAssetUrl, readPublicAssetBaseUrl } from "./public-asset-url";

describe("public asset url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("trims a trailing slash from the base URL", () => {
    vi.stubEnv("VITE_PUBLIC_ASSET_BASE_URL", "https://cdn.example/");
    expect(readPublicAssetBaseUrl()).toBe("https://cdn.example");
  });

  it("joins base and key without inventing a placeholder", () => {
    vi.stubEnv("VITE_PUBLIC_ASSET_BASE_URL", "https://cdn.example");
    expect(publicAssetUrl("public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")).toBe(
      "https://cdn.example/public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
    expect(publicAssetUrl(undefined)).toBeUndefined();
    vi.stubEnv("VITE_PUBLIC_ASSET_BASE_URL", "");
    expect(publicAssetUrl("public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")).toBeUndefined();
  });
});
