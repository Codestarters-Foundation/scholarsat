/**
 * Original Standard English Conventions + Transitions content for ScholarSAT.
 * Each frame is written for ScholarSAT; the generator turns frames into questions.
 */
import type { Difficulty } from "../src/lib/types";

/** Two independent clauses: the blank sits between them. */
export const IC_SPLITS: { first: string; second: string; d: Difficulty }[] = [
  { first: "Glassblowers must work quickly because molten glass begins to stiffen within seconds of leaving the furnace", second: "experienced artisans plan every movement before they gather the glass on the pipe.", d: "E" },
  { first: "The new bridge was designed to sway slightly in strong winds", second: "this flexibility helps the structure absorb energy instead of cracking.", d: "E" },
  { first: "Most desert plants store water in thick stems or leaves", second: "some, however, survive droughts by going dormant until rain returns.", d: "M" },
  { first: "The library's rare book room is kept at a constant temperature", second: "even small changes in humidity can warp the oldest bindings.", d: "E" },
  { first: "For centuries, sailors navigated by reading the positions of the stars", second: "today, most ships rely on satellite signals instead.", d: "E" },
  { first: "The choir rehearsed the final song more than any other piece", second: "its shifting harmonies were the most difficult part of the program.", d: "E" },
  { first: "Honeybees communicate the location of flowers through a movement called the waggle dance", second: "the angle of the dance indicates the direction of the food source.", d: "M" },
  { first: "The city's first subway line opened with only nine stations", second: "within two decades, the network had grown to more than eighty.", d: "M" },
  { first: "Many potters fire their work in electric kilns", second: "others prefer wood-fired kilns, which leave unpredictable patterns of ash on the glaze.", d: "M" },
  { first: "The documentary was filmed over four years", second: "the crew followed the same family of wolves through every season.", d: "E" },
  { first: "Early typewriters often jammed when neighboring keys were struck in quick succession", second: "designers rearranged the keyboard to separate commonly paired letters.", d: "M" },
  { first: "The mural covers the entire north wall of the community center", second: "it depicts the neighborhood's history from its founding to the present day.", d: "E" },
  { first: "Octopuses can change the color of their skin in a fraction of a second", second: "specialized cells called chromatophores expand and contract to produce the effect.", d: "M" },
  { first: "The novelist wrote her first draft entirely by hand", second: "she believed that typing encouraged her to revise too early.", d: "E" },
  { first: "Tidal pools are harsh environments for the animals that live in them", second: "temperature and salt levels can swing dramatically between high and low tide.", d: "M" },
  { first: "The architect left the building's steel beams exposed", second: "she wanted visitors to see how the structure supported itself.", d: "E" },
  { first: "Some species of bamboo can grow nearly a meter in a single day", second: "this rapid growth makes bamboo a promising renewable building material.", d: "M" },
  { first: "The festival began as a small gathering of local musicians", second: "it now attracts performers from more than thirty countries.", d: "E" },
  { first: "The researchers expected the bacteria to die in the salty water", second: "to their surprise, the colony doubled in size within a week.", d: "H" },
  { first: "Lighthouse keepers once had to wind the lamp's clockwork mechanism by hand every few hours", second: "automation made the position obsolete in most countries by the late twentieth century.", d: "H" },
  { first: "The violinist tunes her instrument before every performance", second: "changes in temperature and humidity can cause the strings to go flat.", d: "E" },
  { first: "Ancient Roman concrete has survived for two thousand years in seawater", second: "modern engineers are studying its chemistry to design more durable materials.", d: "H" },
  { first: "The school garden produces more vegetables than the cafeteria can use", second: "students donate the surplus to a nearby food pantry.", d: "E" },
  { first: "Cartographers once filled unexplored regions of maps with drawings of imagined creatures", second: "such illustrations signaled to readers that the area had not been surveyed.", d: "H" },
  { first: "The software update was released on Monday", second: "by Wednesday, the developers had already fixed three reported bugs.", d: "M" },
  { first: "Fireflies produce light through a chemical reaction in their abdomens", second: "almost none of the energy is lost as heat.", d: "M" },
  { first: "The marathon route was changed at the last minute", second: "a water main had burst on one of the original streets.", d: "E" },
  { first: "Many coral reefs are threatened by rising ocean temperatures", second: "scientists are breeding heat-tolerant corals in an effort to restore damaged reefs.", d: "H" },
  { first: "The poet rarely gave public readings", second: "she preferred to let her work speak for itself on the page.", d: "E" },
  { first: "The team's prototype weighed nearly forty kilograms", second: "the final version, built with carbon fiber, weighed less than ten.", d: "H" },
];

