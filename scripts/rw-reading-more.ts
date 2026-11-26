/** Hand-written reading questions for the skills with the fewest items: Rhetorical Synthesis, Cross-Text
 *  Connections and Text Structure and Purpose. Every passage is original; people, places and studies are
 *  fictional. Each wrong choice fails for one specific reason, named in the explanation.
 *
 *  These are generated with their own seed (see gen-rw-more.ts), so adding or editing items here never
 *  changes the answer order of any other question. */
import type { ReadingItem } from "./rw-reading";

export type SynthItem = { notes: string[]; goal: string; right: string; wrong: string[]; why: string; d: ReadingItem["d"] };

/** Notes + a goal → the sentence that best does the job. Each wrong choice is accurate or plausible but misses the goal. */
export const SYNTH_MORE: SynthItem[] = [
  {
    notes: [
      "Greenfield High began a cafeteria composting program in 2023.",
      "Students sort food scraps into three labeled bins.",
      "Before the program, the cafeteria produced about 90 bags of trash per week; after the first year, it produced about 35.",
      "The finished compost is used in the school's vegetable garden.",
    ],
    goal: "emphasize how much the program reduced the school's trash",
    right: "In its first year of composting cafeteria food scraps, Greenfield High cut its weekly trash from about 90 bags to about 35.",
    wrong: [
      "Greenfield High students sort cafeteria food scraps into three labeled bins, and the finished compost is used in the school's vegetable garden.",
      "Greenfield High began a cafeteria composting program in 2023, and students separate their food scraps into three labeled bins.",
      "Because the finished compost goes to the vegetable garden, Greenfield High no longer has to buy fertilizer for its garden.",
    ],
    why: "The goal is the size of the reduction, and only one sentence gives the before-and-after numbers. Two choices describe how the program works, and the claim about fertilizer is not in the notes.",
    d: "E",
  },
  {
    notes: [
      "In 2022, sleep researcher Lena Ortiz studied 200 teenagers.",
      "Half of them started school an hour later than usual; the other half kept their regular start time.",
      "The study lasted one semester.",
      "The teenagers with the later start reported feeling more alert in morning classes.",
    ],
    goal: "introduce the study and its method to readers who have not heard of it",
    right: "In a semester-long study, sleep researcher Lena Ortiz had half of 200 teenagers start school an hour later than usual while the other half kept their regular schedule.",
    wrong: [
      "Teenagers who started school an hour later than usual reported feeling more alert in their morning classes.",
      "A 2022 study led by sleep researcher Lena Ortiz suggests that later school start times make teenagers more alert in the morning, a result that schools everywhere should take seriously.",
      "In 2022, sleep researcher Lena Ortiz studied 200 teenagers.",
    ],
    why: "An introduction to the study has to say who ran it and what they did. One choice reports only the result, one is too thin to describe the method, and one adds a recommendation the notes never make.",
    d: "M",
  },
  {
    notes: [
      "Suspension bridges hang their roadways from cables strung between tall towers.",
      "Arch bridges carry loads through a curved structure that pushes outward at its ends.",
      "A design catalog lists a suspension bridge with a main span of 2,000 meters.",
      "The same catalog lists an arch bridge with a main span of 550 meters.",
    ],
    goal: "contrast the main spans of the two bridges in the catalog",
    right: "The catalog’s suspension bridge has a main span of 2,000 meters, compared with 550 meters for its arch bridge.",
    wrong: [
      "Suspension bridges hang their roadways from cables, while arch bridges carry loads through a curved structure that pushes outward.",
      "The suspension bridge in the catalog has a main span of 2,000 meters and hangs its roadway from cables.",
      "Arch bridges cannot span long distances because their curved structure pushes outward at its ends.",
    ],
    why: "Compare the same measurement for both examples. The two span lengths meet that goal. The structural comparison describes how bridges carry loads, and the notes do not establish a limit on all arch bridges.",
    d: "E",
  },
  {
    notes: [
      "A survey of 1,200 adults found that those who kept plants at their workstations reported lower stress.",
      "Participants chose for themselves whether to keep plants at their workstations.",
      "The researchers did not measure anyone's stress before plants were introduced.",
      "The researchers plan a follow-up experiment in which plants are assigned at random.",
    ],
    goal: "present the survey's finding while acknowledging a limit on what it can show",
    right: "Adults in the survey who kept plants at their workstations reported lower stress, but because they chose whether to keep plants and stress was not measured beforehand, the survey cannot show that plants were the cause.",
    wrong: [
      "A survey of 1,200 adults found that keeping plants at a workstation lowers stress, and the researchers now plan a follow-up experiment in which plants are assigned at random.",
      "Because the researchers did not measure stress before plants were introduced, the survey of 1,200 adults tells us nothing about plants and stress.",
      "Participants in the survey chose for themselves whether to keep plants at their workstations, and the researchers plan a follow-up experiment in which plants are assigned at random.",
    ],
    why: "The right choice states the finding and says why it cannot prove cause. One wrong choice treats the finding as proof of cause, one dismisses the finding entirely, and one leaves the finding out.",
    d: "H",
  },
  {
    notes: [
      "The Alder Valley Museum opened a beekeeping exhibit in March.",
      "The exhibit includes a working glass hive that visitors can watch.",
      "Children under 12 get free admission to the exhibit.",
      "The exhibit closes in September.",
    ],
    goal: "tell readers when the exhibit is open and what they can see there",
    right: "From March to September, visitors to the Alder Valley Museum's beekeeping exhibit can watch bees in a working glass hive.",
    wrong: [
      "The Alder Valley Museum's beekeeping exhibit, which includes a working glass hive, offers free admission to children under 12.",
      "The Alder Valley Museum opened a beekeeping exhibit in March, and children under 12 get free admission.",
      "The beekeeping exhibit at the Alder Valley Museum closes in September, which gives visitors only a short time to see it.",
    ],
    why: "The goal has two parts: when and what. Each wrong choice covers at most one of them and adds something else (admission, or a claim about how short the run is).",
    d: "E",
  },
  {
    notes: [
      "Lakeport and Dunmore each launched a bike-share program in 2021.",
      "Lakeport's program has 40 stations; Dunmore's has 38.",
      "Each program averages about 1,500 rides per day.",
      "Lakeport's program is run by the city; Dunmore's is run by a private company.",
    ],
    goal: "emphasize that the two programs are used about equally often",
    right: "Although Lakeport's program is city-run and Dunmore's is private, each averages about 1,500 rides per day.",
    wrong: [
      "Lakeport's bike-share program is run by the city, while Dunmore's is run by a private company.",
      "Lakeport and Dunmore each launched a bike-share program in 2021, and their systems have 40 and 38 stations, respectively.",
      "Lakeport's program has more stations than Dunmore's, so it is probably used more often.",
    ],
    why: "Use the measure that matches the goal: each program records about 1,500 rides per day. A larger station network need not attract more riders. Launch dates and operators do not measure use.",
    d: "M",
  },
  {
    notes: [
      "Many cities are replacing old copper telephone lines with fiber-optic cables.",
      "Recovered copper can be sold, and recycling it is profitable.",
      "Last year the city of Oakridge sold 30 tons of recovered copper wire for $210,000.",
      "Oakridge used the money to help pay for a new community center.",
    ],
    goal: "give a specific example of old infrastructure being turned into a public benefit",
    right: "Oakridge, for example, sold 30 tons of copper recovered from old phone lines for $210,000 and put the money toward a new community center.",
    wrong: [
      "Many cities are replacing old copper telephone lines with fiber-optic cables, and recovered copper can be sold at a profit.",
      "Last year, Oakridge sold 30 tons of recovered copper wire for $210,000.",
      "A new community center in Oakridge cost more than the city earned by selling recovered copper, so residents had to cover the difference in taxes.",
    ],
    why: "The goal needs a specific example that ends in a public benefit. One choice is general, not specific. One names the sale but not what it paid for. One invents a cost and a funding gap.",
    d: "H",
  },
  {
    notes: [
      "Wanjiru Kamau is an engineer from Kenya.",
      "In 2019 she designed a low-cost water filter made of sand and ceramic.",
      "The filter removes more than 99 percent of bacteria from river water.",
      "Her design is now used in more than 60 villages.",
    ],
    goal: "introduce an engineer and her main accomplishment to readers who may not know her",
    right: "Kenyan engineer Wanjiru Kamau designed a low-cost sand-and-ceramic water filter that removes more than 99 percent of bacteria and is now used in more than 60 villages.",
    wrong: [
      "The water filter Wanjiru Kamau designed in 2019 is made of sand and ceramic, removes most bacteria from river water, and is now used in more than 60 villages.",
      "Wanjiru Kamau, an engineer from Kenya, has contributed to improving life in many communities.",
      "Kenya has many engineers working on water problems, including Wanjiru Kamau, who designed a filter that is now widely used.",
    ],
    why: "Look for both the person's role and the specific innovation. The strongest introduction identifies Kamau as an engineer and explains what her filter does. A description of the filter alone omits her profession, and a general statement about improving lives omits the invention.",
    d: "M",
  },
];

