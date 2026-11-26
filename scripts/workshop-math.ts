import { modelForm, type MathForm } from "./workshop-models";
import { TAXONOMY, type Question, type Difficulty } from "../src/lib/types";
import { fracPlain, m, mcq, rng, spr } from "./lib";

const skills = TAXONOMY.math.flatMap(group => group.skills.map(skill => ({ domain: group.domain, skill })));
const contexts = [
  ["library members", "an automatic reminder", "returning books on time"],
  ["museum visitors", "a floor map", "finding the textile exhibit"],
  ["choir students", "a recorded warm-up", "matching the opening pitch"],
  ["garden volunteers", "a planting guide", "identifying a suitable plot"],
  ["commuters", "a platform diagram", "finding the correct train"],
  ["apprentice printers", "a color chart", "matching the requested ink"],
  ["festival guests", "a route card", "reaching the second venue"],
  ["trail walkers", "a contour map", "recognizing the steepest path"],
  ["new librarians", "a shelf guide", "locating a reserved title"],
  ["rowing students", "a timing cue", "matching the stroke rate"],
  ["language students", "a listening exercise", "recognizing the target sound"],
  ["weaving students", "a pattern key", "repeating the sample pattern"],
  ["pottery students", "a thickness gauge", "meeting the wall specification"],
  ["map readers", "a scale diagram", "estimating the trail length"],
  ["archive volunteers", "a handwriting guide", "transcribing a place name"],
  ["string players", "a tuning exercise", "matching a reference tone"],
  ["kayak trainees", "a practice demonstration", "completing the turn"],
  ["bookbinders", "a folding template", "aligning the signatures"],
  ["photography students", "a focus aid", "capturing the target sharply"],
  ["design students", "a contrast chart", "distinguishing two shades"],
];
const fmt = (x: number) => String(Number(x.toFixed(6)));
type Form = MathForm;
function form(skill: number, f: number, i: number): Form {
  const a = 3 + i % 9, b = 4 + Math.floor(i / 9), k = i + 7, n = i + 12;
  const num = (stem: string, answer: number | string, why: string, wrong?: (number|string)[]): Form => ({ stem, answer, why, wrong });
  const x = m("x");
  switch (skill) {
    case 0: return [
      num(`A printer charges a setup fee of $${k} and $${a} per poster. An invoice for a single run totals $${k+a*n}. How many posters were printed?`, n, `Subtract the $${k} setup fee before dividing. The remaining $${a*n} buys ${a*n} ÷ ${a} = ${n} posters.`, [a*n,n+1,k+n]),
      num(`If ${m(`${a}(x-${b})=${a*(k-b)}`)}, what is the value of ${m("2x+1")}?`, 2*k+1, `Divide by ${a} and add ${b} to get x = ${k}. Substitute into the requested expression to obtain 2(${k}) + 1 = ${2*k+1}.`),
      num(`A tank holding ${a*n+k} liters is drained at ${a} liters per minute. How many minutes pass before exactly ${k} liters remain?`,n,`Only ${a*n+k} − ${k} = ${a*n} liters leave the tank. Divide that amount by the rate of ${a} liters per minute.`),
      num(`For which value of ${m("c")} does ${m(`${a}(x+${k})=${a}x+c`)} hold for every value of ${x}?`,a*k,`The coefficients of x already match. Distributing on the left gives a constant term of ${a} × ${k} = ${a*k}, which must equal c.`,[k,a+k,a*k+a]),
    ][f];
    case 1: return [
      num(`A line passes through ${m(`(${b},${a*b+k})`)} and increases by ${a} units in height for each unit to the right. What is its vertical intercept?`,k,`Moving left ${b} units to x = 0 lowers the height by ${a*b}. Subtract this change from ${a*b+k} to get ${k}.`),
      num(`A tank loses water at a constant rate. After 2 hours it holds ${k+5*a} liters, and after 5 hours it holds ${k+2*a} liters. How much did it hold initially, in liters?`,k+7*a,`The tank loses ${3*a} liters in 3 hours, or ${a} per hour. Add two hours of loss to the first reading: ${k+5*a} + ${2*a} = ${k+7*a}.`),
      num(`For a linear function g, g(${b}) = ${k} and g(${b+3}) = ${k+3*a}. What is g(${b+5})?`,k+5*a,`Each input unit adds (${k+3*a} − ${k})/3 = ${a}. Moving five units from the first input adds ${5*a}.`,[k+3*a+2,k+a*2,k+a*6]),
      num(`A kiln warms steadily from ${n}°C to ${n+a*b}°C in ${b} minutes. What is its temperature, in °C, ${b+4} minutes after heating begins at this same rate?`,n+a*(b+4),`The rise per minute is (${n+a*b} − ${n})/${b} = ${a}. Add four more minutes of heating, or ${4*a}°C, to the recorded final temperature.`),
    ][f];
    case 2: return [
      num(`The equation ${m(`${a}x+y=${a*n}`)} describes all orders totaling ${a*n} dollars when one item costs $${a} and another costs $1. If y = ${a*b}, what is x?`,n-b,`Subtract ${a*b} from the total, then divide by ${a}: (${a*n} − ${a*b})/${a} = ${n-b}.`),
      num(`A line has equation ${m(`y=${a}x+${k}`)}. A parallel line passes through ${m(`(${b},${a*b+n})`)}. What is the y-intercept of the second line?`,n,`Parallel lines have the same slope. In y = ${a}x + c, the given point yields c = ${a*b+n} − ${a*b} = ${n}.`),
      num(`The intercepts of a line are (0, ${a*n}) and (${n}, 0). For which x-value on the line is y = ${a*(n-b)}?`,b,`The slope is −${a}, so the height drops ${a} units for every unit to the right. Reaching ${a*(n-b)} requires a drop of ${a*b}, which takes ${b} horizontal units.`),
      num(`The point ${m(`(${b},${n})`)} is on the line ${m(`y=-${a}x+c`)}. What is c?`,n+a*b,`Substitute both coordinates to get ${n} = −${a*b} + c. Add ${a*b} to isolate the intercept.`,[n-a*b,n+a,n+b]),
    ][f];
    case 3: return [
      num(`A venue sold ${n+b} tickets. Adult tickets cost $${a+5} and student tickets cost $${a}. The receipts were $${a*(n+b)+5*n}. How many adult tickets were sold?`,n,`At the student price the receipts would be $${a*(n+b)}. The extra $${5*n} comes from the $5 premium on each of ${n} adult tickets.`),
      num(`At the intersection of ${m(`y=${a}x+${k}`)} and ${m(`y=${a+2}x+${k-2*b}`.replace("+-","-"))}, what is the y-coordinate?`,a*b+k,`Equating the expressions gives 2x = ${2*b} and x = ${b}. Substitution into the first line gives y = ${a*b+k}.`),
      num(`Two lengths sum to ${2*n+b} centimeters. The longer exceeds the shorter by ${b} centimeters. What is the shorter length?`,n,`Remove the extra ${b} centimeters from the sum. The remainder, ${2*n}, consists of two copies of the shorter length.`,[n+b,2*n,n-1]),
      num(`Two lines satisfy ${m(`y=${a}x+${n}`)} and ${m(`${b}y=cx+${n*b+1}`)}. For which c do the lines have no common point?`,a*b,`Parallel distinct lines never meet. Dividing the second equation by ${b} makes its slope c/${b}, so c = ${a*b}. Its intercept differs from ${n}.`),
    ][f];
    case 4: return [
      num(`A club has $${k+a*n+a-1}. A booth costs $${k}, and each display board costs $${a}. What is the greatest number of boards the club can buy after paying for the booth?`,n,`After the booth fee the club has $${a*n+a-1}. Buying ${n} boards leaves $${a-1}, one dollar short of another board.`,[n+1,n-1,n+b]),
      num(`A lift can carry at most ${a*n+b} kilograms. A box weighing ${b} kilograms is already aboard. What is the largest number of additional ${a}-kilogram boxes allowed?`,n,`Subtract the first box from the capacity. The remaining ${a*n} kg accommodates exactly ${n} boxes at ${a} kg each.`),
      num(`A workshop needs at least ${a*n+1} tiles. Tiles come in packs of ${a}. What is the fewest packs it can order?`,n+1,`With ${n} packs the workshop has only ${a*n} tiles. The one extra tile needed forces a full additional pack.`,[n,n+2,a*n]),
      num(`A room starts at ${n+a*b}°C and cools ${a}°C per hour. At the first whole-number hour when its temperature is strictly below ${n}°C, how many hours have passed?`,b+1,`After ${b} hours the temperature equals ${n}°C. Equality does not satisfy "strictly below," so one more hour is required.`),
    ][f];
    case 5: return [
      num(`If ${m(`(x+${a})(x+${n})=x^2+px+q`)} for every x, what is p?`,a+n,`The terms ${a}x and ${n}x combine to (${a} + ${n})x. Their sum gives p = ${a+n}.`,[a*n,n-a,a+n+1]),
      num(`For positive x, ${m(`(x^{${a}})^{${b}}/x^{${k}}=x^p`)}. Find p.`,a*b-k,`Raising a power to a power multiplies exponents, and dividing like bases subtracts them. The exponent is ${a} × ${b} − ${k} = ${a*b-k}.`),
      num(`For x ≠ ${k}, the expression ${m(`(x^2-${k*k})/(x-${k})`)} equals x + c. What is c?`,k,`Factor the numerator as (x − ${k})(x + ${k}). The nonzero factor x − ${k} cancels, leaving x + ${k}.`),
      num(`When ${m(`${a}(x+${n})^2`)} is written as a polynomial, what is the coefficient of x?`,2*a*n,`Squaring the binomial produces a middle term of 2(${n})x. The outside factor ${a} makes its coefficient ${2*a*n}.`,[a*n,n*n,a*n*n]),
    ][f];
    case 6: return [
      num(`The equation ${m(`x^2-${n+b}x+${n*b}=0`)} has two real solutions. What is the larger solution?`,n,`The polynomial factors as (x − ${n})(x − ${b}). The larger of the two zeros is ${n}.`,[b,n+b,-n]),
      num(`If ${m(`\\sqrt{x+${k}}=${a+b}`)}, what is x?`,(a+b)**2-k,`Square each side, then subtract ${k}. The original square root is nonnegative and the resulting radicand is ${(a+b)**2}.`),
      num(`A horizontal line y = c touches the graph ${m(`y=(x-${b})^2+${k}`)} at exactly one point. What is c?`,k,`The squared term is zero only at x = ${b}. A horizontal line at the vertex height, ${k}, meets the parabola just once.`),
      num(`The equation ${m(`x^2-${2*k}x+c=0`)} has exactly one real solution. Find c.`,k*k,`Complete the square: the trinomial has a repeated root when it equals (x − ${k})². Its constant must be ${k}² = ${k*k}.`,[2*k,k,4*k*k]),
    ][f];
    case 7: return [
      num(`A culture starts with ${n} cells and doubles every ${b} hours. According to this model, how many cells will it contain after ${3*b} hours?`,8*n,`The interval contains three doubling periods. Multiply the initial count by 2³, giving ${n} × 8 = ${8*n}.`,[6*n,3*n,4*n]),
      num(`A ball’s height is modeled by ${m(`h(t)=${k+a}-(t-${b})^2`)}. What is its maximum height?`,k+a,`A square cannot be negative. The subtracted square is smallest at t = ${b}, where the height equals ${k+a}.`),
      num(`A machine worth $${625*n} retains four fifths of its value each year. What is its modeled value, in dollars, after two years?`,400*n,`Each year multiplies the remaining value by 4/5. Two years give ${625*n} × (4/5)² = ${400*n}.`),
      num(`For ${m(`f(x)=(x+${a})^2+${k}`)}, what is f(2) − f(1)?`,2*a+3,`The vertical shift ${k} cancels. Subtract the squares ${a+2}² − ${a+1}², or multiply their difference 1 by their sum ${2*a+3}.`),
    ][f];
    case 8: return [
      num(`A sander processes ${a*b} panels in ${b} minutes at a constant rate. How many panels will it process in ${n} minutes?`,a*n,`The unit rate is ${a*b}/${b} = ${a} panels per minute. Multiplying by ${n} minutes gives ${a*n} panels.`),
      num(`On a map, 1 centimeter represents ${a} kilometers. A route measures ${n/10} centimeters. How long is it in meters?`,100*a*n,`Multiply ${n/10} by ${a} to get kilometers, then multiply by 1,000 to convert kilometers to meters.`),
      num(`Blue and yellow pigments are mixed in the ratio ${a} to ${b}. How many grams of blue pigment are in a ${n*(a+b)}-gram batch?`,a*n,`There are ${a+b} equal parts in the batch. Each weighs ${n} grams, so the ${a} blue parts weigh ${a*n} grams.`),
      num(`A material has mass ${a*b} grams and volume ${b} cubic centimeters. What is the mass in grams of ${k} cubic centimeters of the same material?`,a*k,`Density is mass divided by volume: ${a*b}/${b} = ${a} grams per cubic centimeter. The new sample weighs ${a} × ${k} grams.`),
    ][f];
    case 9: return [
      num(`After a ${a}% discount, an instrument costs $${(100-a)*n}. What was the original price, in dollars?`,100*n,`The sale price is ${100-a}% of the original. Divide ${(100-a)*n} by ${(100-a)/100} to recover ${100*n}.`),
      num(`Attendance rose from ${100*n} to ${(100+a)*n}. What was the percent increase?`,a,`Use the original attendance as the denominator: 100 × ${a*n}/${100*n} = ${a} percent.`),
      num(`A store raises a $${100*n} price by 20% and then cuts the new price by 25%. What is the final price, in dollars?`,90*n,`Successive changes multiply the price. The factor is 1.20 × 0.75 = 0.90, giving $${90*n}.`),
      num(`Of ${100*n} survey replies, ${a*5}% came from students. Exactly 20% of those student replies mentioned transit. How many student replies mentioned transit?`,n*a,`First find the ${5*a*n} student replies. One fifth of that subgroup, or ${a*n}, mentioned transit.`,[5*a*n,20*n,4*a*n]),
    ][f];
    case 10: return [
      num(`Five measurements have a mean of ${n}. Four of them are ${n-4}, ${n-2}, ${n+1}, and ${n+2}. What is the fifth?`,n+3,`The five measurements must total ${5*n}. Subtract the known sum ${4*n-3} to get ${n+3}.`),
      num(`The sorted times in minutes are ${[n,n+2,n+3,n+6,n+8,n+10].join(", ")}. What is their median?`,n+4.5,`With six values the middle lies between positions three and four. Their average is (${n+3} + ${n+6})/2 = ${n+4.5}.`),
      num(`A group of ${b} students averages ${n} points. A second group of ${2*b} averages ${n+6}. What is the mean for all students combined?`,n+4,`The larger group supplies two thirds of the observations. The combined mean is (${n} + 2 × ${n+6})/3 = ${n+4}.`,[n+3,n+2,n+6]),
      num(`A set has minimum ${b}, maximum ${n}, and range ${n-b}. Each value is doubled and then increased by ${a}. What is the new range?`,2*(n-b),`Adding a constant changes both endpoints equally. Doubling multiplies their difference by two, so the new range is 2 × ${n-b}.`),
    ][f];
    case 11: return [
      num(`A fitted line predicts a repair will take ${a} minutes per damaged tile plus ${b} minutes for setup. One repair of ${n} tiles took ${a*n+b+(i%11)-5} minutes. What is its residual (observed minus predicted), in minutes?`,i%11-5,`The prediction is ${a} × ${n} + ${b} = ${a*n+b}. The residual is ${a*n+b+(i%11)-5} − ${a*n+b} = ${i%11-5} minutes.`),
      num(`A line of best fit predicts a seedling height of ${n} mm on day 2 and ${n+4*a} mm on day 6. According to the model, how many millimeters of growth occur in 3 days?`,3*a,`The slope is ${4*a}/4 = ${a} millimeters per day. Multiply by 3 to find the change in height over three days.`),
      num(`The model ${m(`y=${n}+${a}x`)} predicts visitors y when x is the hours since opening. How many visitors does the model predict at hour ${b}?`,n+a*b,`Substitute ${b} for x. The slope contributes ${a*b} visitors beyond the intercept of ${n}.`),
      num(`A line of fit predicts ${a*n} deliveries when ${n} drivers are working and ${a*(n+2)} with ${n+2} drivers. What is the predicted increase in deliveries per additional driver?`,a,`Divide the change in deliveries (${2*a}) by the change in drivers (2). The slope is ${a} deliveries per driver.`),
    ][f];
    case 12: return [
      num(`A club has ${n+b} violinists and ${a+b} cellists. Of the violinists, ${b} also sing. Given that a randomly selected member is a violinist, what is the probability that the member sings?`,fracPlain(b,n+b),`Restrict the denominator to the ${n+b} violinists. Exactly ${b} of them sing, so the probability is ${fracPlain(b,n+b)}.`),
      num(`A bag holds ${a} amber beads and ${n} blue beads. Two beads are drawn without replacement. Given that the first was amber, what is the probability that the second is blue?`,fracPlain(n,n+a-1),`All ${n} blue beads remain, but there are now only ${n+a-1} beads in total. Use blue remaining divided by total remaining.`),
      num(`Out of ${4*n} commuters, ${2*n} bike, ${n} ride a bus, and ${b} do both. What fraction bike or ride a bus or both?`,fracPlain(3*n-b,4*n),`Adding the two group counts counts the overlap twice. Subtract ${b} once and divide the resulting ${3*n-b} by ${4*n}.`),
      num(`A shipment contains ${3*n} lamps. Inspection classified ${b} as cracked and ${a} others as scratched. All remaining lamps were undamaged. What is the probability that a randomly selected lamp was undamaged?`,fracPlain(3*n-b-a,3*n),`The two damaged groups are disjoint. Subtract their total ${a+b} from ${3*n} before dividing by the shipment size.`),
    ][f];
    case 13: return [
      num(`A poll estimates that ${n+12}% of residents support a proposal, with a margin of error of ${a} percentage points. What is the upper endpoint of its estimated interval, as a percent?`,n+12+a,`A margin in percentage points is added directly to the estimated percentage. The upper endpoint is ${n+12} + ${a} = ${n+12+a}.`),
      num(`A random sample estimates a mean commute of ${n} minutes with a margin of error of ${b} minutes. What is the width of the interval in minutes?`,2*b,`The interval extends ${b} minutes below and ${b} above the estimate. Its full width is twice the margin, or ${2*b} minutes.`),
      num(`In a random sample of 100 households, ${n} report keeping a garden. Based on the sample, about how many of the town’s ${100*(a+b)} households keep a garden?`,n*(a+b),`The sample proportion is ${n}/100. Multiply by the population size of ${100*(a+b)} to get the estimate ${n*(a+b)}.`),
      num(`A survey reports an interval from ${n} to ${n+2*a} percent, formed by adding and subtracting the same margin from a point estimate. What was the point estimate, as a percent?`,n+a,`The point estimate is the midpoint of the endpoints. Half the interval width is ${a}, so add ${a} to the lower endpoint.`),
    ][f];
    case 14: {
      const [group, tool, outcome] = contexts[(4*i+f) % contexts.length];
      // Each design changes the inference; sample size alone never changes its scope.
      const designs = [
        [`A researcher randomly samples ${group} at one center and asks whether they use ${tool}. Users have a higher rate of ${outcome}. Which conclusion is justified?`, `Use of the aid and success are associated among this center’s ${group}.`, `Providing the aid would increase success for this center’s ${group}.`, `Use of the aid predicts the same success rate at every other center.`, `Random sampling rules out differences between aid users and nonusers.`, "Random selection supports describing the sampled population. People chose whether to use the aid, so prior experience could account for the association."],
        [`Volunteers from a group of ${group} are randomly assigned either ${tool} or the usual instructions. The researchers observe a statistically significant advantage for the aid group in ${outcome}. What does the design support?`, "The aid improved success for the participants under the study conditions.", "The volunteers represent the full population because their groups were randomized.", "People who chose the aid were already more likely to succeed.", "Success in the task caused volunteers to be assigned the aid.", "Random assignment supports a causal comparison between the groups. Volunteering limits how confidently the result generalizes outside the trial."],
        [`A study recruits ${group} who already use ${tool} and compares their rate of ${outcome} with the rate for first-time trainees. Which change best isolates the aid’s effect?`, "Randomly assign comparable participants to receive the aid or the usual instructions.", "Recruit more experienced aid users and compare them with the same trainees.", "Measure success more frequently only among the participants who use the aid.", "Remove unsuccessful attempts from both groups before comparing their rates.", "Experience differs between the original groups along with use of the aid. Random assignment from a common pool addresses that competing explanation."],
        [`A center wants to estimate the proportion of its ${group} who would use ${tool} for ${outcome}. Which sample best supports that estimate?`, "Select people at random from the complete roster of eligible participants.", "Invite everyone who attended the optional demonstration of the aid.", "Choose equal numbers of people who liked and disliked the demonstration.", "Survey the center’s most frequent visitors across several weekdays.", "Sampling from the full roster gives every eligible person a chance of selection. Demonstration attendance and visit frequency could be related to interest in the aid."],
        [`A trial of ${tool} among ${group} reports improved rates of ${outcome}. Participants chose their group, and everyone choosing the aid had practiced the task before. No one in the comparison group had practiced it. What most directly weakens a causal interpretation?`, "Prior practice varies with use of the aid and could explain the outcome.", "The outcome is reported as a rate instead of as a raw count.", "Both groups attempted the same task during the trial.", "The study distinguished between the aid and the usual instructions.", "Experience is a confounding variable: it differs between groups and could affect success even if the aid has no effect."],
        [`A researcher divides ${group} by prior experience, then randomly assigns half of each experience group to receive ${tool}. Why group participants by experience when measuring ${outcome}?`, "So the aid and comparison groups have similar mixes of experience.", "So volunteers become a random sample of everyone who might use the aid.", "So the outcome can be measured before the aid has been assigned.", "So every experienced participant receives the same treatment.", "Random assignment within each experience level balances this possible influence across treatments. It does not change how participants entered the sample."],
        [`At one workshop for ${group}, everyone receives ${tool}, then attempts a task involving ${outcome}. The director credits the aid for the results. Which addition would most strengthen that claim?`, "A randomly assigned group doing the same task with the usual instructions.", "A second score for each participant taken immediately after the first score.", "An anonymous survey asking whether participants expected to find the aid helpful.", "A detailed record of how many participants completed the task.", "A comparable untreated group supplies the missing comparison. Repeated measurements or expectations alone cannot show what would happen without the aid."],
        [`In an experiment involving ${group}, researchers compare ${tool} with standard instructions. What is the benefit of keeping the person scoring ${outcome} unaware of each participant’s assignment?`, "It reduces the chance that expectations about the aid influence scoring.", "It ensures that the participants represent all people who do the task.", "It eliminates any sampling error from the estimated difference.", "It guarantees that the two groups have identical skills at the outset.", "Blinding the scorer addresses measurement bias. Sampling, assignment, and sample size address different aspects of study design."],
        [`A center introduces ${tool} for all its ${group}. A month later, the rate of ${outcome} has risen. Which information would best help distinguish the aid’s effect from a general change over time?`, "The change over the same month at comparable centers that kept their usual instructions.", "The number of staff members at the center after the aid was introduced.", "The proportion of current users who remember the aid’s name correctly.", "The total number of tasks attempted since the center first opened.", "A contemporaneous comparison shows whether success also rose without the aid. A before-and-after comparison at just one center mixes treatment and time effects."],
        [`Researchers randomly select ${group} from one center’s roster for a study of ${outcome}. Some decline, and those who decline are less likely to use ${tool}. What issue should the researchers consider?`, "Nonresponse may leave users of the aid overrepresented in the final sample.", "Random selection makes the final sample representative regardless of refusals.", "A larger number of initial invitations necessarily removes the difference.", "The refusals make the final sample an experiment with two treatments.", "When response depends on a trait of interest, the people who respond can differ systematically from the target population even after a random invitation."],
      ];
      const [stem, answer, ...rest] = designs[Math.floor((4*i+f)/contexts.length)];
      return num(stem, answer, rest[3], rest.slice(0,3));
    }
    case 15: return [
      num(`A rectangular tank has a base ${a} cm by ${b} cm. A stone raises the water level by ${n} cm without spilling. What is the stone’s submerged volume in cubic centimeters?`,a*b*n,`Displaced volume equals base area times the change in depth. Multiply ${a*b} square centimeters by ${n} centimeters.`),
      num(`A cylinder with radius ${a} and height ${n} has volume V. A second cylinder has twice the radius and one third the height. If its volume is cπ, what is c?`,fracPlain(4*a*a*n,3),`Use πr²h with the new measurements. The coefficient is (${2*a})² × ${n}/3 = ${fracPlain(4*a*a*n,3)}.`),
      num(`A rectangle measuring ${n} by ${a} meters has a path 1 meter wide around its outside. What is the area of the path in square meters?`,(n+2)*(a+2)-n*a,`The outer dimensions are ${n+2} by ${a+2}. Subtract the original area ${n*a} from the outer area ${(n+2)*(a+2)}.`),
      num(`The volume of a cone is ${a*a*n}π cubic units. Its radius is ${a} units. What is its height?`,3*n,`From V = πr²h/3, multiply the volume by 3 and divide by π × ${a}². The resulting height is ${3*n}.`),
    ][f];
    case 16: return [
      num(`An exterior angle of a triangle measures ${n+55}°. One remote interior angle measures ${a+17}°. What is the measure, in degrees, of the other remote angle?`,n+55-a-17,`An exterior angle equals the sum of the two remote interior angles. Subtract ${a+17} from ${n+55} to get ${n+55-a-17}.`),
      num(`In two similar triangles, corresponding bases are ${b} and ${3*b} units long. The larger triangle’s perimeter is ${3*(n+2*b)} units. What is the smaller perimeter?`,n+2*b,`The scale factor from smaller to larger is 3. Perimeters scale by the same factor, so divide ${3*(n+2*b)} by 3.`),
      num(`A triangle has interior angles of ${a+12}°, x°, and (x + ${b})°. What is x?`,(180-a-12-b)/2,`The angles sum to 180°, so 2x = 180 − ${a+12} − ${b}. Divide the remainder by 2 to get ${(180-a-12-b)/2}.`),
      num(`Two parallel lines are cut by a transversal. One acute angle measures ${n}°. An obtuse angle at the other intersection measures (2x + ${a})°. Find x.`,(180-n-a)/2,`The obtuse angle supplements the acute angle and equals ${180-n}°. Subtract ${a} and divide by 2.`),
    ][f];
    case 17: return [
      num(`A ramp climbs ${3*n} centimeters over a horizontal run of ${4*n} centimeters. What is its sloping length, in centimeters?`,5*n,`The rise and run are perpendicular legs. They are ${n} times 3 and 4, so the hypotenuse is ${n} times 5.`,[7*n,n,4*n]),
      num(`A right triangle has hypotenuse ${5*n} and sin A = 3/5. What is the length of the leg adjacent to acute angle A?`,4*n,`The opposite leg is 3/5 of ${5*n}, or ${3*n}. The Pythagorean theorem then gives the adjacent leg as ${4*n}.`),
      num(`A pole casts a ${n}-meter shadow. At that instant the ratio of rise to horizontal run along a ray of sunlight is ${a}/${b}. What is the pole’s height in meters?`,fracPlain(n*a,b),`Similar right triangles give height/shadow = ${a}/${b}. Multiply the shadow length by the ratio to get ${fracPlain(n*a,b)} meters.`),
      num(`The diagonal of a square has length ${m(`${n}\\sqrt{2}`)} cm. What is the square’s perimeter in centimeters?`,4*n,`For a square of side s, the diagonal is s√2. Its side is therefore ${n} cm, and four sides give a perimeter of ${4*n} cm.`),
    ][f];
    case 18: return [
      num(`The endpoints of a circle’s diameter are (${b}, ${a}) and (${b+2*n}, ${a}). What is the area of the circle divided by π?`,n*n,`The diameter is the horizontal distance ${2*n}. Halve it before squaring: the radius is ${n} and the area is ${n*n}π.`),
      num(`An arc spans ${6*b}° in a circle with circumference ${60*n} cm. What is the arc length, in centimeters?`,b*n,`The arc takes up ${6*b}/360 of the circumference. Multiplying this fraction by ${60*n} gives ${b*n} cm.`),
      num(`A circle centered at (${a}, ${b}) passes through (${a+3*n}, ${b+4*n}). In its standard equation, what number appears alone on the right side?`,25*n*n,`The right side is the squared radius. The horizontal and vertical offsets are ${3*n} and ${4*n}; their squared sum is ${25*n*n}.`),
      num(`A chord divides a circle into two arcs. The shorter arc measures ${2*n}°. An angle with its vertex on that shorter arc intercepts the longer arc. What is the angle’s measure in degrees?`,180-n,`The intercepted arc is the one opposite the vertex. Subtract ${2*n}° from 360° and halve the remaining ${360-2*n}° to get ${180-n}°.`,[2*n,n,90-n]),
    ][f];
    default: throw new Error("Unmapped math skill");
  }
}

export function workshopMath(): Question[] {
  const random = rng(27118);
  const levels = [
    "EMEM","MMME","MMME","MMMM","EEMM","MMMH","MHEH","EMMM","EMMM","MMMM",
    "MEMM","MEME","MHMM","EEMM","MMHH","MMMH","EMMM","EMMM","EMMH",
  ];
  return skills.flatMap(({domain, skill}, index) => Array.from({length:200}, (_, j) => {
    const forms = index === 14 ? 4 : 6;
    const f = j % forms, i = Math.floor(j/forms);
    const item = f < 4 ? form(index, f, i) : modelForm(index, f===5, i);
    const base = {section:"math" as const, domain, skill, difficulty: (f>=4 ? (f===5 ? "H" : "M") : levels[index][f]) as Difficulty, table:item.table, stem:item.stem, explanation:item.why};
    const value = typeof item.answer === "number" ? fmt(item.answer) : item.answer;
    const q = item.wrong && mcq(random, base, value, item.wrong.map(String));
    return { ...(q || spr(base, value)), id:`wm-${index+1}-${j+1}`, family:`math-${index+1}-${index===14 ? Math.floor(j/20) : f}`, collection:"skill-workshop" as const };
  }));
}