/** Introductory element + main clause: correct is a comma. */
export const INTRO_SPLITS: { intro: string; main: string; d: Difficulty }[] = [
  { intro: "After months of careful restoration", main: "the antique clock tower chimed for the first time in fifty years.", d: "E" },
  { intro: "Although the trail is only three miles long", main: "its steep switchbacks make it one of the park's most challenging hikes.", d: "E" },
  { intro: "Hoping to reduce food waste", main: "the restaurant began composting its vegetable scraps.", d: "E" },
  { intro: "Once the paint had fully dried", main: "the students hung their banners along the gymnasium walls.", d: "E" },
  { intro: "Built in just eighteen months", main: "the stadium was finished ahead of the opening ceremony.", d: "M" },
  { intro: "Because owls have exceptionally soft feathers", main: "they can fly almost silently while hunting.", d: "E" },
  { intro: "Unlike most of her contemporaries", main: "the composer wrote music for amateur choirs rather than professional orchestras.", d: "M" },
  { intro: "Before the invention of refrigeration", main: "people preserved fish by salting, smoking, or drying it.", d: "E" },
  { intro: "Determined to finish the race", main: "the cyclist pedaled the final kilometer with a flat tire.", d: "M" },
  { intro: "In the decades following the war", main: "the small fishing village grew into a busy port city.", d: "M" },
  { intro: "While studying ice cores from Antarctica", main: "the scientists discovered tiny bubbles of air trapped for thousands of years.", d: "M" },
  { intro: "Surprisingly", main: "the smallest seeds in the experiment produced the tallest plants.", d: "E" },
  { intro: "To test whether the bridge could handle heavy traffic", main: "engineers parked a line of loaded trucks across its center.", d: "M" },
  { intro: "Originally designed as a train station", main: "the building now houses one of the country's largest art museums.", d: "H" },
  { intro: "If the weather remains clear tonight", main: "astronomers expect to see more than sixty meteors per hour.", d: "E" },
  { intro: "Drawing on interviews with hundreds of farmers", main: "the historian reconstructed daily life in the region during the drought.", d: "H" },
  { intro: "Even after the sun had set", main: "the desert sand remained warm enough to feel through our shoes.", d: "E" },
  { intro: "Encouraged by the results of the pilot program", main: "the district expanded free tutoring to every middle school.", d: "H" },
  { intro: "As the glacier retreated", main: "it left behind a valley scattered with enormous boulders.", d: "M" },
  { intro: "With only a pencil and a notebook", main: "the young naturalist recorded every bird species she saw on her walk.", d: "M" },
];

/** Colon introducing a list or explanation after a complete clause. */
export const COLON_SPLITS: { before: string; after: string; d: Difficulty }[] = [
  { before: "The recipe requires only three ingredients", after: "flour, water, and salt.", d: "M" },
  { before: "The museum's new exhibit focuses on a single question", after: "how did early humans first learn to control fire?", d: "H" },
  { before: "The expedition carried supplies for every kind of emergency", after: "splints, water filters, flares, and a satellite phone.", d: "M" },
  { before: "The coach gave her team one piece of advice before the final", after: "play as if the score were still tied.", d: "H" },
  { before: "The study identified two factors that predicted success", after: "regular practice and timely feedback.", d: "M" },
  { before: "The garden is organized around a simple principle", after: "every plant must be native to the region.", d: "H" },
  { before: "The ship's log recorded the day's conditions in detail", after: "wind speed, wave height, temperature, and visibility.", d: "M" },
  { before: "Visitors to the observatory can view three planets this month", after: "Mars, Jupiter, and Saturn.", d: "M" },
  { before: "The inventor's notebooks reveal his greatest fear", after: "that someone else would patent his design first.", d: "H" },
  { before: "The quilt combines fabric from four generations of the family", after: "a wedding dress, a soldier's uniform, a christening gown, and a child's sundress.", d: "H" },
];

