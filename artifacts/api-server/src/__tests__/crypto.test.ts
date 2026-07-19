import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "../lib/crypto";

describe("crypto", () => {
  it("should encrypt and decrypt a string", () => {
    const plaintext = "my_secret_password_123";
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.split(":")).toHaveLength(3);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertexts for the same input", () => {
    const plaintext = "hello";
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    expect(a).not.toBe(b);
  });

  it("should handle empty string", () => {
    const encrypted = encrypt("");
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe("");
  });

  it("should handle unicode characters", () => {
    const plaintext = "مرحبا بالعالم 🔐";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should throw on invalid ciphertext", () => {
    expect(() => decrypt("invalid")).toThrow("Invalid encrypted payload format");
    expect(() => decrypt("a:b")).toThrow("Invalid encrypted payload format");
    expect(() => decrypt("a:b:c:d")).toThrow("Invalid encrypted payload format");
  });

  it("should throw on tampered ciphertext", () => {
    const encrypted = encrypt("secret");
    const parts = encrypted.split(":");
    parts[2] = parts[2].replace(/^./, "0");
    expect(() => decrypt(parts.join(":"))).toThrow();
  });
});
