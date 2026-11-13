/**
 * Original ScholarSAT Math question generator.
 * Every question is built from random parameters; answers are computed, never hand-typed.
 */
import { collect, expr, frac, fracPlain, gcd, m, mcq, spr, fmtNum, type Gen, type R, type Question, type Difficulty } from "./lib";

type Base = Omit<Question, "type" | "choices" | "answer" | "id">;
const B = (stem: string, explanation: string, extra: Partial<Base> = {}): Base => ({
  section: "math",
  domain: "",
  skill: "",
  difficulty: "E",
  stem,
  explanation,
  ...extra,
});
const nums = (xs: number[]) => xs.map((x) => m(String(x)));

// ---------------- ALGEBRA ----------------

const linOneVar: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const x = r.int(-9, 12), a = r.int(2, 9), b = r.nz(-20, 20), c = a * x + b;
      return mcq(r, B(`If ${m(`${expr([[a, "x"], [b, ""]])} = ${c}`)}, what is the value of ${m("x")}?`,
        `Subtract ${m(String(b))} from both sides: ${m(`${a}x = ${c - b}`)}. Divide by ${m(String(a))}: ${m(`x = ${x}`)}.`),
        m(String(x)), nums([x + 1, -x === x ? x + 2 : -x, (c + b) / a === x ? x - 1 : Math.round(((c + b) / a) * 100) / 100, x - 2]));
    },
    (r) => {
      const x = r.int(2, 15), a = r.int(2, 6), k = r.int(2, 5), c = a * x;
      return spr(B(`What value of ${m("x")} satisfies the equation ${m(`${a}x = ${c}`)}?`,
        `Divide both sides by ${m(String(a))}: ${m(`x = ${c}/${a} = ${x}`)}.`), String(x + 0 * k));
    },
  ],
  M: [
    (r) => {
      const x = r.int(-8, 10), a = r.int(2, 7), b = r.nz(-6, 6), c = r.int(1, 9);
      if (a === c) return null;
      const d = a * (x + b) - c * x;
      return mcq(r, B(`What value of ${m("x")} is the solution to ${m(`${a}(${expr([[1, "x"], [b, ""]])}) = ${expr([[c, "x"], [d, ""]])}`)}?`,
        `Distribute: ${m(`${expr([[a, "x"], [a * b, ""]])} = ${expr([[c, "x"], [d, ""]])}`)}. Collect like terms: ${m(`${a - c}x = ${d - a * b}`)}, so ${m(`x = ${x}`)}.`),
        m(String(x)), nums([x + 2, x - 1, -x === x ? 3 : -x, x + 5]));
    },
    (r) => {
      // fractional coefficients
      const p = r.int(2, 6), q = r.int(1, 9), x = p * r.int(1, 8), c = x / p + q;
      return spr(B(`If ${m(`\\frac{x}{${p}} + ${q} = ${c}`)}, what is the value of ${m("x")}?`,
        `Subtract ${m(String(q))}: ${m(`\\frac{x}{${p}} = ${c - q}`)}. Multiply by ${m(String(p))}: ${m(`x = ${x}`)}.`), String(x));
    },
  ],
  H: [
    (r) => {
      const k = r.int(2, 9), p = r.int(1, 9), mm = -k * p;
      return spr(B(`In the equation ${m(`k(x - ${p}) = ${k}x + m`)}, ${m("k")} and ${m("m")} are constants. If the equation has infinitely many solutions, what is the value of ${m("m")}?`,
        `An equation has infinitely many solutions when both sides are identical. Expanding gives ${m(`kx - ${p}k = ${k}x + m`)}, so ${m(`k = ${k}`)} and ${m(`m = -${p}k = ${mm}`)}.`), String(mm));
    },
    (r) => {
      const a = r.int(2, 9), b = r.int(1, 12), c = r.int(1, 12);
      if (b === c) return null;
      return mcq(r, B(`How many solutions does the equation ${m(`${a}(x + ${b}) = ${a}x + ${a * c}`)} have?`,
        `Distributing gives ${m(`${a}x + ${a * b} = ${a}x + ${a * c}`)}. Subtracting ${m(`${a}x`)} leaves ${m(`${a * b} = ${a * c}`)}, which is false, so there are no solutions.`),
        "Zero", ["Exactly one", "Exactly two", "Infinitely many"]);
    },
    (r) => {
      const x = r.int(1, 9), y = r.int(1, 6), a = r.int(2, 5);
      // solve for an expression: a*x + ... ask value of 3x+? style: if 2x+3 = 11, what is 6x+9?
      const b = r.int(1, 9), k = r.int(2, 5), c = a * x + b;
      return spr(B(`If ${m(`${a}x + ${b} = ${c}`)}, what is the value of ${m(`${k * a}x + ${k * b}`)}?`,
        `Notice that ${m(`${k * a}x + ${k * b} = ${k}(${a}x + ${b})`)}. So its value is ${m(`${k}(${c}) = ${k * c}`)}. No need to solve for ${m("x")}.`), String(k * c + 0 * y));
    },
  ],
};

const linFunc: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const a = r.nz(-6, 8), b = r.nz(-10, 10), n = r.int(-5, 9), v = a * n + b;
      return mcq(r, B(`The function ${m("f")} is defined by ${m(`f(x) = ${expr([[a, "x"], [b, ""]])}`)}. What is the value of ${m(`f(${n})`)}?`,
        `Substitute ${m(`x = ${n}`)}: ${m(`f(${n}) = ${a}(${n}) ${b < 0 ? "-" : "+"} ${Math.abs(b)} = ${v}`)}.`),
        m(String(v)), nums([a * n - b, a + n + b, v + a, -v === v ? v + 3 : -v]));
    },
    (r) => {
      const fee = r.pick([15, 20, 25, 30, 40]), rate = r.pick([8, 10, 12, 15, 18]), h = r.int(2, 9);
      const total = fee + rate * h;
      return spr(B(`A bike rental shop charges a flat fee of $${fee} plus $${rate} per hour. The total cost, in dollars, of renting a bike for ${m("h")} hours is given by ${m(`C(h) = ${rate}h + ${fee}`)}. What is the total cost, in dollars, of renting a bike for ${h} hours?`,
        `${m(`C(${h}) = ${rate}(${h}) + ${fee} = ${rate * h} + ${fee} = ${total}`)}.`), String(total));
    },
  ],
  M: [
    (r) => {
      const slope = r.nz(-5, 6), b = r.int(-10, 10), x1 = r.int(-4, 3), x2 = x1 + r.int(1, 5), x3 = r.int(-6, 10);
      const f = (x: number) => slope * x + b;
      return spr(B(`For the linear function ${m("f")}, ${m(`f(${x1}) = ${f(x1)}`)} and ${m(`f(${x2}) = ${f(x2)}`)}. What is the value of ${m(`f(${x3})`)}?`,
        `The slope is ${m(`\\frac{${f(x2)} - (${f(x1)})}{${x2} - (${x1})} = ${slope}`)}. Then ${m(`f(x) = ${expr([[slope, "x"], [b, ""]])}`)}, so ${m(`f(${x3}) = ${f(x3)}`)}.`), String(f(x3)));
    },
    (r) => {
      const start = r.pick([120, 150, 200, 240, 300]), rate = r.pick([4, 5, 6, 8, 10]);
      const correct = m(`V(t) = ${start} - ${rate}t`);
      return mcq(r, B(`A water tank contains ${start} gallons of water. Water is drained from the tank at a constant rate of ${rate} gallons per minute. Which function gives the number of gallons of water, ${m("V(t)")}, in the tank ${m("t")} minutes after draining begins?`,
        `The tank starts with ${start} gallons and loses ${rate} gallons each minute, so after ${m("t")} minutes it holds ${m(`${start} - ${rate}t`)} gallons.`),
        correct, [m(`V(t) = ${start} + ${rate}t`), m(`V(t) = ${rate} - ${start}t`), m(`V(t) = ${start}t - ${rate}`)]);
    },
  ],
  H: [
    (r) => {
      const a = r.nz(-4, 5), b = r.int(-9, 9), c = r.nz(-5, 5), n = r.int(-3, 6);
      // g(x) = f(x + c), find g(n)
      const v = a * (n + c) + b;
      return spr(B(`The function ${m("f")} is defined by ${m(`f(x) = ${expr([[a, "x"], [b, ""]])}`)}. The function ${m("g")} is defined by ${m(`g(x) = f(x ${c < 0 ? "-" : "+"} ${Math.abs(c)})`)}. What is the value of ${m(`g(${n})`)}?`,
        `${m(`g(${n}) = f(${n + c})`)}${""} ${m(`= ${a}(${n + c}) ${b < 0 ? "-" : "+"} ${Math.abs(b)} = ${v}`)}.`), String(v));
    },
    (r) => {
      const p0 = r.pick([2, 3, 4, 5]), slope = r.pick([3, 4, 6, 7]), x1 = r.int(1, 4), y1 = p0 + slope * x1, x2 = x1 + r.int(2, 5), y2 = p0 + slope * x2;
      return mcq(r, B(`The graph of the linear function ${m("h")} passes through the points ${m(`(${x1}, ${y1})`)} and ${m(`(${x2}, ${y2})`)}. Which of the following defines ${m("h")}?`,
        `Slope: ${m(`\\frac{${y2} - ${y1}}{${x2} - ${x1}} = ${slope}`)}. Using ${m(`(${x1}, ${y1})`)}: ${m(`${y1} = ${slope}(${x1}) + b`)} gives ${m(`b = ${p0}`)}. So ${m(`h(x) = ${slope}x + ${p0}`)}.`),
        m(`h(x) = ${slope}x + ${p0}`), [m(`h(x) = ${p0}x + ${slope}`), m(`h(x) = ${slope}x + ${y1}`), m(`h(x) = ${slope + 1}x + ${p0 - x1}`)]);
    },
  ],
};