/** Nonessential appositive / element set off by paired punctuation. */
export const APPOSITIVES: { start: string; appos: string; rest: string; d: Difficulty }[] = [
  { start: "The giant sequoia", appos: "one of the largest living organisms on Earth", rest: "can live for more than three thousand years.", d: "M" },
  { start: "Our team captain", appos: "a senior who has played since sixth grade", rest: "scored the winning goal.", d: "M" },
  { start: "The axolotl", appos: "a salamander native to lakes near Mexico City", rest: "can regrow lost limbs.", d: "M" },
  { start: "The old mill", appos: "which closed in 1952", rest: "has been converted into apartments.", d: "M" },
  { start: "The telescope", appos: "funded entirely by donations from local residents", rest: "opened to the public last spring.", d: "H" },
  { start: "Saffron", appos: "the dried stigmas of a particular crocus flower", rest: "is among the most expensive spices in the world.", d: "H" },
  { start: "The festival's headliner", appos: "a jazz pianist from New Orleans", rest: "performed for nearly three hours.", d: "M" },
  { start: "The Mariana Trench", appos: "the deepest known point in Earth's oceans", rest: "reaches nearly eleven kilometers below the surface.", d: "H" },
  { start: "My grandmother's recipe", appos: "handwritten on a stained index card", rest: "calls for twice as much ginger as most versions.", d: "M" },
  { start: "The rover", appos: "a six-wheeled robot about the size of a car", rest: "has traveled more than twenty kilometers since landing.", d: "H" },
];

/** Subject–verb agreement frames: correct verb + three wrong forms. */
export const SV_FRAMES: { pre: string; post: string; right: string; wrong: string[]; why: string; d: Difficulty }[] = [
  { pre: "The collection of handwritten letters, donated by the author's family,", post: "now on display in the library's main hall.", right: "is", wrong: ["are", "were", "have been"], why: "The subject is the singular noun \"collection,\" not \"letters,\" so the singular verb \"is\" is required.", d: "M" },
  { pre: "Each of the volunteers who helped clean the beach", post: "a certificate of appreciation.", right: "receives", wrong: ["receive", "are receiving", "have received"], why: "The subject \"Each\" is singular, so it takes the singular verb \"receives.\"", d: "M" },
  { pre: "The results of the long-term study", post: "that regular exercise improves memory in older adults.", right: "suggest", wrong: ["suggests", "is suggesting", "has suggested"], why: "The plural subject \"results\" requires the plural verb \"suggest.\"", d: "E" },
  { pre: "Neither the coach nor the players", post: "expecting the game to go into overtime.", right: "were", wrong: ["was", "is", "has been"], why: "With \"neither...nor,\" the verb agrees with the nearer subject, \"players,\" which is plural.", d: "H" },
  { pre: "The flock of migrating geese", post: "over the lake every October.", right: "passes", wrong: ["pass", "are passing", "have passed"], why: "\"Flock\" is a singular collective noun, so it takes the singular verb \"passes.\"", d: "M" },
  { pre: "The towering stacks of books in the corner of the shop", post: "the owner's favorite feature.", right: "are", wrong: ["is", "was", "has been"], why: "The plural subject \"stacks\" requires the plural verb \"are.\"", d: "M" },
  { pre: "One of the paintings that were stolen from the gallery", post: "recently been recovered.", right: "has", wrong: ["have", "are", "were"], why: "The subject is \"One,\" which is singular, so the verb must be \"has.\"", d: "H" },
  { pre: "The tomatoes growing along the fence", post: "ripened earlier than expected this year.", right: "have", wrong: ["has", "is", "was"], why: "The plural subject \"tomatoes\" requires \"have.\"", d: "E" },
  { pre: "The research team, along with two visiting scientists,", post: "planning a return trip to the volcano.", right: "is", wrong: ["are", "were", "have been"], why: "Phrases like \"along with\" do not change the subject. \"Team\" is singular, so \"is\" is correct.", d: "H" },
  { pre: "Mathematics, according to many of the surveyed students,", post: "their favorite subject.", right: "is", wrong: ["are", "were", "have been"], why: "\"Mathematics\" is a singular noun despite ending in -s.", d: "H" },
  { pre: "The instructions printed on the side of the box", post: "difficult to follow.", right: "were", wrong: ["was", "is", "has been"], why: "The plural subject \"instructions\" requires the plural verb \"were.\"", d: "E" },
  { pre: "The sound of distant thunder", post: "the hikers to head back down the trail.", right: "warns", wrong: ["warn", "are warning", "have warned"], why: "The singular subject \"sound\" takes the singular verb \"warns.\"", d: "M" },
  { pre: "There", post: "several reasons why the experiment failed.", right: "are", wrong: ["is", "was", "has been"], why: "In a sentence beginning with \"There,\" the verb agrees with the noun that follows: \"reasons,\" which is plural.", d: "M" },
  { pre: "The number of students enrolled in the robotics club", post: "doubled since last year.", right: "has", wrong: ["have", "are", "were"], why: "\"The number\" is singular, so it takes \"has.\"", d: "H" },
  { pre: "Both the oak and the maple in the front yard", post: "planted by my great-grandfather.", right: "were", wrong: ["was", "is", "has been"], why: "A compound subject joined by \"and\" is plural, so \"were\" is correct.", d: "E" },
  { pre: "The committee's recommendations for the new park", post: "a playground, a pond, and walking trails.", right: "include", wrong: ["includes", "is including", "has included"], why: "The plural subject \"recommendations\" takes the plural verb \"include.\"", d: "M" },
];