/** Cross-Text Connections: two short texts, the item asks how they relate. */
export const CROSS_MORE: ReadingItem[] = [
  {
    passage: "Text 1\nGeologist Mara Lindgren argues that a series of small earthquakes near the Harlan Reservoir was triggered by the weight of the water stored there. She notes that the tremors began within a year of the reservoir's filling.",
    passage2: "Text 2\nSeismologist Joel Park observes that this region has recorded similar clusters of small earthquakes for centuries, long before the reservoir existed. He cautions that the timing Lindgren cites is not enough, by itself, to show that the reservoir is responsible.",
    stem: "Based on the texts, how would Park (Text 2) most likely respond to Lindgren's reasoning in Text 1?",
    right: "By noting that the region had similar quakes long before the reservoir, so timing alone proves little",
    wrong: [
      "By agreeing that the weight of the reservoir's water is the most likely cause of the tremors",
      "By arguing that the reservoir was filled only after the tremors had already begun",
      "By claiming that no earthquakes had been recorded in the region before the reservoir was built there",
    ],
    why: "Park says the region had similar quakes for centuries before the reservoir, so Lindgren's timing is not enough to prove the reservoir is the cause. He does not agree with her, does not discuss when the reservoir was filled, and says earlier quakes were recorded.",
    d: "M",
  },
  {
    passage: "Text 1\nCritic Hannah Voss maintains that translating a poem necessarily betrays it, because the sounds that give a poem its music cannot survive the move into another language.",
    passage2: "Text 2\nTranslator Emil Aksoy agrees that a poem's original sounds cannot be preserved. He argues, however, that a translator can build new sounds in the second language that produce a comparable effect on the reader, and that doing so honors the original rather than betraying it.",
    stem: "Which choice best describes how Text 2 relates to Text 1?",
    right: "It accepts the premise of Text 1 but rejects the conclusion Text 1 draws from it.",
    wrong: [
      "It rejects the premise of Text 1 by showing that a poem's sounds can survive translation intact.",
      "It supports Text 1's conclusion by giving an example of a translation that failed.",
      "It shifts the discussion from poetry to other kinds of literature that are easier to translate.",
    ],
    why: "Aksoy agrees that the original sounds cannot be preserved (the premise), but denies that translation therefore betrays the poem (the conclusion). He does not claim the sounds survive, give a failed example, or leave the subject of poetry.",
    d: "H",
  },
  {
    passage: "Text 1\nTeacher Ana Pérez tells her students that explaining a lesson to a classmate helps them remember it, because explaining forces them to notice what they do not yet understand.",
    passage2: "Text 2\nPsychologist Ken Oda asked two groups of students to study the same article. One group re-read it; the other prepared to teach it to a partner. On a quiz a week later, the group that prepared to teach scored higher. Oda suggests that organizing ideas for another person may be the reason.",
    stem: "Based on the texts, what would Pérez and Oda most likely agree on?",
    right: "Preparing to explain material to someone else can help a student learn it.",
    wrong: [
      "Teaching helps mainly because a classmate can immediately correct the student's mistakes.",
      "Rereading prepares students to teach by helping them notice gaps in their understanding.",
      "Recognizing a gap in understanding matters more than organizing material for someone else.",
    ],
    why: "Both writers connect preparing an explanation with learning. Pérez emphasizes noticing gaps; Oda suggests organizing ideas. Neither compares those mechanisms, credits a partner's corrections, or claims that rereading itself produces the improvement.",
    d: "E",
  },
  {
    passage: "Text 1\nHistorian Priya Banerjee argues that the town of Calder grew rapidly in the 1880s because a new rail line gave local farmers easy access to distant grain markets.",
    passage2: "Text 2\nEconomist Luis Ortega counters that grain shipments from Calder were already rising before the rail line opened. He attributes the town's growth mainly to a new flour mill, which created hundreds of jobs and drew workers from nearby counties.",
    stem: "Which choice best describes a difference between how the texts explain Calder's growth?",
    right: "Text 1 credits access to distant markets, whereas Text 2 credits the jobs created by a new mill.",
    wrong: [
      "Text 1 says the town grew slowly, whereas Text 2 says it grew rapidly.",
      "Text 1 treats the rail line as irrelevant to the town's growth, whereas Text 2 treats it as the only cause of that growth.",
      "Text 1 emphasizes flour production, whereas Text 2 emphasizes grain shipments.",
    ],
    why: "Banerjee points to the rail line and distant grain markets; Ortega points to the flour mill and the jobs it created. Attributing the mill to Text 1 reverses the explanations. Both writers accept that the town grew rapidly; their dispute concerns its cause.",
    d: "M",
  },
];