const linTwoVar: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const x1 = r.int(-6, 4), y1 = r.int(-6, 6), dx = r.int(1, 6), dy = r.nz(-9, 9), x2 = x1 + dx, y2 = y1 + dy;
      return mcq(r, B(`A line in the ${m("xy")}-plane passes through the points ${m(`(${x1}, ${y1})`)} and ${m(`(${x2}, ${y2})`)}. What is the slope of the line?`,
        `Slope ${m(`= \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{${y2} - (${y1})}{${x2} - (${x1})} = ${frac(dy, dx)}`)}.`),
        m(frac(dy, dx)), [m(frac(dx, dy)), m(frac(-dy, dx)), m(frac(y2 + y1, x2 + x1 === 0 ? 1 : x2 + x1))]);
    },
    (r) => {
      const a = r.int(1, 6), b = r.int(1, 6), c = a * b * r.int(1, 4);
      return spr(B(`The graph of ${m(`${a}x + ${b}y = ${c}`)} in the ${m("xy")}-plane crosses the ${m("y")}-axis at the point ${m("(0, k)")}. What is the value of ${m("k")}?`,
        `At the ${m("y")}-axis, ${m("x = 0")}, so ${m(`${b}y = ${c}`)} and ${m(`y = ${c / b}`)}.`), String(c / b));
    },
  ],
  M: [
    (r) => {
      const a = r.int(2, 9), b = r.int(2, 9), c = r.int(10, 60);
      return mcq(r, B(`A store sells notebooks for $${a} each and pens for $${b} each. Sam spent exactly $${c} on ${m("n")} notebooks and ${m("p")} pens. Which equation represents this situation?`,
        `Notebooks cost ${m(`${a}n`)} dollars and pens cost ${m(`${b}p`)} dollars; together they total ${m(String(c))}.`),
        m(`${a}n + ${b}p = ${c}`), [m(`${b}n + ${a}p = ${c}`), m(`${a + b}(n + p) = ${c}`), m(`${a}n - ${b}p = ${c}`)]);
    },
    (r) => {
      const a = r.int(2, 8), b = r.int(2, 8), k = r.int(1, 5), c = a * b * k;
      return spr(B(`The graph of ${m(`${a}x + ${b}y = ${c}`)} intersects the ${m("x")}-axis at ${m("(t, 0)")}. What is the value of ${m("t")}?`,
        `Set ${m("y = 0")}: ${m(`${a}x = ${c}`)}, so ${m(`x = ${c / a}`)}.`), String(c / a));
    },
  ],
  H: [
    (r) => {
      const mm = r.nz(-5, 5), p = r.int(-5, 5), q = r.int(-9, 9), b = q - mm * p;
      return spr(B(`Line ${m("\\ell")} is parallel to the graph of ${m(`y = ${expr([[mm, "x"], [r.int(1, 9), ""]])}`)} and passes through the point ${m(`(${p}, ${q})`)}. If line ${m("\\ell")} has equation ${m("y = mx + b")}, what is the value of ${m("b")}?`,
        `Parallel lines share a slope, so ${m(`m = ${mm}`)}. Substituting ${m(`(${p}, ${q})`)}: ${m(`${q} = ${mm}(${p}) + b`)}, so ${m(`b = ${b}`)}.`), String(b));
    },
    (r) => {
      const a = r.int(1, 6), b = r.int(1, 6), mm = frac(-a, b);
      return mcq(r, B(`Line ${m("k")} is perpendicular to the graph of ${m(`${a}x + ${b}y = ${r.int(2, 20)}`)}. What is the slope of line ${m("k")}?`,
        `Rewrite as ${m(`y = ${mm}x + \\dots`)}, so its slope is ${m(mm)}. A perpendicular slope is the negative reciprocal: ${m(frac(b, a))}.`),
        m(frac(b, a)), [m(frac(-a, b)), m(frac(a, b)), m(frac(-b, a))]);
    },
  ],
};

const systems: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const x = r.int(-5, 12), y = r.int(-5, 12), s = x + y, d = x - y;
      return spr(B(`${m(`x + y = ${s}`)}<br>${m(`x - y = ${d}`)}<br>The solution to the given system of equations is ${m("(x, y)")}. What is the value of ${m("x")}?`,
        `Add the equations: ${m(`2x = ${s + d}`)}, so ${m(`x = ${x}`)}.`), String(x));
    },
  ],
  M: [
    (r) => {
      const x = r.int(-4, 8), y = r.int(-4, 8), a = r.int(1, 5), b = r.int(1, 5), c = r.int(1, 5), d = r.nz(-5, 5);
      if (a * d - b * c === 0) return null;
      const e1 = a * x + b * y, e2 = c * x + d * y;
      return mcq(r, B(`${m(`${expr([[a, "x"], [b, "y"]])} = ${e1}`)}<br>${m(`${expr([[c, "x"], [d, "y"]])} = ${e2}`)}<br>If ${m("(x, y)")} is the solution to the system of equations above, what is the value of ${m("x + y")}?`,
        `Solving the system (by elimination or substitution) gives ${m(`x = ${x}`)} and ${m(`y = ${y}`)}, so ${m(`x + y = ${x + y}`)}.`),
        m(String(x + y)), nums([x - y, x * y === x + y ? x + y + 4 : x * y, x + y + 2, y - x === x + y ? x + y - 3 : y - x]));
    },
    (r) => {
      const adult = r.pick([12, 14, 15, 18]), child = r.pick([6, 7, 8, 9]), A = r.int(20, 80), C = r.int(20, 80);
      return spr(B(`A theater sold ${A + C} tickets for a show. Adult tickets cost $${adult} and child tickets cost $${child}. If the total revenue was $${adult * A + child * C}, how many adult tickets were sold?`,
        `Let ${m("a")} be adult tickets and ${m("c")} child tickets: ${m(`a + c = ${A + C}`)} and ${m(`${adult}a + ${child}c = ${adult * A + child * C}`)}. Substituting ${m(`c = ${A + C} - a`)}: ${m(`${adult - child}a = ${adult * A + child * C - child * (A + C)}`)}, so ${m(`a = ${A}`)}.`), String(A));
    },
  ],
  H: [
    (r) => {
      const a = r.int(2, 6), b = r.pick([2, 3, 4]), mult = r.int(2, 4), k = a * mult;
      const c = r.int(1, 9), d = c * mult + r.int(1, 5);
      return spr(B(`${m(`${a}x + ${b}y = ${c}`)}<br>${m(`kx + ${b * mult}y = ${d}`)}<br>In the given system of equations, ${m("k")} is a constant. If the system has no solution, what is the value of ${m("k")}?`,
        `A system of two linear equations has no solution when the lines are parallel and distinct: the coefficients are proportional but the constants are not. Since ${m(`${b * mult} = ${mult}(${b})`)}, ${m(`k = ${mult}(${a}) = ${k}`)}, and ${m(`${d} \\ne ${mult}(${c})`)}.`), String(k));
    },
    (r) => {
      const a = r.int(2, 5), b = r.int(2, 5), mult = r.int(2, 4);
      return mcq(r, B(`${m(`${a}x - ${b}y = 7`)}<br>${m(`${a * mult}x - ${b * mult}y = ${7 * mult}`)}<br>How many solutions does the given system of equations have?`,
        `The second equation is exactly ${m(String(mult))} times the first, so both describe the same line. Every point on that line is a solution.`),
        "Infinitely many", ["Zero", "Exactly one", "Exactly two"]);
    },
  ],
};