/** Verb tense frames anchored by a time cue. */
export const TENSE_FRAMES: { pre: string; post: string; right: string; wrong: string[]; why: string; d: Difficulty }[] = [
  { pre: "In 1869, workers", post: "the final spike into the first transcontinental railroad in the United States.", right: "drove", wrong: ["drive", "will drive", "have driven"], why: "The time phrase \"In 1869\" places the action in the past, so the simple past \"drove\" is correct.", d: "E" },
  { pre: "By the time the rescue boat arrived, the stranded hikers", post: "on the island for two days.", right: "had been", wrong: ["have been", "are", "will be"], why: "The waiting happened before another past event (the boat arriving), so the past perfect \"had been\" is needed.", d: "H" },
  { pre: "Next spring, the city", post: "a new bike lane along the river.", right: "will open", wrong: ["opened", "has opened", "had opened"], why: "\"Next spring\" refers to the future, so \"will open\" is correct.", d: "E" },
  { pre: "Since 2015, the museum", post: "more than two hundred works by local artists.", right: "has acquired", wrong: ["acquired", "acquires", "will acquire"], why: "\"Since 2015\" describes an action that began in the past and continues to the present, which calls for the present perfect.", d: "M" },
  { pre: "Every morning, the baker", post: "the ovens before the sun rises.", right: "lights", wrong: ["lit", "had lit", "will have lit"], why: "\"Every morning\" describes a habitual present action, so the simple present \"lights\" fits.", d: "E" },
  { pre: "Last winter, the pond near our school", post: "solid for the first time in a decade.", right: "froze", wrong: ["freezes", "has frozen", "will freeze"], why: "\"Last winter\" places the event in the past.", d: "E" },
  { pre: "The scientist was confident that, by the end of the decade, her team", post: "the mystery of the disappearing frogs.", right: "would solve", wrong: ["solves", "has solved", "is solving"], why: "The sentence describes a future from a past point of view, so \"would solve\" is correct.", d: "H" },
  { pre: "When the power went out last night, my brother", post: "his history essay.", right: "was writing", wrong: ["writes", "is writing", "will write"], why: "The action was in progress when another past event happened, so the past progressive is correct.", d: "M" },
  { pre: "Ancient Egyptians", post: "papyrus to make paper, rope, and even boats.", right: "used", wrong: ["use", "will use", "are using"], why: "The sentence describes past practices of an ancient civilization.", d: "E" },
  { pre: "By next June, the volunteers", post: "more than ten thousand trees.", right: "will have planted", wrong: ["planted", "have planted", "plant"], why: "The action will be complete before a future time, so the future perfect is needed.", d: "H" },
];

