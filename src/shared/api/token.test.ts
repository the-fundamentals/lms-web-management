import { beforeEach, describe, expect, it } from "vitest";
import { clearAccessToken, getAccessToken, setAccessToken } from "./token";

describe("token", () => {
  beforeEach(() => {
    clearAccessToken();
  });

  it("set then get returns the token", () => {
    setAccessToken("test-token");

    expect(getAccessToken()).toBe("test-token");
  });

  it("get before set returns empty", () => {
    expect(getAccessToken()).toBe("");
  });

  it("clear removes the token", () => {
    setAccessToken("test-token");

    clearAccessToken();

    expect(getAccessToken()).toBe("");
  });

  it("a second set replaces the first", () => {
    setAccessToken("test-token");
    setAccessToken("next-token");

    expect(getAccessToken()).toBe("next-token");
  });

  it("the token value is not placed in a URL by this module", () => {
    setAccessToken("test-token");

    const returned = getAccessToken();
    const source = [setAccessToken, clearAccessToken, getAccessToken]
      .map((fn) => fn.toString())
      .join("\n");

    expect(returned).toBe("test-token");
    expect(returned).not.toContain("://");
    expect(source).not.toContain("http");
    expect(source).not.toContain("URL");
  });
});