const inequalities: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const a = r.int(2, 6), b = r.int(1, 12), c = r.int(10, 40), bound = (c + b) / a;
      const lo = Math.floor(bound);
      const correct = lo + r.int(1, 4);
      return mcq(r, B(`Which of the following values of ${m("x")} satisfies the inequality ${m(`${a}x - ${b} > ${c}`)}?`,
        `Add ${m(String(b))} and divide by ${m(String(a))}: ${m(`x > ${frac(c + b, a)}`)}. Only ${m(String(correct))} is greater than ${m(fmtNum(bound))}.`),
        m(String(correct)), nums([lo - 1, lo - 3, Number.isInteger(bound) ? lo : lo - 5]));
    },
  ],
  M: [
    (r) => {
      const budget = r.pick([50, 60, 75, 80, 100, 120]), fee = r.pick([5, 8, 10, 12]), price = r.pick([3, 4, 6, 7, 9]);
      const n = Math.floor((budget - fee) / price);
      return spr(B(`Maya has $${budget} to spend at a craft fair. There is a $${fee} entry fee, and each handmade card costs $${price}. What is the greatest number of cards Maya can buy?`,
        `${m(`${fee} + ${price}n \\le ${budget}`)} gives ${m(`n \\le ${frac(budget - fee, price)}`)}${Number.isInteger((budget - fee) / price) ? "" : ` (about ${fmtNum((budget - fee) / price)})`}. The greatest whole number is ${m(String(n))}.`), String(n));
    },
  ],
  H: [
    (r) => {
      const a = r.int(1, 3), b = r.int(-3, 3), c = -r.int(1, 3), d = r.int(6, 12);
      // region: y > a x + b and y < c x + d
      const pts: [number, number][] = [];
      for (let x = -3; x <= 3; x++) for (let y = -6; y <= 14; y++) pts.push([x, y]);
      const inside = pts.filter(([x, y]) => y > a * x + b && y < c * x + d);
      const outside = pts.filter(([x, y]) => !(y > a * x + b && y < c * x + d) && Math.abs(y - (a * x + b)) < 4);
      if (inside.length < 1 || outside.length < 3) return null;
      const [px, py] = r.pick(inside);
      const fmt = ([x, y]: [number, number]) => m(`(${x}, ${y})`);
      const ds = r.shuffle(outside).slice(0, 3).map(fmt);
      return mcq(r, B(`${m(`y > ${expr([[a, "x"], [b, ""]])}`)}<br>${m(`y < ${expr([[c, "x"], [d, ""]])}`)}<br>Which point ${m("(x, y)")} is a solution to the given system of inequalities in the ${m("xy")}-plane?`,
        `Test each point in both inequalities. For ${fmt([px, py])}: ${m(`${py} > ${a * px + b}`)} and ${m(`${py} < ${c * px + d}`)}, so both hold. Each other point fails at least one inequality.`),
        fmt([px, py]), ds);
    },
  ],
};

// ---------------- ADVANCED MATH ----------------

const equivExpr: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const a = r.nz(-7, 7), b = r.nz(-7, 7);
      const correct = m(expr([[1, "x^2"], [a + b, "x"], [a * b, ""]]));
      return mcq(r, B(`Which expression is equivalent to ${m(`(${expr([[1, "x"], [a, ""]])})(${expr([[1, "x"], [b, ""]])})`)}?`,
        `Use FOIL: ${m(`x^2 + ${b}x + ${a}x + ${a * b}`)}${""}, which simplifies to ${correct}.`.replace(/\+ -/g, "- ")),
        correct, [m(expr([[1, "x^2"], [a * b, ""]])), m(expr([[1, "x^2"], [a * b, "x"], [a + b, ""]])), m(expr([[1, "x^2"], [a + b, "x"], [-(a * b), ""]]))]);
    },
  ],
  M: [
    (r) => {
      const a = r.int(2, 9), b = r.nz(-9, 9), c = r.int(1, 8), d = r.nz(-9, 9);
      const correct = m(expr([[a - c, "x^2"], [b + d, "x"]]));
      return mcq(r, B(`Which expression is equivalent to ${m(`(${expr([[a, "x^2"], [b, "x"]])}) - (${expr([[c, "x^2"], [-d, "x"]])})`)}?`,
        `Distribute the subtraction: ${m(`${expr([[a, "x^2"], [b, "x"]])} ${expr([[-c, "x^2"], [d, "x"]]).startsWith("-") ? "" : "+ "}${expr([[-c, "x^2"], [d, "x"]])}`)}. Combine like terms to get ${correct}.`),
        correct, [m(expr([[a - c, "x^2"], [b - d, "x"]])), m(expr([[a + c, "x^2"], [b + d, "x"]])), m(expr([[a - c, "x^2"], [-(b + d), "x"]]))]);
    },
    (r) => {
      const p = r.int(1, 9), q = r.int(1, 9);
      if (p === q) return null;
      const correct = m(`(x - ${p})(x - ${q})`);
      return mcq(r, B(`Which expression is equivalent to ${m(`x^2 - ${p + q}x + ${p * q}`)}?`,
        `Find two numbers with product ${m(String(p * q))} and sum ${m(String(-(p + q)))}: ${m(`-${p}`)} and ${m(`-${q}`)}. So the expression factors as ${correct}.`),
        correct, [m(`(x + ${p})(x + ${q})`), m(`(x - ${p})(x + ${q})`), m(`(x - ${p * q})(x - 1)`)]);
    },
  ],
  H: [
    (r) => {
      const k = r.int(2, 9);
      return mcq(r, B(`Which expression is equivalent to ${m(`\\frac{x^2 - ${k * k}}{x + ${k}}`)} for ${m(`x \\ne -${k}`)}?`,
        `${m(`x^2 - ${k * k}`)} is a difference of squares: ${m(`(x - ${k})(x + ${k})`)}. Canceling ${m(`x + ${k}`)} leaves ${m(`x - ${k}`)}.`),
        m(`x - ${k}`), [m(`x + ${k}`), m(`x - ${k * k}`), m(`x^2 - ${k}`)]);
    },
    (r) => {
      const a = r.int(2, 5), b = r.int(1, 7), c = r.int(2, 5), d = r.int(1, 7);
      const A = a * c, Bc = a * d + b * c, C = b * d;
      return spr(B(`The expression ${m(`${A}x^2 + ${Bc}x + ${C}`)} can be written as ${m(`(${a}x + ${b})(px + q)`)}, where ${m("p")} and ${m("q")} are constants. What is the value of ${m("p + q")}?`,
        `Matching the ${m("x^2")} terms: ${m(`${a}p = ${A}`)}, so ${m(`p = ${c}`)}. Matching constants: ${m(`${b}q = ${C}`)}, so ${m(`q = ${d}`)}. Then ${m(`p + q = ${c + d}`)}.`), String(c + d));
    },
  ],
};