/** Text Structure and Purpose. */
export const PURPOSE_MORE: ReadingItem[] = [
  {
    passage: "Many people assume that the loudest sounds in a forest come from its largest animals. Yet researchers who recorded a woodland at dawn found that the most intense sounds came from insects no longer than a thumbnail. These insects produce sound by vibrating a drum-like membrane on their abdomens, a method that is far more efficient than a mammal's vocal cords.",
    stem: "Which choice best describes the function of the second sentence in the text as a whole?",
    right: "It challenges the assumption in the first sentence by reporting what researchers recorded.",
    wrong: [
      "It elaborates on the assumption in the first sentence by describing how large animals produce their sounds.",
      "It introduces a technical term that is then defined in the third sentence.",
      "It illustrates the first sentence with an example of a large animal that produces an unusually loud sound.",
    ],
    why: "The first sentence states a common assumption; the second begins with \"Yet\" and reports a finding that contradicts it.",
    d: "M",
  },
  {
    passage: "The following passage is from an original short story.\nWhen the ferry finally docked, Mireille did not hurry to the gangway as the other passengers did. She stayed where she was, her suitcase between her feet, and watched strangers embrace on the pier. For weeks she had rehearsed this arrival—what she would say, how she would stand—but now every sentence seemed to have left her. When a porter asked whether she needed help, she heard herself answer, a little too brightly, that she was only waiting for someone.",
    stem: "Which choice best states the main purpose of the text?",
    right: "To convey a character's nervousness by contrasting her careful preparation with her behavior on arrival.",
    wrong: [
      "To describe how a ferry terminal operates when large numbers of passengers arrive at once.",
      "To show that Mireille resents the people she is about to meet and secretly hopes to avoid meeting them.",
      "To explain why Mireille chose to travel by ferry instead of by train or some other means of transport.",
    ],
    why: "Mireille hangs back, loses the words she rehearsed and answers the porter \"a little too brightly\": details that show nervousness. The text never says she resents anyone or why she chose the ferry, and the terminal is only a setting.",
    d: "M",
  },
  {
    passage: "The idea that goldfish have a three-second memory shows up in cartoons, jokes, and everyday conversation. Yet in laboratory tests, goldfish learned to push a lever to get food and still remembered how to do it weeks later. They can even be trained to respond to particular colors and sounds. The three-second claim, it seems, says more about our assumptions than about the fish.",
    stem: "Which choice best describes the overall structure of the text?",
    right: "It presents a common belief, offers evidence against it, and then draws a conclusion about the belief.",
    wrong: [
      "It describes a laboratory procedure in detail and then compares two possible explanations for the results.",
      "It traces how a popular myth about goldfish began and how it has changed over time.",
      "It identifies a problem facing goldfish keepers and then proposes several solutions.",
    ],
    why: "The text states the three-second-memory belief, answers it with laboratory evidence, and ends by saying what the belief really shows.",
    d: "E",
  },
  {
    passage: "Urban planners have long treated street trees as decoration: pleasant to look at, and easy to remove when a road needs widening. A recent analysis suggests that this habit is costly. Over fifty years, a single mature street tree in the study's sample absorbed stormwater worth several hundred dollars in drainage costs and shaded buildings enough to reduce nearby cooling bills. Planners who count only the price of planting and pruning, the author concludes, are leaving most of a tree's value off the ledger.",
    stem: "Which choice best states the main purpose of the text?",
    right: "To argue that planners undervalue street trees because they overlook benefits that an analysis has measured.",
    wrong: [
      "To compare the cost of planting street trees with the cost of building new drainage systems in a city.",
      "To explain why so many city roads must be widened and how planners decide which trees to remove.",
      "To describe the methods researchers used to measure how much street trees reduce the cooling bills of nearby buildings.",
    ],
    why: "The author contrasts planners' narrow view of trees as decoration with the benefits an analysis found, and concludes that planners are undervaluing them. Drainage costs are one benefit, not the point of a comparison; the text does not explain road widening or describe the study's methods.",
    d: "H",
  },
];
