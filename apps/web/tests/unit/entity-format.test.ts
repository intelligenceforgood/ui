import { describe, it, expect } from "vitest";
import { formatEntityValue } from "@/lib/entity-format";

describe("formatEntityValue", () => {
  describe("phone_number", () => {
    it("formats 10-digit US numbers", () => {
      expect(formatEntityValue("phone_number", "3475550198")).toBe(
        "(347) 555-0198",
      );
    });

    it("formats 11-digit numbers starting with 1", () => {
      expect(formatEntityValue("phone_number", "13475550198")).toBe(
        "+1 (347) 555-0198",
      );
    });

    it("formats international numbers", () => {
      const result = formatEntityValue("phone_number", "629187345021");
      expect(result).toContain("+");
      expect(result).not.toBe("629187345021");
    });

    it("passes through short numbers unchanged", () => {
      expect(formatEntityValue("phone_number", "12345")).toBe("12345");
    });
  });

  describe("bank_account", () => {
    it("groups digits in fours", () => {
      expect(formatEntityValue("bank_account", "629187345021")).toBe(
        "6291 8734 5021",
      );
    });

    it("passes through short values", () => {
      expect(formatEntityValue("bank_account", "123")).toBe("123");
    });
  });

  describe("routing_number", () => {
    it("formats 9-digit ABA routing numbers", () => {
      expect(formatEntityValue("routing_number", "021000021")).toBe(
        "021-000-021",
      );
    });

    it("passes through non-9-digit values", () => {
      expect(formatEntityValue("routing_number", "12345")).toBe("12345");
    });
  });

  describe("wallet_address", () => {
    it("truncates long addresses", () => {
      expect(
        formatEntityValue(
          "wallet_address",
          "0x1234567890abcdef1234567890abcdef12345678",
        ),
      ).toBe("0x1234…5678");
    });

    it("keeps short addresses intact", () => {
      expect(formatEntityValue("wallet_address", "0xABCDEF")).toBe("0xABCDEF");
    });
  });

  describe("transaction_id", () => {
    it("truncates long hashes", () => {
      expect(
        formatEntityValue(
          "transaction_id",
          "abc123def456abc123def456abc123def456",
        ),
      ).toBe("abc123de…def456");
    });

    it("keeps short IDs intact", () => {
      expect(formatEntityValue("transaction_id", "TX-12345")).toBe("TX-12345");
    });
  });

  describe("email_address", () => {
    it("lowercases emails", () => {
      expect(formatEntityValue("email_address", "User@Example.COM")).toBe(
        "user@example.com",
      );
    });
  });

  describe("url", () => {
    it("strips trailing slashes", () => {
      expect(formatEntityValue("url", "https://example.com/")).toBe(
        "https://example.com",
      );
    });
  });

  describe("unknown types", () => {
    it("returns value as-is for unregistered types", () => {
      expect(formatEntityValue("person", "John Doe")).toBe("John Doe");
    });

    it("returns value as-is for empty entity type", () => {
      expect(formatEntityValue("", "some value")).toBe("some value");
    });
  });
});