const nonlinearEq: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const s = r.int(2, 15);
      return spr(B(`What is the positive solution to ${m(`x^2 = ${s * s}`)}?`, `${m(`x = \\pm\\sqrt{${s * s}} = \\pm ${s}`)}. The positive solution is ${m(String(s))}.`), String(s));
    },
    (r) => {
      const s = r.int(2, 9), c = r.int(1, 20);
      return spr(B(`If ${m(`x^2 + ${c} = ${s * s + c}`)} and ${m("x > 0")}, what is the value of ${m("x")}?`, `Subtract ${m(String(c))}: ${m(`x^2 = ${s * s}`)}, so ${m(`x = ${s}`)}.`), String(s));
    },
  ],
  M: [
    (r) => {
      const r1 = r.int(-9, 9), r2 = r.int(-9, 9);
      if (r1 === r2) return null;
      const big = Math.max(r1, r2);
      return spr(B(`What is the greater of the two solutions to ${m(`${expr([[1, "x^2"], [-(r1 + r2), "x"], [r1 * r2, ""]])} = 0`)}?`,
        `Factor: ${m(`(x ${r1 < 0 ? "+" : "-"} ${Math.abs(r1)})(x ${r2 < 0 ? "+" : "-"} ${Math.abs(r2)}) = 0`)}. The solutions are ${m(String(r1))} and ${m(String(r2))}; the greater is ${m(String(big))}.`), String(big));
    },
    (r) => {
      const r1 = r.int(-9, 9), r2 = r.int(-9, 9), a = r.int(1, 3);
      if (r1 === r2) return null;
      return mcq(r, B(`What is the sum of the solutions to ${m(`${expr([[a, "x^2"], [-a * (r1 + r2), "x"], [a * r1 * r2, ""]])} = 0`)}?`,
        `For ${m("ax^2 + bx + c = 0")}, the sum of the solutions is ${m("-\\frac{b}{a}")} ${m(`= ${r1 + r2}`)}.`),
        m(String(r1 + r2)), nums([r1 * r2, -(r1 + r2) === r1 + r2 ? r1 + r2 + 2 : -(r1 + r2), r1 + r2 + a]));
    },
  ],
  H: [
    (r) => {
      const s = r.int(2, 10);
      return spr(B(`In the equation ${m(`x^2 + kx + ${s * s} = 0`)}, ${m("k")} is a positive constant. If the equation has exactly one real solution, what is the value of ${m("k")}?`,
        `Exactly one real solution means the discriminant is zero: ${m(`k^2 - 4(1)(${s * s}) = 0`)}, so ${m(`k^2 = ${4 * s * s}`)} and ${m(`k = ${2 * s}`)}.`), String(2 * s));
    },
    (r) => {
      const a = r.int(1, 4), b = r.int(-4, 4);
      // y = x^2 and y = a x + b: intersections count via discriminant a^2 + 4b
      const disc = a * a + 4 * b;
      const ans = disc > 0 ? "Exactly two" : disc === 0 ? "Exactly one" : "Zero";
      return mcq(r, B(`${m("y = x^2")}<br>${m(`y = ${expr([[a, "x"], [b, ""]])}`)}<br>How many distinct real solutions does the given system of equations have?`,
        `Set ${m(`x^2 = ${expr([[a, "x"], [b, ""]])}`)}, so ${m(`${expr([[1, "x^2"], [-a, "x"], [-b, ""]])} = 0`)}. The discriminant is ${m(`${a * a} + ${4 * b} = ${disc}`)}, so there ${disc > 0 ? "are two" : disc === 0 ? "is one" : "are no"} real solution${disc === 0 ? "" : "s"}.`),
        ans, ["Zero", "Exactly one", "Exactly two", "Infinitely many"].filter((x) => x !== ans));
    },
    (r) => {
      const s = r.int(2, 8), c = r.int(1, 9);
      // sqrt(x + c) = s
      return spr(B(`What is the solution to ${m(`\\sqrt{x + ${c}} = ${s}`)}?`, `Square both sides: ${m(`x + ${c} = ${s * s}`)}, so ${m(`x = ${s * s - c}`)}. Checking: ${m(`\\sqrt{${s * s}} = ${s}`)}.`), String(s * s - c));
    },
  ],
};

const nonlinearFn: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const c = r.nz(-9, 9), n = r.int(-6, 6), v = n * n + c;
      return mcq(r, B(`If ${m(`f(x) = ${expr([[1, "x^2"], [c, ""]])}`)}, what is the value of ${m(`f(${n})`)}?`,
        `${m(`f(${n}) = (${n})^2 ${c < 0 ? "-" : "+"} ${Math.abs(c)} = ${n * n} ${c < 0 ? "-" : "+"} ${Math.abs(c)} = ${v}`)}.`),
        m(String(v)), nums([2 * n + c, -n * n + c, n * n - c === v ? v + 1 : n * n - c]));
    },
  ],
  M: [
    (r) => {
      const p0 = r.pick([500, 800, 1200, 2000, 2500]), pct = r.pick([2, 3, 4, 5, 6, 8]);
      const g = (100 + pct) / 100;
      return mcq(r, B(`The population of a town is modeled by ${m(`P(t) = ${p0}(${g})^t`)}, where ${m("t")} is the number of years since 2020. Which of the following best describes how the population changes?`,
        `A factor of ${m(String(g))} means each year's population is ${100 + pct}% of the previous year's, which is a ${pct}% increase each year.`),
        `It increases by ${pct}% each year.`, [`It increases by ${pct * p0 / 100 === pct ? pct + 1 : Math.round(pct * p0 / 100)} people each year.`, `It increases by ${Math.round(g * 100)}% each year.`, `It decreases by ${pct}% each year.`]);
    },
    (r) => {
      const a = r.int(2, 5), n = r.int(2, 4);
      return spr(B(`If ${m(`g(x) = ${a}^x`)}, what is the value of ${m(`g(${n})`)}?`, `${m(`${a}^${n} = ${a ** n}`)}.`), String(a ** n));
    },
  ],
  H: [
    (r) => {
      const h = r.nz(-6, 6), k = r.int(-9, 9);
      const b = -2 * h, c = h * h + k;
      return spr(B(`The function ${m("f")} is defined by ${m(`f(x) = ${expr([[1, "x^2"], [b, "x"], [c, ""]])}`)}. What is the minimum value of ${m("f(x)")}?`,
        `Complete the square: ${m(`f(x) = (x ${h < 0 ? "+" : "-"} ${Math.abs(h)})^2 ${k < 0 ? "-" : "+"} ${Math.abs(k)}`)}. The squared term is at least ${m("0")}, so the minimum value is ${m(String(k))}, at ${m(`x = ${h}`)}.`), String(k));
    },
    (r) => {
      const r1 = r.int(-6, 6), r2 = r.int(-6, 6);
      if (r1 === r2) return null;
      return mcq(r, B(`The function ${m("f")} is defined by ${m(`f(x) = (x ${r1 < 0 ? "+" : "-"} ${Math.abs(r1)})(x ${r2 < 0 ? "+" : "-"} ${Math.abs(r2)})`)}. At what value of ${m("x")} does the graph of ${m("y = f(x)")} reach its vertex?`,
        `A parabola's vertex lies halfway between its ${m("x")}-intercepts, ${m(String(r1))} and ${m(String(r2))}: ${m(`x = \\frac{${r1} + ${r2}}{2} = ${frac(r1 + r2, 2)}`)}.`),
        m(frac(r1 + r2, 2)), [m(frac(-(r1 + r2), 2) === frac(r1 + r2, 2) ? "1" : frac(-(r1 + r2), 2)), m(String(r1 * r2)), m(String(r1 + r2 === 0 ? 2 : r1 + r2))]);
    },
  ],
};

// ---------------- PROBLEM-SOLVING & DATA ANALYSIS ----------------

