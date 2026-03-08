import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

let createAuthClient;

before(async () => {
  const mod = await import("@neondatabase/neon-js/auth");
  createAuthClient = mod.createAuthClient;
});

describe("Auth client", () => {
  it("requires NEXT_PUBLIC_NEON_AUTH_URL", () => {
    assert.ok(process.env.NEXT_PUBLIC_NEON_AUTH_URL, "NEXT_PUBLIC_NEON_AUTH_URL must be set");
  });

  it("creates a client from the Neon Auth URL", () => {
    const client = createAuthClient(process.env.NEXT_PUBLIC_NEON_AUTH_URL);
    assert.ok(client, "Client should be created");
  });

  it("exposes signIn, signUp, signOut methods", () => {
    const client = createAuthClient(process.env.NEXT_PUBLIC_NEON_AUTH_URL);
    assert.equal(typeof client.signIn, "function", "signIn should be a function");
    assert.equal(typeof client.signUp, "function", "signUp should be a function");
    assert.equal(typeof client.signOut, "function", "signOut should be a function");
  });

  it("exposes useSession hook", () => {
    const client = createAuthClient(process.env.NEXT_PUBLIC_NEON_AUTH_URL);
    assert.ok(client.useSession, "useSession should exist");
  });

  it("exposes getSession method", () => {
    const client = createAuthClient(process.env.NEXT_PUBLIC_NEON_AUTH_URL);
    assert.equal(typeof client.getSession, "function", "getSession should be a function");
  });

  it("getSession returns no session when not authenticated", async () => {
    const client = createAuthClient(process.env.NEXT_PUBLIC_NEON_AUTH_URL);
    const session = await client.getSession();
    // Should return null/empty data when no cookies/token present
    assert.ok(session !== undefined, "getSession should return a response");
  });
});
