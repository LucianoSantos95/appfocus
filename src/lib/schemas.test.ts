import { describe, expect, it } from "vitest";
import { feedbackSchema, getZodErrorMessage, supportTicketSchema } from "./schemas";

describe("feedbackSchema", () => {
  it("aceita só a mensagem (nome, e-mail e nota são opcionais)", () => {
    expect(feedbackSchema.safeParse({ mensagem: "Gostei bastante" }).success).toBe(true);
  });

  it("exige mensagem", () => {
    const r = feedbackSchema.safeParse({ mensagem: "   " });
    expect(r.success).toBe(false);
    if (!r.success) expect(getZodErrorMessage(r.error)).toBe("Mensagem é obrigatória");
  });

  it("limita a mensagem a 1000 caracteres", () => {
    expect(feedbackSchema.safeParse({ mensagem: "a".repeat(1000) }).success).toBe(true);
    expect(feedbackSchema.safeParse({ mensagem: "a".repeat(1001) }).success).toBe(false);
  });

  it("e-mail: vazio é aceito, inválido não", () => {
    expect(feedbackSchema.safeParse({ mensagem: "ok", email: "" }).success).toBe(true);
    expect(feedbackSchema.safeParse({ mensagem: "ok", email: "pessoa@exemplo.com" }).success).toBe(true);
    expect(feedbackSchema.safeParse({ mensagem: "ok", email: "isso-nao-e-email" }).success).toBe(false);
  });

  it("a nota fica entre 0 e 5", () => {
    expect(feedbackSchema.safeParse({ mensagem: "ok", avaliacao: 5 }).success).toBe(true);
    expect(feedbackSchema.safeParse({ mensagem: "ok", avaliacao: 6 }).success).toBe(false);
    expect(feedbackSchema.safeParse({ mensagem: "ok", avaliacao: -1 }).success).toBe(false);
  });
});

describe("supportTicketSchema", () => {
  it("exige nome, e-mail válido e mensagem", () => {
    const ok = { nome: "Ana", email: "ana@exemplo.com", mensagem: "Preciso de ajuda" };
    expect(supportTicketSchema.safeParse(ok).success).toBe(true);
    expect(supportTicketSchema.safeParse({ ...ok, nome: "" }).success).toBe(false);
    expect(supportTicketSchema.safeParse({ ...ok, email: "" }).success).toBe(false);
  });

  it("junta todas as mensagens de erro", () => {
    const r = supportTicketSchema.safeParse({ nome: "", email: "x", mensagem: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = getZodErrorMessage(r.error);
      expect(msg).toContain("Nome é obrigatório");
      expect(msg).toContain("Email inválido");
      expect(msg).toContain("Mensagem é obrigatória");
    }
  });
});