const ratios: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const t = r.int(2, 5), rate = r.pick([45, 50, 55, 60, 65]), t2 = t + r.int(1, 4);
      return spr(B(`A car travels ${rate * t} miles in ${t} hours at a constant speed. At this speed, how many miles will the car travel in ${t2} hours?`,
        `Speed ${m(`= \\frac{${rate * t}}{${t}} = ${rate}`)} miles per hour. In ${t2} hours: ${m(`${rate} \\times ${t2} = ${rate * t2}`)} miles.`), String(rate * t2));
    },
    (r) => {
      const a = r.int(2, 7), b = r.int(2, 7), k = r.int(2, 9);
      if (gcd(a, b) !== 1) return null;
      return spr(B(`In a recipe, the ratio of cups of flour to cups of sugar is ${a} to ${b}. If ${b * k} cups of sugar are used, how many cups of flour are needed?`,
        `${m(`\\frac{${a}}{${b}} = \\frac{f}{${b * k}}`)}, so ${m(`f = ${a * k}`)}.`), String(a * k));
    },
  ],
  M: [
    (r) => {
      const ft = r.int(3, 30);
      return mcq(r, B(`A board is ${ft} feet long. What is its length in inches? (12 inches = 1 foot)`, `${m(`${ft} \\times 12 = ${ft * 12}`)} inches.`),
        m(String(ft * 12)), nums([ft * 3, ft * 10, ft * 36]));
    },
    (r) => {
      const kmh = r.pick([18, 36, 54, 72, 90, 108]);
      return spr(B(`A train travels at ${kmh} kilometers per hour. What is this speed in meters per second? (1 kilometer = 1,000 meters)`,
        `${m(`${kmh} \\cdot \\frac{1000 \\text{ m}}{1 \\text{ km}} \\cdot \\frac{1 \\text{ h}}{3600 \\text{ s}} = ${kmh / 3.6}`)} meters per second.`), String(kmh / 3.6));
    },
  ],
  H: [
    (r) => {
      const a = r.int(2, 6), b = r.int(2, 6), k = r.int(3, 12);
      if (gcd(a, b) !== 1) return null;
      return spr(B(`A jar contains only red and blue marbles in a ratio of ${a} to ${b}. There are ${(a + b) * k} marbles in the jar. How many more ${a > b ? "red" : "blue"} marbles than ${a > b ? "blue" : "red"} marbles are there?`,
        `Each "part" is ${m(`\\frac{${(a + b) * k}}{${a + b}} = ${k}`)} marbles. Red: ${m(String(a * k))}, blue: ${m(String(b * k))}. Difference: ${m(String(Math.abs(a - b) * k))}.`), String(Math.abs(a - b) * k));
    },
    (r) => {
      const density = r.pick([120, 150, 200, 250]), area = r.int(4, 30);
      return spr(B(`A county has a population density of ${density} people per square mile. A region of the county covers ${area} square miles. If the region's population density matches the county's, how many people live in the region?`,
        `Population ${m(`= \\text{density} \\times \\text{area} = ${density} \\times ${area} = ${density * area}`)}.`), String(density * area));
    },
  ],
};

const percents: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const p = r.pick([5, 10, 15, 20, 25, 30, 40, 60, 75]), n = r.pick([40, 60, 80, 120, 200, 240, 300, 400]);
      return spr(B(`What is ${p}% of ${n}?`, `${m(`0.${String(p).padStart(2, "0")} \\times ${n} = ${(p * n) / 100}`)}.`.replace("0.100", "1.00")), String((p * n) / 100));
    },
  ],
  M: [
    (r) => {
      const up = r.pick([10, 20, 25, 50]), down = r.pick([10, 20, 25, 40]);
      const final = (100 + up) * (100 - down) / 100;
      return mcq(r, B(`The price of a jacket is increased by ${up}%, and then the new price is decreased by ${down}%. The final price is what percent of the original price?`,
        `${m(`(1 + ${up / 100})(1 - ${down / 100}) = ${(100 + up) / 100} \\times ${(100 - down) / 100} = ${final / 100}`)}, so the final price is ${fmtNum(final)}% of the original.`),
        `${fmtNum(final)}%`, [`${100 + up - down}%`, `${100 - up - down}%`, `${fmtNum(100 + up + down)}%`]);
    },
    (r) => {
      const orig = r.pick([40, 60, 80, 120, 150, 200]), pct = r.pick([10, 15, 20, 25, 30]);
      const sale = orig * (100 - pct) / 100;
      return spr(B(`After a ${pct}% discount, the price of a pair of shoes is $${fmtNum(sale)}. What was the original price, in dollars?`,
        `${m(`${(100 - pct) / 100}p = ${sale}`)}, so ${m(`p = ${orig}`)}.`), String(orig));
    },
  ],
  H: [
    (r) => {
      const p = r.pick([20, 25, 50, 60]), q = r.pick([10, 20, 25, 40]);
      const v = (100 + p) * (100 - q) / 100;
      return spr(B(`The number ${m("a")} is ${p}% greater than ${m("b")}, and ${m("b")} is ${q}% less than ${m("c")}. The number ${m("a")} is what percent of ${m("c")}? (Disregard the % sign when entering your answer.)`,
        `${m(`a = ${(100 + p) / 100}b`)} and ${m(`b = ${(100 - q) / 100}c`)}, so ${m(`a = ${(100 + p) / 100}(${(100 - q) / 100})c = ${v / 100}c`)}. That is ${fmtNum(v)}% of ${m("c")}.`), String(v));
    },
    (r) => {
      const before = r.pick([200, 250, 400, 500, 800]), pct = r.pick([5, 12, 15, 35, 40]);
      const after = before * (100 + pct) / 100;
      return spr(B(`The number of members in a club grew from ${before} to ${fmtNum(after)}. By what percent did the membership increase? (Disregard the % sign when entering your answer.)`,
        `Increase ${m(`= ${fmtNum(after)} - ${before} = ${fmtNum(after - before)}`)}. ${m(`\\frac{${fmtNum(after - before)}}{${before}} = ${pct / 100}`)}, a ${pct}% increase.`), String(pct));
    },
  ],
};

const oneVar: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const n = r.int(4, 7), mean = r.int(5, 30);
      const xs = Array.from({ length: n - 1 }, () => mean + r.int(-6, 6));
      const last = mean * n - xs.reduce((a, b) => a + b, 0);
      if (last < 0) return null;
      const data = r.shuffle([...xs, last]);
      return spr(B(`What is the mean of the data set ${m(data.join(",\\ "))}?`, `Sum ${m(`= ${data.reduce((a, b) => a + b, 0)}`)}. Divide by ${m(String(n))}: mean ${m(`= ${mean}`)}.`), String(mean));
    },
    (r) => {
      const data = Array.from({ length: r.pick([5, 7]) }, () => r.int(1, 40)).sort((a, b) => a - b);
      const med = data[(data.length - 1) / 2];
      return mcq(r, B(`What is the median of the data set ${m(r.shuffle(data).join(",\\ "))}?`, `In order: ${m(data.join(",\\ "))}. The middle value is ${m(String(med))}.`),
        m(String(med)), nums([data[0], data[data.length - 1], Math.round(data.reduce((a, b) => a + b, 0) / data.length) === med ? med + 1 : Math.round(data.reduce((a, b) => a + b, 0) / data.length), data[data.length - 1] - data[0]]));
    },
  ],
  M: [
    (r) => {
      const data = Array.from({ length: r.pick([6, 8]) }, () => r.int(1, 30)).sort((a, b) => a - b);
      const k = data.length / 2;
      const med = (data[k - 1] + data[k]) / 2;
      return spr(B(`What is the median of the data set ${m(r.shuffle(data).join(",\\ "))}?`, `In order: ${m(data.join(",\\ "))}. With an even count, the median is the mean of the two middle values: ${m(`\\frac{${data[k - 1]} + ${data[k]}}{2} = ${med}`)}.`), String(med));
    },
    (r) => {
      const scores = Array.from({ length: 6 }, () => r.int(60, 95));
      const out = r.int(5, 30);
      return mcq(r, B(`A teacher records the quiz scores ${m(scores.join(",\\ "))}. A seventh student scores ${m(String(out))}. Compared with the original six scores, how will the mean and median of all seven scores change?`,
        `The new score ${m(String(out))} is far below every other score. It pulls the mean down a lot, but the median moves only to the next value toward the low end, so the mean decreases more than the median.`),
        "The mean will decrease more than the median.", ["The median will decrease more than the mean.", "Both will increase.", "Neither will change."]);
    },
  ],
  H: [
    (r) => {
      const n = r.int(5, 12), mean = r.int(20, 80), v = r.int(10, 120);
      const total = n * mean + v;
      if (total % (n + 1) !== 0) return null;
      return spr(B(`The mean of ${n} numbers is ${mean}. When a new number is added to the list, the mean of all ${n + 1} numbers becomes ${total / (n + 1)}. What number was added?`,
        `Original sum ${m(`= ${n} \\times ${mean} = ${n * mean}`)}. New sum ${m(`= ${n + 1} \\times ${total / (n + 1)} = ${total}`)}. Added number ${m(`= ${total} - ${n * mean} = ${v}`)}.`), String(v));
    },
    (r) => {
      const base = Array.from({ length: 5 }, () => r.int(10, 20));
      const spread = base.map((x, i) => (i % 2 ? x + 15 : x - 8));
      return mcq(r, B(`Data set A: ${m(base.join(",\\ "))}<br>Data set B: ${m(spread.join(",\\ "))}<br>Which statement about the standard deviations of the two data sets is true?`,
        `Standard deviation measures spread from the mean. Data set B's values lie much farther from their mean than data set A's do, so B has the larger standard deviation.`),
        "The standard deviation of data set B is greater.", ["The standard deviation of data set A is greater.", "The standard deviations are equal.", "There is not enough information to compare them."]);
    },
  ],
};

