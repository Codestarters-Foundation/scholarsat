import { fracPlain, m } from "./lib";
import type { Table } from "../src/lib/types";

export type MathForm = { stem: string; answer: number | string; why: string; wrong?: (number | string)[]; table?: Table };
/** Transfer questions ask for an interpretation, a parameter or a second quantity. */
export function modelForm(skill:number, alternate:boolean, i:number): MathForm {
  const k=i+4, a=3+i%7, b=2+Math.floor(i/7), n=10+i;
  const model=(stem:string,answer:number|string,why:string,table?:Table): MathForm=>({stem,answer,why,table});
  switch(skill) {
    case 0: return alternate
      ? model(`Two contractors quote $${4*n} plus $${a+2} per hour and $${6*n} plus $${a} per hour. At the duration when their prices agree, what is the price in dollars?`,(4+a+2)*n,`The second flat fee exceeds the first by ${2*n}. The first hourly rate is $2 greater, so the quotes meet after ${n} hours. Substitute that duration into either quote to get $${(a+6)*n}.`)
      : model(`The equation ${m(`p(x-${a})=${b}x+${n}`)} has no solution for x. What is p?`,b,`The x terms must cancel while the constants differ. Matching their coefficients gives p = ${b}. The left constant then equals −${a*b}, which differs from ${n}.`);
    case 1: return alternate
      ? model(`The table gives two readings from a sensor with a linear response. At what input does the output first reach ${k+8*a}?`,b+8,`Each extra input unit adds (${k+3*a} − ${k})/3 = ${a} to the output. An increase of ${8*a} from the first reading therefore takes 8 input units.`,{headers:["Input","Output"],rows:[[b,k],[b+3,k+3*a]]})
      : model(`A machine produces ${a*n} labels in ${n} minutes at a constant rate. Function g gives the total labels produced since startup as a function of elapsed hours. What is the slope of g?`,60*a,`The rate is ${a*n}/${n} = ${a} labels per minute. The input to g is hours, so multiply the rate by 60 to get ${60*a} labels per hour.`);
    case 2: return alternate
      ? model(`A line perpendicular to ${m(`y=${a}x+${n}`)} passes through (0, ${k}). What is its x-intercept?`,a*k,`The perpendicular slope is −1/${a}. Starting at height ${k}, the line must travel ${a*k} units right to reach height zero.`)
      : model(`The equation ${m(`x+${a}y=${n*a}`)} models a fixed fabric budget for x small pieces and y large ones. Keeping the total unchanged, reducing y by ${b} permits how many additional small pieces?`,a*b,`Each large piece consumes the budget for ${a} small ones. Giving up ${b} large pieces frees enough for ${a*b} small pieces.`);
    case 3: return alternate
      ? model(`The lines ${m(`y=${a}x+${n}`)} and ${m(`${b}y=${a*b}x+c`)} meet at more than one point. What is c?`,b*n,`Lines sharing more than one point coincide. Multiply the entire first equation by ${b}; the constant must be ${b} × ${n} = ${b*n}.`)
      : model(`A shop fills ${n} boxes with either ${a} or ${a+3} rolls apiece. Together the boxes hold ${a*n+3*b} rolls. How many rolls are in the more heavily filled boxes altogether?`,(a+3)*b,`Filling every box with ${a} accounts for ${a*n} rolls. The extra ${3*b} identify ${b} larger boxes. Each has ${a+3} rolls, for ${(a+3)*b} in those boxes.`);
    case 4: return alternate
      ? model(`A pallet must hold at least ${n+b} boxes with total mass at most ${a*(n+b)+2*b} kg. Light boxes weigh ${a} kg and heavy boxes weigh ${a+2} kg. What is the greatest possible number of heavy boxes?`,b,`The minimum box count at the light weight uses ${a*(n+b)} kg, leaving ${2*b} kg for upgrades. Each heavy box adds 2 kg. Loading more than the minimum number of boxes cannot increase that allowance.`)
      : model(`How many integer values satisfy ${m(`${a*k}<${a}x\\le ${a*(k+b)}`)}?`,b,`Divide all three parts by positive ${a}: ${k} < x ≤ ${k+b}. Counting the integers from ${k+1} through ${k+b} gives ${b}.`);
    case 5: return alternate
      ? model(`The polynomial ${m(`x^2+px+${a*n}`)} has x + ${a} as a factor. What is p?`,a+n,`Substitute x = −${a}, the factor’s zero. This gives ${a*a} − ${a}p + ${a*n} = 0, so p = ${a+n}.`)
      : model(`For all positive t, ${m(`\\sqrt[${b}]{t^{${b*n+a}}}=t^{p/${b}}`)}. What is p − ${a}?`,b*n,`Writing the root as a power gives exponent ${b*n+a}/${b}. With equal denominators and equality for every positive t, p = ${b*n+a}; subtract ${a} to get ${b*n}.`);
    case 6: return alternate
      ? model(`The graphs ${m(`y=x^2`)} and ${m(`y=${a+n}x-${a*n}`)} intersect twice. What is the difference between the larger and smaller x-coordinates?`,n-a,`Equate the two expressions and factor: (x − ${a})(x − ${n}) = 0. The required distance along the x-axis is ${n} − ${a} = ${n-a}.`)
      : model(`The equation ${m(`|x-${k}|=${a}`)} has two solutions. What is the sum of their squares?`,2*(k*k+a*a),`The two solutions are ${k-a} and ${k+a}. Square each separately and add: ${(k-a)**2} + ${(k+a)**2} = ${2*(k*k+a*a)}.`);
    case 7: return alternate
      ? model(`A tank's remaining dye is modeled by ${m(`D(t)=${n*16}(1/2)^{t/${a}}`)} grams. After how many hours will exactly ${n*2} grams remain?`,3*a,`The starting amount must be divided by 8. That takes three halvings; each takes ${a} hours, for a total of ${3*a} hours.`)
      : model(`A parabola has zeros at ${b} and ${b+2*a}. A second parabola is obtained by shifting it ${n} units right. What is the x-coordinate of the new axis of symmetry?`,b+a+n,`The original axis is midway between the zeros, at x = ${b+a}. Shifting the entire graph right by ${n} moves the axis to x = ${b+a+n}.`);
    case 8: return alternate
      ? model(`A scale model uses 1 cm for every ${a} meters of actual length. A rectangular floor occupies ${n} square centimeters in the model. What is the actual floor area in square meters?`,n*a*a,`Both dimensions scale by ${a} when model centimeters become actual meters. One model square centimeter represents ${a*a} square meters, so multiply the model area by ${a*a}.`)
      : model(`A vehicle completes two equal ${6*n}-kilometer legs, one at ${3*n} km/h and one at ${2*n} km/h. What is its average speed for the whole trip, in km/h?`,fracPlain(12*n,5),`The first leg takes 2 hours and the second takes 3. Use total distance over total time: ${12*n}/5 km/h. Averaging the two speeds would give equal weight to unequal travel times.`);
    case 9: return alternate
      ? model(`The percent of riders using a weekly pass increases from ${a*5}% to ${a*6}% while the total number of riders remains ${100*n}. By what percent did the number of weekly pass users increase?`,20,`The increase is ${a} percentage points relative to a starting level of ${5*a} percent. Their ratio is 1/5, which is a 20% increase in the number of pass users when total ridership is fixed.`)
      : model(`A mixture of ${10*n} grams is 30% sand by mass. How many grams of pure sand must be added to make the mixture 50% sand?`,4*n,`The mixture contains ${3*n} grams of sand and ${7*n} grams of other material. For a 50% mixture these masses must be equal, so add ${7*n} − ${3*n} grams of sand.`);
    case 10: return alternate
      ? model(`The table gives the complete distribution of scores. What is the median score?`,n+a,`The first ${b} observations are ${n}. Both middle positions of the ${4*b} observations fall in the next block of ${2*b} scores, each equal to ${n+a}.`,{headers:["Score","Frequency"],rows:[[n,b],[n+a,2*b],[n+2*a,b]]})
      : model(`The mean of ${a} values is ${n}. One recorded value of ${n+b} should have been ${n+b+a*2}. What is the corrected mean?`,n+2,`The correction increases the sum by ${2*a} while the number of values stays ${a}. The mean therefore rises by 2, from ${n} to ${n+2}.`);
    case 11: return alternate
      ? model(`A curved model predicts ${k} units at x = 0, ${2*k} at x = 1, and ${4*k} at x = 2. If each unit increase in x continues to multiply the prediction by the same factor, what is predicted at x = 4?`,16*k,`The ratio between successive predictions is 2. Starting at x = 2, double the value twice: ${4*k} × 2² = ${16*k}.`)
      : model(`The table compares observations with a fitted line. What is the sum of the absolute residuals?`,a+b+1,`Subtract prediction from observation for each row. The residuals are ${a}, −${b}, and 1; their absolute values sum to ${a+b+1}.`,{headers:["Input","Observed","Predicted"],rows:[[1,n+a,n],[2,n+4-b,n+4],[3,n+9,n+8]]});
    case 12: return alternate
      ? model(`One ticket is drawn at random from the entries in the table. Given that it was purchased online, what is the probability that it is for a matinee?`,fracPlain(n,n+a+b),`Use only online purchases. There are ${n} matinee tickets among ${n+a+b} online tickets; box-office purchases do not enter this calculation.`,{headers:["Purchase","Matinee","Evening"],rows:[["Online",n,a+b],["Box office",a,n+b]]})
      : model(`A fair coin is tossed independently of drawing one tile from a bag containing ${a} gold and ${n} silver tiles. What is the probability of getting heads and a gold tile?`,fracPlain(a,2*(a+n)),`Multiply the independent probabilities. Heads has probability 1/2 and gold has probability ${a}/${a+n}, so the joint probability is ${fracPlain(a,2*(a+n))}.`);
    case 13: return alternate
      ? model(`A random survey estimates that ${n+15}% of ${100*n} residents cycle weekly, with a margin of error of ${b} percentage points. What number of residents corresponds to the LOWER endpoint of the resulting interval?`,(n+15-b)*n,`The lower proportion is (${n+15} − ${b})/100. Multiplying by the population of ${100*n} gives ${(n+15-b)*n} residents.`)
      : model(`Two surveys report intervals for a population mean. The first interval is [${n}, ${n+4*a}], and the second interval has the same midpoint but half the first margin of error. What is the upper endpoint of the second interval?`,n+3*a,`The common midpoint is ${n+2*a}. The first margin is ${2*a}, so the second is ${a}. Add it to the midpoint to get ${n+3*a}.`);
    case 15: return alternate
      ? model(`Two similar solids have corresponding edges of ${b} and ${3*b} cm. The larger solid has volume ${27*n} cubic centimeters. What is the smaller solid’s volume?`,n,`The linear factor from smaller to larger is 3, so volume grows by 3³ = 27. Divide the larger volume by 27.`)
      : model(`An open box with a square base of side ${a} cm and height ${n} cm has no lid. What is its total material area in square centimeters, ignoring thickness?`,a*a+4*a*n,`Count the base once, then four rectangular sides. The total is ${a}² + 4 × ${a} × ${n} = ${a*a+4*a*n} square centimeters.`);
    case 16: return alternate
      ? model(`Two similar triangles have area ratio 1 to 9. A side of the smaller triangle measures ${n}, and the corresponding side of the larger is x + ${a}. What is x?`,3*n-a,`Take the square root of the area factor to get a length factor of 3. Thus x + ${a} = ${3*n} and x = ${3*n-a}.`)
      : model(`A triangle has two equal interior angles. Its third interior angle has an adjacent exterior angle of ${2*n+50}°. What is the measure in degrees of either equal angle?`,n+25,`The exterior angle equals the sum of the two remote interior angles. Those angles are equal, so each measures half of ${2*n+50}°, or ${n+25}°.`);
    case 17: return alternate
      ? model(`In a right triangle, the shorter and longer legs have ratio ${a} to ${n}. Relative to the smaller acute angle, what is the tangent of its complementary angle?`,fracPlain(n,a),`The smaller angle is opposite the shorter leg. Its complement is opposite the longer leg, so the requested tangent is longer/shorter = ${fracPlain(n,a)}.`)
      : model(`An equilateral triangle has side length ${2*n}. Its height is ${m("h\\sqrt{3}")}. What is h?`,n,`Drawing the altitude halves the base to ${n}. The resulting 30°–60°–90° triangle has long leg ${n}√3, so h = ${n}.`);
    case 18: return alternate
      ? model(`A wheel of diameter ${a} cm makes ${n} full rotations without slipping. Its travel distance is dπ meters. What is d?`,fracPlain(a*n,100),`Each rotation advances one circumference, ${a}π cm. Multiply by ${n} and divide by 100 to convert centimeters to meters.`)
      : model(`A circle of radius ${n} has a sector whose area is 1/${2*a} of the circle’s total area. If the arc length is cπ, what is c?`,fracPlain(n,a),`The sector and its arc occupy the same fraction of the circle. Multiply circumference 2π × ${n} by 1/${2*a}; the coefficient of π is ${fracPlain(n,a)}.`);
    default: throw new Error("No model form for this skill");
  }
}