/** Pronoun / possessive frames. */
export const PRONOUN_FRAMES: { pre: string; post: string; right: string; wrong: string[]; why: string; d: Difficulty }[] = [
  { pre: "The city council released", post: "annual budget report on Friday.", right: "its", wrong: ["it's", "their", "they're"], why: "\"Council\" is a singular collective noun, and the possessive pronoun \"its\" (no apostrophe) is correct.", d: "M" },
  { pre: "The students presented", post: "findings to a panel of local engineers.", right: "their", wrong: ["they're", "there", "its"], why: "The plural \"students\" calls for the possessive pronoun \"their.\"", d: "E" },
  { pre: "Every spring, the oak tree loses some of", post: "older branches in storms.", right: "its", wrong: ["it's", "their", "its'"], why: "The singular \"tree\" takes \"its\"; \"it's\" means \"it is.\"", d: "E" },
  { pre: "The two companies agreed to combine", post: "research departments.", right: "their", wrong: ["its", "they're", "there"], why: "The plural antecedent \"companies\" requires \"their.\"", d: "E" },
  { pre: "When the hikers reached the summit, the view took", post: "breath away.", right: "their", wrong: ["his or her", "its", "they're"], why: "The antecedent \"hikers\" is plural, so \"their\" is correct.", d: "M" },
  { pre: "The orchestra tuned", post: "instruments as the audience found their seats.", right: "its", wrong: ["it's", "they're", "there"], why: "Here \"orchestra\" acts as a single unit, so the singular possessive \"its\" is correct.", d: "H" },
];

/** Plural vs possessive nouns. */
export const POSSESSIVE_FRAMES: { pre: string; post: string; right: string; wrong: string[]; why: string; d: Difficulty }[] = [
  { pre: "The", post: "nests, built high in the cliffs, were nearly impossible to reach.", right: "falcons'", wrong: ["falcon's", "falcons", "falcons's"], why: "The nests belong to several falcons, so the plural possessive \"falcons'\" is correct.", d: "M" },
  { pre: "The", post: "only entrance was hidden behind a curtain of vines.", right: "cave's", wrong: ["caves", "caves'", "cave"], why: "One cave possesses the entrance, so the singular possessive \"cave's\" is correct.", d: "M" },
  { pre: "All of the", post: "uniforms were replaced before the championship.", right: "players'", wrong: ["player's", "players", "players's"], why: "The uniforms belong to many players, so the plural possessive is needed.", d: "M" },
  { pre: "The scientists measured the", post: "wingspans to compare the two populations.", right: "butterflies'", wrong: ["butterfly's", "butterflies", "butterflys'"], why: "The wingspans belong to many butterflies: plural possessive \"butterflies'.\"", d: "H" },
  { pre: "Several", post: "on the trail were closed after the storm.", right: "bridges", wrong: ["bridge's", "bridges'", "bridges's"], why: "Nothing is possessed here; the sentence needs the simple plural \"bridges.\"", d: "E" },
  { pre: "The", post: "of the old house creaked with every step.", right: "floorboards", wrong: ["floorboard's", "floorboards'", "floorboards's"], why: "The sentence needs the plural noun, not a possessive.", d: "E" },
];

export type Relation = "contrast" | "addition" | "cause" | "example" | "sequence" | "similarity" | "emphasis";
export const TRANSITION_WORDS: Record<Relation, string[]> = {
  contrast: ["However,", "Nevertheless,", "Still,", "By contrast,"],
  addition: ["Moreover,", "Additionally,", "Furthermore,", "In addition,"],
  cause: ["Therefore,", "As a result,", "Consequently,", "Thus,"],
  example: ["For example,", "For instance,"],
  sequence: ["Later,", "Afterward,", "Finally,", "Then,"],
  similarity: ["Similarly,", "Likewise,"],
  emphasis: ["In fact,", "Indeed,"],
};

