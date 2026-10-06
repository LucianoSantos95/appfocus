import { describe, expect, it } from "vitest";
import { PLATFORM_OWNER_EMAIL, isOwnerEmail } from "./owner";

describe("isOwnerEmail", () => {
  it("reconhece o e-mail do dono, ignorando maiúsculas e espaços", () => {
    expect(isOwnerEmail(PLATFORM_OWNER_EMAIL)).toBe(true);
    expect(isOwnerEmail(PLATFORM_OWNER_EMAIL.toUpperCase())).toBe(true);
    expect(isOwnerEmail(`  ${PLATFORM_OWNER_EMAIL}  `)).toBe(true);
  });

  it("recusa qualquer outro e-mail", () => {
    expect(isOwnerEmail("outra.pessoa@gmail.com")).toBe(false);
    expect(isOwnerEmail(`x${PLATFORM_OWNER_EMAIL}`)).toBe(false);
  });

  it("recusa vazio, null e undefined", () => {
    expect(isOwnerEmail("")).toBe(false);
    expect(isOwnerEmail(null)).toBe(false);
    expect(isOwnerEmail(undefined)).toBe(false);
  });
});