const twoVar: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const a = r.pick([1.5, 2, 2.5, 3, 4]), b = r.int(5, 40), x = r.int(4, 20), y = b + a * x;
      return spr(B(`A line of best fit for a scatterplot of data is ${m(`y = ${b} + ${a}x`)}. What ${m("y")}-value does the line predict when ${m(`x = ${x}`)}?`,
        `${m(`y = ${b} + ${a}(${x}) = ${fmtNum(y)}`)}.`), String(y));
    },
  ],
  M: [
    (r) => {
      const slope = r.pick([2.4, 3.5, 4.2, 12, 15]), inter = r.int(10, 60);
      return mcq(r, B(`The line of best fit for data about a plant's height ${m("h")}, in centimeters, ${m("t")} weeks after planting is ${m(`h = ${slope}t + ${inter}`)}. What is the best interpretation of ${m(String(slope))} in this context?`,
        `The slope is the predicted change in ${m("h")} per one-unit change in ${m("t")}: the predicted height increase each week.`),
        `The predicted increase in the plant's height, in centimeters, for each additional week`, [`The predicted height, in centimeters, of the plant when it was planted`, `The predicted number of weeks for the plant to grow ${inter} centimeters`, `The predicted total height, in centimeters, after one week`]);
    },
  ],
  H: [
    (r) => {
      const xs = [1, 2, 3, 4, 5, 6];
      const b0 = r.pick([2, 3, 5]), g = r.pick([2, 3]);
      const ys = xs.map((x) => b0 * g ** x);
      return mcq(r, B(`The table shows values of ${m("x")} and ${m("y")}. Which type of model best fits the data?`,
        `Each time ${m("x")} increases by ${m("1")}, ${m("y")} is multiplied by ${m(String(g))}. A constant ratio (rather than a constant difference) indicates exponential growth.`,
        { table: { headers: ["x", "y"], rows: xs.map((x, i) => [x, ys[i]]) } }),
        "Increasing exponential", ["Increasing linear", "Decreasing exponential", "Decreasing linear"]);
    },
  ],
};

const probability: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const red = r.int(2, 12), blue = r.int(2, 12), green = r.int(2, 12), t = red + blue + green;
      return mcq(r, B(`A bag contains ${red} red, ${blue} blue, and ${green} green tiles. If one tile is chosen at random, what is the probability that it is blue?`,
        `${m(`P(\\text{blue}) = \\frac{${blue}}{${t}}`)}${gcd(blue, t) > 1 ? `${m(` = ${frac(blue, t)}`)}` : ""}.`),
        m(frac(blue, t)), [m(frac(blue, red + green)), m(frac(red, t)), m(frac(1, 3))]);
    },
  ],
  M: [
    (r) => {
      const a = r.int(10, 40), b = r.int(10, 40), c = r.int(10, 40), d = r.int(10, 40);
      const tbl = { headers: ["", "Owns a pet", "No pet", "Total"], rows: [["Grade 9", a, b, a + b], ["Grade 10", c, d, c + d], ["Total", a + c, b + d, a + b + c + d]] as (string | number)[][] };
      return mcq(r, B(`The table summarizes a survey of students. If a student who owns a pet is chosen at random, what is the probability that the student is in grade 10?`,
        `Restrict to students who own a pet: ${m(String(a + c))}. Of those, ${m(String(c))} are in grade 10, so the probability is ${m(`\\frac{${c}}{${a + c}}`)}.`, { table: tbl }),
        m(frac(c, a + c)), [m(frac(c, c + d)), m(frac(c, a + b + c + d)), m(frac(a, a + c))]);
    },
  ],
  H: [
    (r) => {
      const a = r.int(5, 30), b = r.int(5, 30), c = r.int(5, 30), d = r.int(5, 30);
      const tbl = { headers: ["", "Morning", "Evening", "Total"], rows: [["Walks", a, b, a + b], ["Runs", c, d, c + d], ["Total", a + c, b + d, a + b + c + d]] as (string | number)[][] };
      return mcq(r, B(`The table shows when members of a fitness club exercise and how. A member is chosen at random from those who exercise in the evening. What is the probability that the member runs?`,
        `Evening members: ${m(String(b + d))}. Of those, ${m(String(d))} run, so ${m(`P = \\frac{${d}}{${b + d}}`)}.`, { table: tbl }),
        m(frac(d, b + d)), [m(frac(d, c + d)), m(frac(d, a + b + c + d)), m(frac(b, b + d))]);
    },
  ],
};

const inference: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const n = r.pick([50, 80, 100, 200]), k = r.int(5, n / 2), pop = r.pick([1000, 2000, 5000, 10000]);
      const est = (k / n) * pop;
      if (!Number.isInteger(est)) return null;
      return spr(B(`In a random sample of ${n} students at a school of ${pop.toLocaleString()} students, ${k} said they walk to school. Based on this sample, what is the best estimate of the number of students at the school who walk to school?`,
        `Sample proportion ${m(`= \\frac{${k}}{${n}}`)}. Estimate ${m(`= \\frac{${k}}{${n}} \\times ${pop} = ${est}`)}.`), String(est));
    },
  ],
  M: [
    (r) => {
      const p = r.int(30, 70), moe = r.pick([2, 3, 4, 5]);
      return mcq(r, B(`A random sample of voters found that ${p}% support a new park, with an associated margin of error of ${moe} percentage points. Which conclusion is most appropriate?`,
        `The margin of error gives a plausible range for the population value: ${p - moe}% to ${p + moe}%. It does not guarantee the exact percentage.`),
        `It is plausible that between ${p - moe}% and ${p + moe}% of all voters support the park.`,
        [`Exactly ${p}% of all voters support the park.`, `Between ${p - 2 * moe}% and ${p + 2 * moe}% of the sample supports the park.`, `At least ${p + moe}% of all voters support the park.`]);
    },
  ],
  H: [
    (r) => {
      const n1 = r.pick([100, 200]), n2 = n1 * 4;
      return mcq(r, B(`Two researchers each estimate the mean height of the same plant species. Researcher A uses a random sample of ${n1} plants, and Researcher B uses a random sample of ${n2} plants. Which is most likely true about the margins of error of their estimates?`,
        `Larger random samples produce less variable estimates, so B's larger sample is expected to have the smaller margin of error.`),
        "Researcher B's margin of error is likely smaller.", ["Researcher A's margin of error is likely smaller.", "The margins of error will be equal.", "Margin of error does not depend on sample size."]);
    },
  ],
};

