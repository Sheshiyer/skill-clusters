import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { resolveConfig } from "./resolve-config.ts";

describe("resolveConfig", () => {
  beforeEach(() => {
    delete process.env.SELEMENE_RUST_URL;
    delete process.env.SELEMENE_TS_URL;
    delete process.env.SELEMENE_API_KEY;
    delete process.env.SELEMENE_OUTPUT_DIR;
  });

  afterEach(() => {
    delete process.env.SELEMENE_RUST_URL;
    delete process.env.SELEMENE_TS_URL;
    delete process.env.SELEMENE_API_KEY;
    delete process.env.SELEMENE_OUTPUT_DIR;
  });

  it("returns defaults when no env or file config exists", () => {
    const config = resolveConfig();
    expect(config.rustUrl).toBe("http://localhost:8080");
    expect(config.tsUrl).toBe("http://localhost:3001");
    expect(config.apiKey).toBeUndefined();
  });

  it("prefers env vars over defaults", () => {
    process.env.SELEMENE_RUST_URL = "http://rust.example.com";
    process.env.SELEMENE_TS_URL = "http://ts.example.com";
    process.env.SELEMENE_API_KEY = "secret";

    const config = resolveConfig();
    expect(config.rustUrl).toBe("http://rust.example.com");
    expect(config.tsUrl).toBe("http://ts.example.com");
    expect(config.apiKey).toBe("secret");
  });
});
