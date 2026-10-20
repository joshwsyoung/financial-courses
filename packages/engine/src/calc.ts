/**
 * Tiny, safe arithmetic evaluator for recomputing answers in CI and for calc drills.
 * Supports numbers, named variables, + - * / ^, parentheses, unary minus,
 * and the functions sqrt, ln, exp, abs, round(x, dp).
 */
type Token = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

function tokenise(src: string): Token[] {
  const out: Token[] = [];
  const re = /\s*(?:(\d+(?:\.\d+)?(?:e-?\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|(\*\*|[-+*/^(),]))/gy;
  let m: RegExpExecArray | null;
  let pos = 0;
  while (pos < src.length) {
    re.lastIndex = pos;
    m = re.exec(src);
    if (!m) {
      if (/^\s*$/.test(src.slice(pos))) break;
      throw new Error(`Unexpected input at ${pos}: "${src.slice(pos)}"`);
    }
    if (m[1]) out.push({ t: "num", v: Number(m[1]) });
    else if (m[2]) out.push({ t: "id", v: m[2] });
    else if (m[3]) out.push({ t: "op", v: m[3] === "**" ? "^" : m[3] });
    pos = re.lastIndex;
  }
  return out;
}

const FUNCS: Record<string, (...a: number[]) => number> = {
  sqrt: Math.sqrt,
  ln: Math.log,
  exp: Math.exp,
  abs: Math.abs,
  round: (x, dp = 0) => Math.round(x * 10 ** dp) / 10 ** dp,
  min: Math.min,
  max: Math.max,
};

export function evaluate(formula: string, vars: Record<string, number>): number {
  const tokens = tokenise(formula);
  let i = 0;
  const peek = () => tokens[i];
  const take = () => tokens[i++];
  const expect = (v: string) => {
    const tk = take();
    if (!tk || tk.t !== "op" || tk.v !== v) throw new Error(`Expected "${v}"`);
  };

  function expr(): number {
    let v = term();
    for (let tk = peek(); tk?.t === "op" && (tk.v === "+" || tk.v === "-"); tk = peek()) {
      take();
      v = tk.v === "+" ? v + term() : v - term();
    }
    return v;
  }
  function term(): number {
    let v = power();
    for (let tk = peek(); tk?.t === "op" && (tk.v === "*" || tk.v === "/"); tk = peek()) {
      take();
      v = tk.v === "*" ? v * power() : v / power();
    }
    return v;
  }
  function power(): number {
    const base = unary();
    const tk = peek();
    if (tk?.t === "op" && tk.v === "^") {
      take();
      return base ** power(); // right associative
    }
    return base;
  }
  function unary(): number {
    const tk = peek();
    if (tk?.t === "op" && tk.v === "-") { take(); return -unary(); }
    if (tk?.t === "op" && tk.v === "+") { take(); return unary(); }
    return atom();
  }
  function atom(): number {
    const tk = take();
    if (!tk) throw new Error("Unexpected end of formula");
    if (tk.t === "num") return tk.v;
    if (tk.t === "op" && tk.v === "(") { const v = expr(); expect(")"); return v; }
    if (tk.t === "id") {
      const next = peek();
      if (next?.t === "op" && next.v === "(") {
        const fn = FUNCS[tk.v];
        if (!fn) throw new Error(`Unknown function "${tk.v}"`);
        take();
        const args = [expr()];
        while (peek()?.t === "op" && peek()!.v === ",") { take(); args.push(expr()); }
        expect(")");
        return fn(...args);
      }
      if (!(tk.v in vars)) throw new Error(`Unknown variable "${tk.v}"`);
      return vars[tk.v]!;
    }
    throw new Error(`Unexpected token "${tk.v}"`);
  }

  const result = expr();
  if (i < tokens.length) throw new Error(`Unexpected trailing input in "${formula}"`);
  return result;
}