const STUDY_CONTEXTS = [
  { pop: "residents of a city", treat: "drink green tea daily", out: "sleep quality" },
  { pop: "students at a high school", treat: "use a flashcard app", out: "vocabulary test scores" },
  { pop: "employees at a company", treat: "take a midday walk", out: "afternoon productivity" },
  { pop: "patients at a clinic", treat: "follow a stretching routine", out: "back pain" },
  { pop: "gardeners in a region", treat: "use a new fertilizer", out: "tomato yield" },
  { pop: "middle school students", treat: "read for 20 minutes each night", out: "reading fluency" },
  { pop: "members of a gym", treat: "listen to music while exercising", out: "workout duration" },
  { pop: "commuters in a county", treat: "ride a bicycle to work", out: "reported stress levels" },
];

const stats: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const c = r.pick(STUDY_CONTEXTS);
      return mcq(r, B(`Researchers selected 300 ${c.pop} at random. They randomly assigned half to ${c.treat} for a month and half not to. The group that was assigned to ${c.treat} showed better ${c.out}. Which conclusion is best supported?`,
        `Random assignment to the treatment lets researchers conclude cause and effect. Random selection lets them generalize to the population sampled: ${c.pop}.`),
        `Being assigned to ${c.treat} likely causes better ${c.out} for ${c.pop}.`,
        [`Being assigned to ${c.treat} causes better ${c.out} for all people.`, `There is no relationship between the two variables.`, `No conclusion about cause can be drawn.`]);
    },
  ],
  M: [
    (r) => {
      const c = r.pick(STUDY_CONTEXTS);
      return mcq(r, B(`A survey of 500 ${c.pop} found that those who ${c.treat} reported better ${c.out} than those who did not. The participants chose for themselves whether to ${c.treat}. Which conclusion is most appropriate?`,
        `This is an observational study without random assignment, so it can show an association but not cause and effect.`),
        `There is an association between choosing to ${c.treat} and better ${c.out}, but causation cannot be concluded.`,
        [`Choosing to ${c.treat} causes better ${c.out}.`, `Better ${c.out} causes people to ${c.treat}.`, `There is no association between the variables.`]);
    },
  ],
  H: [
    (r) => {
      const c = r.pick(STUDY_CONTEXTS);
      return mcq(r, B(`A researcher wants to estimate how many ${c.pop} ${c.treat}. She surveys volunteers who responded to an online post. Which is the most significant flaw in this method?`,
        `Volunteers who respond to a post choose themselves (a self-selected sample), so the sample is likely not representative of the population.`),
        `The sample is self-selected and may not represent the population.`,
        [`The sample is too large to be useful.`, `Online surveys cannot record numerical data.`, `The researcher did not use a control group.`]);
    },
  ],
};

// ---------------- GEOMETRY & TRIG ----------------

const area: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const l = r.int(3, 20), w = r.int(2, 15);
      return spr(B(`A rectangle has a length of ${l} centimeters and a width of ${w} centimeters. What is the area, in square centimeters, of the rectangle?`, `Area ${m(`= ${l} \\times ${w} = ${l * w}`)}.`), String(l * w));
    },
    (r) => {
      const b = r.int(2, 20) * 2, h = r.int(2, 15);
      return spr(B(`A triangle has a base of ${b} inches and a height of ${h} inches. What is the area, in square inches, of the triangle?`, `${m(`\\frac{1}{2} \\times ${b} \\times ${h} = ${(b * h) / 2}`)}.`), String((b * h) / 2));
    },
  ],
  M: [
    (r) => {
      const rr = r.int(2, 9), h = r.int(2, 12);
      return mcq(r, B(`A right circular cylinder has a radius of ${rr} and a height of ${h}. What is the volume of the cylinder?`, `${m(`V = \\pi r^2 h = \\pi (${rr})^2 (${h}) = ${rr * rr * h}\\pi`)}.`),
        m(`${rr * rr * h}\\pi`), [m(`${2 * rr * h}\\pi`), m(`${rr * h}\\pi`), m(`${rr * rr * h * 2}\\pi`)]);
    },
    (r) => {
      const s = r.int(2, 12);
      return spr(B(`A cube has a surface area of ${6 * s * s} square units. What is the volume, in cubic units, of the cube?`, `Each face has area ${m(`${6 * s * s} \\div 6 = ${s * s}`)}, so an edge is ${m(String(s))}. Volume ${m(`= ${s}^3 = ${s ** 3}`)}.`), String(s ** 3));
    },
  ],
  H: [
    (r) => {
      const k = r.pick([2, 3, 4]);
      return spr(B(`Each edge length of a rectangular prism is multiplied by ${k}. The volume of the new prism is how many times the volume of the original prism?`, `Volume scales by the cube of the scale factor: ${m(`${k}^3 = ${k ** 3}`)}.`), String(k ** 3));
    },
    (r) => {
      const rr = r.int(2, 9);
      return mcq(r, B(`A sphere has a volume of ${m(`${frac(4 * rr ** 3, 3)}\\pi`)} cubic units. What is the radius of the sphere?`, `${m(`\\frac{4}{3}\\pi r^3 = ${frac(4 * rr ** 3, 3)}\\pi`)} gives ${m(`r^3 = ${rr ** 3}`)}, so ${m(`r = ${rr}`)}.`),
        m(String(rr)), nums([rr * rr, rr + 1, 2 * rr]));
    },
  ],
};

const angles: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const a = r.int(20, 160);
      return spr(B(`Two angles form a linear pair. One angle measures ${a}°. What is the measure, in degrees, of the other angle?`, `Angles in a linear pair are supplementary: ${m(`180 - ${a} = ${180 - a}`)}.`), String(180 - a));
    },
    (r) => {
      const a = r.int(20, 90), b = r.int(20, 160 - a);
      return mcq(r, B(`In triangle ${m("ABC")}, the measure of angle ${m("A")} is ${a}° and the measure of angle ${m("B")} is ${b}°. What is the measure of angle ${m("C")}?`, `The angles of a triangle sum to 180°: ${m(`180 - ${a} - ${b} = ${180 - a - b}`)}.`),
        `${180 - a - b}°`, [`${a + b}°`, `${360 - a - b}°`, `${Math.abs(a - b) === 180 - a - b ? 90 : Math.abs(a - b)}°`]);
    },
  ],
  M: [
    (r) => {
      const x = r.int(10, 40), k = r.int(2, 3);
      if (x * (k + 1) >= 180) return null;
      const other = 180 - x * (k + 1);
      return spr(B(`In a triangle, one angle measures ${m("x")}°, a second angle measures ${m(`${k}x`)}°, and the third angle measures ${other}°. What is the value of ${m("x")}?`, `${m(`x + ${k}x + ${other} = 180`)}, so ${m(`${k + 1}x = ${180 - other}`)} and ${m(`x = ${x}`)}.`), String(x));
    },
    (r) => {
      const a = r.int(35, 145);
      if (a === 90) return null;
      return spr(B(`Two parallel lines are cut by a transversal. Two same-side interior angles are formed; one of them measures ${a}°. What is the measure, in degrees, of the other?`,
        `Same-side (consecutive) interior angles formed by parallel lines are supplementary: ${m(`180 - ${a} = ${180 - a}`)}.`), String(180 - a));
    },
  ],
  H: [
    (r) => {
      const s1 = r.int(3, 9), k = r.pick([2, 3, 1.5, 2.5]), s2 = r.int(4, 12);
      const big = s2 * k;
      return spr(B(`Triangles ${m("PQR")} and ${m("STU")} are similar, with ${m("P")} corresponding to ${m("S")} and ${m("Q")} corresponding to ${m("T")}. If ${m(`PQ = ${s2}`)}, ${m(`ST = ${fmtNum(big)}`)}, and ${m(`QR = ${s1}`)}, what is the length of ${m("TU")}?`,
        `The scale factor from ${m("PQR")} to ${m("STU")} is ${m(`\\frac{${fmtNum(big)}}{${s2}} = ${k}`)}. So ${m(`TU = ${k} \\times ${s1} = ${fmtNum(s1 * k)}`)}.`), String(s1 * k));
    },
    (r) => {
      const n = r.pick([5, 6, 8, 9, 10, 12]);
      return spr(B(`What is the measure, in degrees, of each interior angle of a regular polygon with ${n} sides?`, `The interior angles sum to ${m(`(${n} - 2) \\times 180 = ${(n - 2) * 180}`)}. Each angle: ${m(`${(n - 2) * 180} \\div ${n} = ${fmtNum(((n - 2) * 180) / n)}`)}.`), String(((n - 2) * 180) / n));
    },
  ],
};