export const TRANSITIONS: { a: string; b: string; rel: Relation; d: Difficulty }[] = [
  { a: "Many people assume that cacti need very little care.", b: "most species require regular watering during their summer growing season.", rel: "contrast", d: "E" },
  { a: "The new library offers free tutoring for high school students.", b: "it hosts weekly workshops on writing college application essays.", rel: "addition", d: "E" },
  { a: "Heavy rains flooded the only road into the valley.", b: "supplies had to be delivered by helicopter for nearly a week.", rel: "cause", d: "E" },
  { a: "Some animals use tools to obtain food.", b: "sea otters crack open shellfish by striking them against rocks balanced on their chests.", rel: "example", d: "E" },
  { a: "The artist first sketched the mural's outline in chalk.", b: "she filled in each section with acrylic paint.", rel: "sequence", d: "E" },
  { a: "Bats use echolocation to navigate in total darkness.", b: "dolphins emit clicks and listen for the echoes to locate prey in murky water.", rel: "similarity", d: "M" },
  { a: "The early reviews of the play were harsh.", b: "audiences filled the theater every night for six months.", rel: "contrast", d: "M" },
  { a: "The company switched to recycled packaging.", b: "its shipping costs fell because the new boxes were lighter.", rel: "cause", d: "M" },
  { a: "Lichens can survive in extraordinarily harsh environments.", b: "some species have been found growing on bare rock in Antarctica.", rel: "example", d: "M" },
  { a: "The town's population had been declining for decades.", b: "a new high-speed rail stop brought hundreds of new residents within a few years.", rel: "contrast", d: "M" },
  { a: "Regular sleep helps students consolidate what they learned during the day.", b: "it improves mood and the ability to concentrate.", rel: "addition", d: "M" },
  { a: "The experiment's sample included only twelve participants.", b: "the researchers cautioned against drawing broad conclusions from it.", rel: "cause", d: "M" },
  { a: "The historian expected the archive to contain only a few letters.", b: "it held more than four thousand, many of them unread for a century.", rel: "contrast", d: "H" },
  { a: "Some critics dismissed the composer's early works as simple imitations of popular songs.", b: "later scholars noted that she was quietly experimenting with unusual rhythms in nearly every piece.", rel: "contrast", d: "H" },
  { a: "The robot was designed to inspect pipelines too narrow for human workers.", b: "engineers later adapted it to search collapsed buildings for survivors.", rel: "sequence", d: "H" },
  { a: "Engineers expected the old bridge to need major repairs.", b: "an inspection found that its iron supports were in excellent condition.", rel: "contrast", d: "E" },
  { a: "The garden's soil was extremely sandy and drained water quickly.", b: "the gardeners added compost to help it hold moisture.", rel: "cause", d: "E" },
  { a: "Several ancient cultures developed calendars based on the moon.", b: "early Babylonian astronomers tracked lunar cycles to organize their months.", rel: "example", d: "E" },
  { a: "The marathon runner trained at high altitude for months.", b: "she adjusted her diet to include more iron-rich foods.", rel: "addition", d: "E" },
  { a: "The documentary was praised for its stunning photography.", b: "critics noted that its narration was sometimes difficult to follow.", rel: "contrast", d: "E" },
  { a: "The chef spent years perfecting the restaurant's bread recipe.", b: "the bread became the item customers ordered most often.", rel: "cause", d: "M" },
  { a: "Penguins huddle together to conserve heat during Antarctic winters.", b: "emperor penguins rotate positions so that each bird spends time in the warm center of the group.", rel: "emphasis", d: "H" },
  { a: "Weather satellites provide detailed images of storm systems.", b: "ocean buoys supply data on wave height and water temperature.", rel: "addition", d: "M" },
  { a: "The violinist practiced the difficult passage slowly at first.", b: "she gradually increased the tempo until she could play it at full speed.", rel: "sequence", d: "E" },
  { a: "Mountain goats can climb nearly vertical cliffs.", b: "their split hooves spread apart to grip uneven rock.", rel: "emphasis", d: "H" },
  { a: "The survey found that most residents wanted more parks.", b: "the city council approved funding for two new green spaces.", rel: "cause", d: "E" },
  { a: "Some birds migrate thousands of miles each year.", b: "the bar-tailed godwit flies nonstop from Alaska to New Zealand.", rel: "example", d: "M" },
  { a: "The first version of the app was slow and difficult to use.", b: "after months of feedback from users, the developers released a redesigned version.", rel: "sequence", d: "M" },
  { a: "Elephants are known for their long memories.", b: "crows can recognize individual human faces for years.", rel: "similarity", d: "H" },
  { a: "The rainforest covers only a small fraction of Earth's land.", b: "it is home to a large share of the world's plant and animal species.", rel: "contrast", d: "M" },
  { a: "The museum extended its hours on weekends.", b: "attendance increased by nearly a third.", rel: "cause", d: "E" },
  { a: "The poet's early collections focused on rural landscapes.", b: "her later work turned almost entirely to life in crowded cities.", rel: "contrast", d: "M" },
  { a: "Solar panels can be installed on rooftops.", b: "they can be built into windows, roads, and even clothing.", rel: "addition", d: "M" },
  { a: "Volcanic soil is often rich in minerals.", b: "farmers have cultivated the slopes of active volcanoes for thousands of years.", rel: "cause", d: "H" },
  { a: "The scientist expected the seeds to sprout within a week.", b: "it took nearly a month for the first shoots to appear.", rel: "contrast", d: "E" },
  { a: "Learning a musical instrument requires patience.", b: "learning a new language takes years of steady practice.", rel: "similarity", d: "M" },
];

