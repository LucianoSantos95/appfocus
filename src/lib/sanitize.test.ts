import { describe, expect, it } from "vitest";
import { sanitizeHtml, stripHtml } from "./sanitize";

describe("sanitizeHtml", () => {
  it("mantém a formatação básica permitida", () => {
    const html = '<p>Olá <b>mundo</b> e <a href="https://focusinteligente.com.br">link</a></p>';
    const limpo = sanitizeHtml(html);
    expect(limpo).toContain("<b>mundo</b>");
    expect(limpo).toContain('href="https://focusinteligente.com.br"');
  });

  it("remove script e handlers de evento (XSS)", () => {
    const limpo = sanitizeHtml('<p onclick="roubar()">oi</p><script>alert(1)</script>');
    expect(limpo).not.toContain("script");
    expect(limpo).not.toContain("onclick");
    expect(limpo).toContain("oi");
  });

  it("neutraliza links javascript:", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
  });

  it("remove tags fora da lista, como imagem com onerror", () => {
    expect(sanitizeHtml("<img src=x onerror=alert(1)>")).toBe("");
  });

  it("não deixa atributos data-*", () => {
    expect(sanitizeHtml('<p data-x="1">oi</p>')).not.toContain("data-x");
  });
});

describe("stripHtml", () => {
  it("devolve só o texto", () => {
    expect(stripHtml("<p>Olá <b>mundo</b></p>")).toBe("Olá mundo");
  });
});