const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
const rightTri: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const [a, b, c] = r.pick(TRIPLES), k = r.int(1, 4);
      return spr(B(`A right triangle has legs of length ${a * k} and ${b * k}. What is the length of the hypotenuse?`, `${m(`c = \\sqrt{${a * k}^2 + ${b * k}^2} = \\sqrt{${(a * k) ** 2 + (b * k) ** 2}} = ${c * k}`)}.`), String(c * k));
    },
  ],
  M: [
    (r) => {
      const [a, b, c] = r.pick(TRIPLES);
      return mcq(r, B(`In right triangle ${m("ABC")}, angle ${m("C")} is the right angle, ${m(`BC = ${a}`)}, ${m(`AC = ${b}`)}, and ${m(`AB = ${c}`)}. What is ${m("\\sin A")}?`,
        `${m("\\sin A = \\frac{\\text{opposite}}{\\text{hypotenuse}}")}. The side opposite ${m("A")} is ${m(`BC = ${a}`)}, so ${m(`\\sin A = \\frac{${a}}{${c}}`)}.`),
        m(`\\frac{${a}}{${c}}`), [m(`\\frac{${b}}{${c}}`), m(`\\frac{${a}}{${b}}`), m(`\\frac{${c}}{${a}}`)]);
    },
    (r) => {
      const [a, , c] = r.pick(TRIPLES), k = r.int(2, 5);
      const b = Math.sqrt(c * c - a * a);
      return spr(B(`A right triangle has a hypotenuse of length ${c * k} and one leg of length ${a * k}. What is the length of the other leg?`, `${m(`\\sqrt{${c * k}^2 - ${a * k}^2} = \\sqrt{${(c * k) ** 2 - (a * k) ** 2}} = ${b * k}`)}.`), String(b * k));
    },
  ],
  H: [
    (r) => {
      const s = r.int(2, 12);
      return mcq(r, B(`In a 30°-60°-90° triangle, the side opposite the 30° angle has length ${s}. What is the length of the side opposite the 60° angle?`,
        `The sides are in the ratio ${m("1 : \\sqrt{3} : 2")}, so the side opposite 60° is ${m(`${s}\\sqrt{3}`)}.`),
        m(`${s}\\sqrt{3}`), [m(String(2 * s)), m(`${s}\\sqrt{2}`), m(`\\frac{${s}}{2}`)]);
    },
    (r) => {
      const [a, b, c] = r.pick(TRIPLES);
      return mcq(r, B(`In right triangle ${m("XYZ")}, angle ${m("Z")} is the right angle and ${m(`\\cos X = \\frac{${b}}{${c}}`)}. What is ${m("\\sin Y")}?`,
        `The acute angles of a right triangle are complementary, and ${m("\\sin Y = \\cos(90° - Y) = \\cos X")}. So ${m(`\\sin Y = \\frac{${b}}{${c}}`)}.`),
        m(`\\frac{${b}}{${c}}`), [m(`\\frac{${a}}{${c}}`), m(`\\frac{${c}}{${b}}`), m(`\\frac{${a}}{${b}}`)]);
    },
  ],
};

const circles: Partial<Record<Difficulty, Gen[]>> = {
  E: [
    (r) => {
      const rr = r.int(2, 15);
      return mcq(r, B(`A circle has a radius of ${rr}. What is the circumference of the circle?`, `${m(`C = 2\\pi r = 2\\pi(${rr}) = ${2 * rr}\\pi`)}.`),
        m(`${2 * rr}\\pi`), [m(`${rr * rr}\\pi`), m(`${rr}\\pi`), m(`${4 * rr}\\pi`)]);
    },
  ],
  M: [
    (r) => {
      const h = r.nz(-8, 8), k = r.nz(-8, 8), rr = r.int(2, 9);
      return spr(B(`The equation of a circle in the ${m("xy")}-plane is ${m(`(x ${h < 0 ? "+" : "-"} ${Math.abs(h)})^2 + (y ${k < 0 ? "+" : "-"} ${Math.abs(k)})^2 = ${rr * rr}`)}. What is the radius of the circle?`,
        `In ${m("(x - h)^2 + (y - k)^2 = r^2")}, ${m(`r^2 = ${rr * rr}`)}, so ${m(`r = ${rr}`)}.`), String(rr));
    },
    (r) => {
      const rr = r.int(2, 12), deg = r.pick([30, 45, 60, 90, 120, 180]);
      const num = 2 * rr * deg, den = 360;
      return mcq(r, B(`A circle has a radius of ${rr}. What is the length of an arc of the circle that is intercepted by a central angle of ${deg}°?`,
        `Arc length ${m(`= \\frac{${deg}}{360} \\times 2\\pi(${rr}) = ${frac(num, den)}\\pi`)}.`),
        m(`${frac(num, den)}\\pi`), [m(`${frac(rr * rr * deg, 360)}\\pi`), m(`${2 * rr}\\pi`), m(`${frac(num, 180)}\\pi`)]);
    },
  ],
  H: [
    (r) => {
      const h = r.nz(-6, 6), k = r.nz(-6, 6), rr = r.int(2, 8);
      const D = -2 * h, E = -2 * k, F = h * h + k * k - rr * rr;
      return spr(B(`The equation ${m(`${expr([[1, "x^2"], [D, "x"], [1, "y^2"], [E, "y"]])} = ${-F}`)} defines a circle in the ${m("xy")}-plane. What is the radius of the circle?`,
        `Complete the square: ${m(`(x ${h < 0 ? "+" : "-"} ${Math.abs(h)})^2 + (y ${k < 0 ? "+" : "-"} ${Math.abs(k)})^2 = ${-F} + ${h * h} + ${k * k} = ${rr * rr}`)}. So ${m(`r = ${rr}`)}.`), String(rr));
    },
    (r) => {
      const rr = r.int(3, 12), deg = r.pick([40, 60, 72, 90, 120, 150]);
      return spr(B(`A sector of a circle with radius ${rr} has a central angle of ${deg}°. The area of the sector is ${m("a\\pi")}. What is the value of ${m("a")}?`,
        `Sector area ${m(`= \\frac{${deg}}{360} \\times \\pi(${rr})^2 = ${frac(deg * rr * rr, 360)}\\pi`)}.`), fracPlain(deg * rr * rr, 360));
    },
  ],
};

export function generateMath(perCell: number, seed = 2026): Question[] {
  const A = "Algebra", AM = "Advanced Math", P = "Problem-Solving and Data Analysis", G = "Geometry and Trigonometry";
  return collect(
    "math",
    {
      "Linear equations in one variable": { domain: A, byDiff: linOneVar },
      "Linear functions": { domain: A, byDiff: linFunc },
      "Linear equations in two variables": { domain: A, byDiff: linTwoVar },
      "Systems of two linear equations in two variables": { domain: A, byDiff: systems },
      "Linear inequalities in one or two variables": { domain: A, byDiff: inequalities },
      "Equivalent expressions": { domain: AM, byDiff: equivExpr },
      "Nonlinear equations in one variable and systems of equations in two variables": { domain: AM, byDiff: nonlinearEq },
      "Nonlinear functions": { domain: AM, byDiff: nonlinearFn },
      "Ratios, rates, proportional relationships, and units": { domain: P, byDiff: ratios },
      Percentages: { domain: P, byDiff: percents },
      "One-variable data: distributions and measures of center and spread": { domain: P, byDiff: oneVar },
      "Two-variable data: models and scatterplots": { domain: P, byDiff: twoVar },
      "Probability and conditional probability": { domain: P, byDiff: probability },
      "Inference from sample statistics and margin of error": { domain: P, byDiff: inference },
      "Evaluating statistical claims: observational studies and experiments": { domain: P, byDiff: stats },
      "Area and volume": { domain: G, byDiff: area },
      "Lines, angles, and triangles": { domain: G, byDiff: angles },
      "Right triangles and trigonometry": { domain: G, byDiff: rightTri },
      Circles: { domain: G, byDiff: circles },
    },
    perCell,
    seed,
  );
}

export type { R };