/** Words in Context: passage with "______", correct word, three wrong, explanation. */
export const WIC: { text: string; right: string; wrong: string[]; why: string; d: Difficulty }[] = [
  { text: "The hikers had expected the river crossing to be easy, but the current was so ______ that they decided to wait until the water level dropped.", right: "forceful", wrong: ["gentle", "shallow", "predictable"], why: "The hikers decided to wait, which suggests the current was strong. \"Forceful\" fits that context.", d: "E" },
  { text: "Although the professor's lectures were packed with information, her explanations were so ______ that even beginners could follow them.", right: "clear", wrong: ["complicated", "lengthy", "hurried"], why: "\"Even beginners could follow them\" signals that the explanations were easy to understand, or clear.", d: "E" },
  { text: "The candidate's speech was ______: it repeated the same few points again and again without adding any new detail.", right: "repetitive", wrong: ["innovative", "concise", "persuasive"], why: "The speech repeated the same points, which makes it repetitive.", d: "E" },
  { text: "The new evidence did not ______ the original theory; instead, it confirmed several of its key predictions.", right: "undermine", wrong: ["support", "describe", "inspire"], why: "\"Instead, it confirmed\" contrasts with the blank, so the blank must mean the opposite of confirm: \"undermine.\"", d: "M" },
  { text: "Many early critics found the painter's bold colors ______, but today those same colors are celebrated as the most original feature of her work.", right: "jarring", wrong: ["soothing", "faded", "traditional"], why: "The contrast with \"celebrated\" suggests early critics reacted negatively, and \"jarring\" (harsh and unsettling) fits.", d: "M" },
  { text: "Because the ancient manuscript was so ______, the conservators handled each page with soft cotton gloves and spoke in whispers near it.", right: "fragile", wrong: ["sturdy", "ordinary", "recent"], why: "The extreme care described suggests the manuscript could be easily damaged.", d: "E" },
  { text: "The engineer's report was ______ in its criticism: it identified exactly which beams were weak and why.", right: "precise", wrong: ["vague", "lenient", "brief"], why: "Identifying \"exactly which beams\" shows precision.", d: "M" },
  { text: "Rather than ______ the disagreement, the mediator encouraged both sides to state their concerns openly.", right: "suppress", wrong: ["discuss", "resolve", "explain"], why: "\"Rather than\" sets up a contrast with encouraging open discussion. \"Suppress\" (keep hidden) is the opposite.", d: "M" },
  { text: "The biologist's findings were initially met with ______; few colleagues believed that a fish could recognize its own reflection.", right: "skepticism", wrong: ["enthusiasm", "indifference", "gratitude"], why: "\"Few colleagues believed\" indicates doubt, or skepticism.", d: "M" },
  { text: "The author's prose is notably ______: she rarely uses two words when one will do.", right: "economical", wrong: ["ornate", "careless", "dramatic"], why: "Using as few words as possible is economical writing.", d: "H" },
  { text: "Though the treaty was intended to be temporary, it proved remarkably ______, remaining in force for more than a century.", right: "durable", wrong: ["controversial", "fleeting", "obscure"], why: "Remaining in force for a century shows that the treaty was durable.", d: "M" },
  { text: "The coach praised the team's ______ effort; even when they were far behind, no one stopped trying.", right: "tenacious", wrong: ["halfhearted", "reckless", "occasional"], why: "Refusing to stop trying shows a persistent, tenacious effort.", d: "H" },
  { text: "Some researchers argue that the decline of the bee population is ______, the result of many interacting causes rather than any single one.", right: "multifaceted", wrong: ["inevitable", "exaggerated", "sudden"], why: "\"Many interacting causes\" describes something with many aspects, or multifaceted.", d: "H" },
  { text: "Visitors are often surprised by how ______ the desert is at night; temperatures can drop below freezing.", right: "frigid", wrong: ["humid", "bright", "crowded"], why: "Below-freezing temperatures make the desert frigid.", d: "E" },
  { text: "The historian cautioned that the diary offers only a ______ view of the war, since its writer never left her small village.", right: "limited", wrong: ["comprehensive", "dishonest", "dramatic"], why: "A writer who never left her village could only describe a narrow, limited part of the war.", d: "M" },
  { text: "The architect's design was ______: it reused the factory's original brick walls while adding a modern glass roof.", right: "inventive", wrong: ["conventional", "temporary", "wasteful"], why: "Blending old walls with a modern roof is a creative, inventive approach.", d: "E" },
  { text: "Far from being ______, the town's annual parade has changed dramatically over the years, adding new floats and traditions each decade.", right: "static", wrong: ["popular", "colorful", "lengthy"], why: "\"Far from being\" signals the opposite of \"changed dramatically,\" which is static (unchanging).", d: "H" },
  { text: "The novelist is known for her ______ characters, whose motives are rarely simple and often contradictory.", right: "complex", wrong: ["shallow", "cheerful", "minor"], why: "Characters with contradictory motives are complex.", d: "E" },
  { text: "The committee's decision was ______; every member voted in favor of the proposal.", right: "unanimous", wrong: ["divided", "tentative", "delayed"], why: "When every member votes the same way, the decision is unanimous.", d: "E" },
  { text: "Initially ______ about the new software, the staff became enthusiastic once they saw how much time it saved.", right: "wary", wrong: ["eager", "certain", "proud"], why: "\"Initially\" contrasts with later enthusiasm, so the staff first felt cautious, or wary.", d: "M" },
  { text: "The scientist's conclusion was ______ because it rested on data from only three trials.", right: "tentative", wrong: ["definitive", "obvious", "famous"], why: "Limited data supports only a tentative (uncertain) conclusion.", d: "M" },
  { text: "The festival's organizers hoped to ______ interest in traditional crafts among younger residents.", right: "revive", wrong: ["discourage", "measure", "conceal"], why: "Hoping to increase interest that had faded means to revive it.", d: "E" },
  { text: "The essay's argument is ______; each paragraph builds logically on the one before it.", right: "coherent", wrong: ["disjointed", "emotional", "repetitive"], why: "Paragraphs that build logically make an argument coherent.", d: "M" },
  { text: "Though often portrayed as ______, wolves in the study spent most of their time resting and avoiding conflict.", right: "aggressive", wrong: ["lazy", "timid", "curious"], why: "\"Though\" contrasts the portrayal with behavior that avoids conflict, so the portrayal must be aggressive.", d: "M" },
  { text: "The diplomat's response was deliberately ______, leaving reporters unsure whether she supported the plan or not.", right: "ambiguous", wrong: ["enthusiastic", "hostile", "detailed"], why: "A response that leaves listeners unsure is ambiguous.", d: "H" },
  { text: "The sculptor's work seems ______ at first glance, but closer inspection reveals thousands of tiny, intricate carvings.", right: "plain", wrong: ["elaborate", "enormous", "fragile"], why: "\"But closer inspection reveals\" intricate details, contrasting with a first impression of simplicity.", d: "M" },
  { text: "Because the river's course had ______ over centuries, the ancient port now sits several kilometers inland.", right: "shifted", wrong: ["frozen", "narrowed", "vanished"], why: "A port ending up inland suggests that the river moved, or shifted.", d: "M" },
  { text: "The researcher was ______ in recording her observations, noting the time, temperature, and weather for every measurement.", right: "meticulous", wrong: ["careless", "secretive", "hasty"], why: "Recording every detail shows a meticulous approach.", d: "H" },
  { text: "The mayor's plan received ______ support: residents across every neighborhood signed petitions in its favor.", right: "widespread", wrong: ["minimal", "reluctant", "secret"], why: "Support from every neighborhood is widespread.", d: "E" },
  { text: "Rather than offering a single interpretation, the poem remains deliberately ______, inviting readers to find their own meanings.", right: "open-ended", wrong: ["straightforward", "humorous", "outdated"], why: "Inviting multiple meanings makes the poem open-ended.", d: "H" },
];
