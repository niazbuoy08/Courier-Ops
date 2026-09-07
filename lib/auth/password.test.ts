import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("produces a bcrypt hash that is not the plaintext", async () => {
    const hash = await hashPassword("dispatch123");
    expect(hash).not.toBe("dispatch123");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("verifies the correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("dispatch123");
    expect(await verifyPassword("dispatch123", hash)).toBe(true);
    expect(await verifyPassword("dispatch124", hash)).toBe(false);
  });

  it("salts: two hashes of the same password differ", async () => {
    const [a, b] = await Promise.all([
      hashPassword("same-password"),
      hashPassword("same-password"),
    ]);
    expect(a).not.toBe(b);
  });
});
