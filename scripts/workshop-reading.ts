import { TAXONOMY, type Difficulty, type Question, type Table } from "../src/lib/types";
import { LETTERS, rng } from "./lib";
import { cases } from "./workshop-cases";
import { wordCards } from "./workshop-words";
import { completions } from "./workshop-cloze";

const skills = TAXONOMY.rw.flatMap(group => group.skills.map(skill => ({domain:group.domain, skill})));
const convention = "Which choice completes the text so that it conforms to the conventions of Standard English?";
const transition = "Which choice completes the text with the most logical transition?";
const unstop = (s: string) => s.replace(/\.$/, "");
const lower = (s: string) => /^(Mira|Inez|Ren|Asa|Neri)\b/.test(s) ? s : s.charAt(0).toLowerCase()+s.slice(1);
type Exercise = { passage: string; stem: string; right: string; wrong: string[]; why: string; d: Difficulty; passage2?: string; table?: Table };
const entry = (passage: string, stem: string, right: string, wrong: string[], why: string, d: Difficulty = "M"): Exercise => ({passage, stem, right, wrong, why, d});

function fromCase(index: number, f: number, skill: number): Exercise {
  const {topic, opening, a, b, evidenceA, evidenceB, readingA, readingB, clueA, clueB} = cases[index];
  const [claim, rival, detail, counter] = (index+f)%2 ? [a,b,evidenceA,evidenceB] : [b,a,evidenceB,evidenceA];
  const [interpretation,alternative,clue,otherClue] = (index+f)%2 ? [readingA,readingB,clueA,clueB] : [readingB,readingA,clueB,clueA];
  const sentence = (s:string) => s.charAt(0).toUpperCase()+s.slice(1)+".";
  const premise = `One reading is that ${lower(claim)}`;
  const other = `A different reading is that ${lower(rival)}`;
  const notes = (lines: string[]) => "A student has taken the following notes.\n\n" + lines.map(line=>"• "+line).join("\n");
  const opposing = `The texts disagree about whether the account of ${topic} is internally consistent.`;
  switch (skill) {
    case 0: { // central ideas and details
      const stem = "Which choice best states the main idea of the text?";
      return [
        entry(`${opening} ${detail} A reader familiar only with the opening observation could easily miss the significance of that second detail.`, stem, sentence(interpretation),
          [rival,"The first observation is more revealing than the detail that follows it.","The two observations are incompatible accounts of the same event."],
          `The opening identifies the feature that needs explaining. The detail “${unstop(detail)}” points to this interpretation: ${claim} The alternative has no comparable support in this passage.`),
        entry(`${opening} ${premise} ${other} The opening observation fits either account. One further detail, however, favors the second: ${counter}`,stem,
          `A further detail about ${topic} favors the view that ${lower(rival)}`,
          [`A further detail about ${topic} favors the view that ${lower(claim)}`,`The disagreement over ${topic} rests on conflicting descriptions of its appearance.`,`The two readings of ${topic} turn out to be different expressions of the same idea.`],
          `The author moves from two plausible explanations to evidence that favors the second. “${unstop(counter)}” supplies the reason for that preference.`,"M"),
        entry(`${opening} ${premise} Consider one detail: ${detail} Yet another detail complicates the picture: ${counter} That second detail would also make sense if ${lower(rival)}`,stem,
          "Different details lend support to two interpretations of the same observation.",
          ["Two initially competing explanations turn out to rely on the very same detail.","A new detail directly contradicts the original description and makes both readings untenable.","A later account fully settles a disagreement that an earlier account had left open."],
          `One detail supports the first reading: ${detail} The competing reading also has support: ${counter} The text stops short of a final verdict.`,"H"),
        entry(`${opening} In a discussion, one reader argues that ${lower(claim)} A second reader agrees with the description but asks whether another explanation might fit it. The first reader replies by pointing to a separate detail. ${detail}`,
          "According to the text, what does the second reader question?", "Whether the shared observation supports only the first reader’s interpretation.",
          ["Whether the first reader has described the original observation accurately.","Whether the separate detail appeared before the discussion began.","Whether the first reader is entitled to consider evidence beyond the original observation."],
          `Both readers accept the opening description of ${topic}. Their disagreement concerns what can be inferred from it. The first reader introduces “${unstop(detail)}” only after that challenge.`,"E"),
      ][f];}
    case 1: { // textual and quantitative command of evidence
      if (f===3) {
        const pre=14+index%13, post=pre+7+index%8, control=pre+index%4, end=control+1+index%3;
        return {...entry(`${opening} Readers considered the interpretation “${claim}” before and after a second reading. One group received an additional detail: ${detail} The other group reread the original passage alone. A student argues that support for the interpretation rose more in the group with the added detail.`,
          "Which choice best uses data from the table to support the student’s claim?",
          `Support rose by ${post-pre} readers with the detail and by ${end-control} readers without it.`,
          [`Support rose by ${end-control} readers with the detail and by ${post-pre} readers without it.`,`At the first reading, ${post} readers with the detail and ${end} readers without it supported the interpretation.`,`The two groups each had 50 readers, and ${pre} in the first group initially supported the interpretation.`],
          `Compare changes within each group. The first rises from ${pre} to ${post} (+${post-pre}); the second rises from ${control} to ${end} (+${end-control}). Group sizes alone do not establish which change was larger.`,"M"),
          table:{caption:"Readers endorsing the interpretation (50 per group)", headers:["Group","Before","After"],rows:[["Additional detail",pre,post],["Original only",control,end]]}};
      }
      return [
        entry(`${opening} ${premise}`,"Which additional detail, if true, would most directly support that reading?",detail,
          [counter,`Two accounts of ${topic} describe the initial observation in the same terms.`,`A later summary of ${topic} repeats the proposed reading without giving its source.`],
          `The claim is specific: ${claim} “${unstop(detail)}” is evidence for that explanation. Restating the feature or repeating an opinion would leave its explanation open.`),
        entry(`${opening} An essay takes the position that ${lower(rival)} Another reader argues that ${lower(claim)}`,
          "Which finding would most strengthen the other reader’s response to the essay?", detail,
          [counter,`An early version of the essay states the same position as its published version.`,`Readers agree on the description of ${topic} that the essay takes as its starting point.`],
          `Follow the attribution: the other reader proposes that ${lower(claim)} The detail “${unstop(detail)}” bears on that proposal, while “${unstop(counter)}” would help the essay's position.`,"H"),
        entry(`${opening} A writer claims that the following is the only explanation worth considering: ${claim}`,
          "Which finding would most directly challenge the writer’s insistence on a single explanation?",counter,
          [detail,`Two summaries of ${topic} use different words to describe the same initial observation.`,`The writer first presented this interpretation of ${topic} in a shorter account.`],
          `The target is the word “only.” The finding “${unstop(counter)}” gives another explanation positive support: ${rival} It need not disprove the original reading to weaken the claim of exclusivity.`,"H"),
      ][f];}
    case 2: return [
      entry(`${opening} ${detail}`,"Which inference about the opening observation is best supported by the additional detail?",claim,
        [rival,"The initial description omits the very feature that attracted attention.","The added detail dates the observation more precisely than the opening does."],
        `Connect the specific detail to the proposed motive or cause: ${detail} It makes this reading more likely: ${claim}`),
      entry(`${opening} ${premise} If that proposal is sound, one would expect to find a detail specifically bearing on it even apart from the original observation.`,
        "Which finding would best meet that expectation?",detail,[counter,`Two readers independently notice the feature described in the account of ${topic}.`,`One published description of ${topic} is longer than an earlier description of it.`],
        `The expected finding must follow from the particular explanation, beyond simply recognizing the observation. “${unstop(detail)}” links the observation to that explanation.`),
      entry(`${opening} ${detail} A reader concludes that ${lower(claim)} Now suppose the additional detail was mistakenly attributed to this account and should be removed.`,
        "What would most logically follow from that correction?",
        "The reading could still fit the observation, but it would lose a specific reason in its favor.",
        ["The competing reading would acquire direct support from the original observation alone.","The original description would have to be discarded along with the misattributed detail.","The reading would become more certain because it would rely on a single observation."],
        `Removing “${unstop(detail)}” removes support for the inference. The original observation about ${topic} still stands and could have more than one explanation.`,"H"),
      entry(`${opening} A reader proposes that ${lower(claim)} A second observer does not contest the original description but points out a further detail. ${counter} Together these observations suggest that ______`,
        "Which choice most logically completes the text?",`the possibility that ${alternative} deserves consideration.`,
        [`the second observer independently confirmed that ${lower(claim)}`,`the second observer disputes the original description of ${topic} itself.`,`the original observation establishes which interpretation of ${topic} is correct without further evidence.`],
        `The new detail points toward a competing explanation: ${rival} Accepting it as a possibility is a more defensible inference than saying either account is proved.`,"H"),
    ][f];
    case 4: {
      const supports = (index+f)%3!==1;
      const cited = supports ? detail : counter;
      const relevant = supports ? clue : otherClue;
      const inference = supports ? interpretation : alternative;
      const otherInference = supports ? alternative : interpretation;
      const structure = [
        entry(`${opening} ${premise} ${cited}`, "What is the main function of the final sentence?",
          supports ? `It gives evidence that ${interpretation}.` : `It complicates the proposed reading by suggesting that ${alternative}.`,
          [supports ? `It offers an alternative by implying that ${alternative}.` : `It corroborates the proposal that ${interpretation}.`,`It identifies a flaw in the observation that ${relevant}.`,`It treats the view that ${otherInference} as an established fact.`],
          `Compare the final detail with the proposal directly before it. The detail tells us that ${relevant}, which points toward the reading that ${inference}.`),
        entry(`${opening} ${premise} Another reader counters with a detail: ${counter} The first reader then identifies a detail the other has left out. ${detail}`,
          `What role does the sentence “${counter}” play in the exchange?`,
          `It gives the second reader grounds for thinking that ${alternative}.`,
          [`It gives the first reader grounds for thinking that ${interpretation}.`,`It challenges the report that ${clue} by identifying a problem with its source.`,`It shows that both readers agree that ${interpretation}.`],
          `The quoted detail appears in the second reader’s response. Knowing that ${otherClue} gives a reason to consider the competing reading. The first reader's reply comes afterward.`,"H"),
        entry(`${opening} ${cited} On the strength of this detail, one reader argues that ${lower(supports ? claim : rival)}`,
          "Which choice best describes how the text develops its interpretation?",
          `It moves from an observation to the clue that ${relevant}, then proposes that ${inference}.`,
          [`It begins with the claim that ${inference}, then rejects the report that ${relevant}.`,`It contrasts two sources for the claim that ${otherInference} and judges one more reliable.`,`It proposes that ${otherInference}, then describes a test that rules out the possibility that ${inference}.`],
          `Track the order. The opening describes the feature, the next sentence introduces the evidence, and the inference comes last. The evidence here points to the idea that ${inference}.`),
        entry(`${opening} ${premise} If it could be shown that ${lower(unstop(cited))}, that would help a reader assess the proposal. For now that detail is unconfirmed.`,
          "Why does the author introduce the conditional statement beginning with “If”?",
          `To identify evidence that, if confirmed, would ${supports ? "support" : "challenge"} the view that ${interpretation}.`,
          [`To report a confirmed observation establishing that ${inference}.`,`To argue that the initial description is mistaken because ${relevant}.`,`To conclude that the view that ${otherInference} has already been ruled out.`],
          `“If” makes the detail a possibility to investigate. Confirmation that ${relevant} would favor the idea that ${inference}. The author explicitly leaves its status open.`,"H"),
      ];
      return structure[f];}
    case 5: { // paired texts
      const make = (one:string,two:string,stem:string,right:string,wrong:string[],why:string,d:Difficulty="M") => ({...entry(one,stem,right,wrong,why,d),passage2:two});
      return [
        make(`${opening} ${premise} ${detail}`,`${other} ${counter}`,"What is the main point of disagreement between the two texts?",
          `Whether ${interpretation} or ${alternative}.`,[`Whether the description of ${topic} refers to the same feature in each account.`,`Which text first reported the observation about ${topic}.`,`Whether more than one observer has noticed ${topic}.`],
          `Text 1 argues that ${lower(claim)} Text 2 proposes that ${lower(rival)} They differ about the explanation rather than the opening description.`,"E"),
        make(`${opening} I take the observation to mean that ${lower(claim)}`,`I agree that this reading is possible. But it leaves one detail unexplained: ${counter} That detail points to a different possibility.`,
          "Which choice best represents how the author of Text 2 would respond to Text 1?",`The reading is possible, but the fact that ${otherClue} gives a reason to think that ${alternative}.`,
          ["The reading would be stronger if the starting observation were removed from the account.","The reading accurately explains the detail Text 2 introduces as a possible complication.",opposing],
          `Text 2 accepts the possibility raised in Text 1 and adds “${unstop(counter)}.” That evidence favors this competing reading: ${rival}`),
        make(`${opening} The initial observation is intriguing, but on its own it does not distinguish between different interpretations.`,`Consider the following additional detail: ${detail} It gives reason to think that ${lower(claim)}`,
          "How does Text 2 relate to the limitation identified in Text 1?",`By reporting that ${clue}, it gives a reason to favor the view that ${interpretation}.`,
          ["It challenges the initial observation by replacing it with an incompatible one.","It restates the limitation and declines to offer any further evidence.","It agrees that evidence outside the original observation cannot resolve the issue."],
          `Text 1 limits what can be inferred from the initial observation alone. Text 2 goes beyond it with “${unstop(detail)}” and links that evidence to a particular reading.`),
        make(`${opening} I find the following reading persuasive: ${claim} What convinces me is this detail: ${detail}`,`The observation is worth explaining, but the case for that particular reading depends on a detail whose source still needs checking.`,
          "Which finding would most directly address the concern raised in Text 2?",`An independent source confirms that ${clue}.`,
          ["A survey finds that many readers would have proposed the same reading as Text 1.","A new description of the original observation uses the same wording as Text 1.","The author of Text 1 offers an additional example of an entirely different feature."],
          `Text 2 questions the source of “${unstop(detail)}.” Independent confirmation of that detail addresses the objection more directly than popularity or a repeated description.`,"H"),
      ][f];}
    case 6: { // use notes toward a stated rhetorical goal
      const synthesis = (lines:string[],goal:string,right:string,wrong:string[],why:string) => entry(notes(lines),`The student wants to ${goal}. Which choice most effectively uses relevant information from the notes to accomplish this goal?`,right,wrong,why);
      return [
        synthesis([opening,claim,detail,rival],"present one interpretation and evidence that specifically supports it",`${claim} One indication is that ${lower(detail)}`,
          [`${rival} The evidence for this interpretation is that ${lower(detail)}`,`${opening} Two readers offer interpretations of this observation.`,`One interpretation is that ${lower(claim)} Another is that ${lower(rival)}`],
          `The goal calls for a claim paired with its own evidence. “${unstop(detail)}” supports “${unstop(claim)}.” Simply listing both interpretations would miss the requested link.`),
        synthesis([opening,claim,detail,rival,counter],"contrast the two proposed explanations",`One reading holds that ${lower(claim)} Another holds that ${lower(rival)}`,
          [`One reading holds that ${lower(claim)} A supporting detail is that ${lower(detail)}`,`${counter} This detail must be considered alongside the observation about ${topic}.`,`${opening} One account expands on the observation: ${detail}`],
          `A contrast must give both explanations. The two notes that supply them are “${unstop(claim)}” and “${unstop(rival)}.”`),
        synthesis([opening,`First proposal: ${claim}`,`Second proposal: ${rival}`,counter],"illustrate the second proposal for a reader who already knows the first",
          `${counter} This fits the idea that ${lower(rival)}`,[`${counter} This observation lends weight to the first proposal about ${topic}.`,`Two proposals have been advanced about ${topic}, both responding to the same observation.`,`${opening} A reader familiar with the first explanation will recognize the starting point.`],
          `The reader already has the first explanation. The relevant synthesis connects the second proposal to a concrete detail: ${counter}`),
        synthesis([opening,claim,detail,`The source of the supporting detail has not yet been independently checked.`],"state a limitation on the evidence for the proposal",
          `The case that ${lower(unstop(claim))} relies on a detail whose source still needs checking.`,
          [`${detail} This makes the proposed account of ${topic} an established fact.`,`The description of ${topic} was invented after the supporting detail could not be confirmed.`,`Because one detail still needs checking, no account of ${topic} can be investigated further.`],
          `The final note qualifies the evidence, not the original description. The accurate limitation preserves that distinction and leaves room for verification.`),
      ][f];}
    case 7: {
      const rows = [
        [`${opening} One reader argues that ${interpretation}. ______ a second argues that ${alternative}.`,"By contrast,","Consequently,","For instance,","More precisely,",`The two readers offer competing explanations for the same feature. The second proposes that ${alternative}.`],
        [`${opening} Evidence for the idea that ${interpretation} includes a further observation. ______ ${lower(detail)}`,"For instance,","Nevertheless,","As a result,","In the meantime,",`The first sentence promises an observation supporting a reading. The next supplies a specific example: ${clue}.`],
        [`${opening} A commentator gave just one reason for the view that ${interpretation}. A check established that the supporting detail belonged to a different account. ______ the commentator withdrew the claim pending new evidence.`,"Accordingly,","Likewise,","For example,","Even so,",`Losing the only evidence causes the commentator to withdraw the claim. The transition needs to introduce that consequence.`],
        [`${opening} ${premise} ${detail} ______ one feature remains difficult to explain on this reading: ${counter}`,"Even so,","For this reason,","Similarly,","In other words,",`The next observation limits a persuasive case. It matters that ${otherClue} even after granting the force of the first detail.`],
        [`${opening} An editor did not print a verdict about whether ${interpretation}. ______ she printed the two possible readings side by side and let readers weigh the evidence.`,"Instead,","Thus,","For example,","Likewise,",`Placing both readings side by side is what the editor does in place of issuing a verdict. The second action substitutes for the rejected one.`],
        [`${opening} The first reading session ended with a proposal that ${interpretation}. ______ at a second session a month later, a reader offered another account: ${rival}`,"Subsequently,","For example,","In other words,","On the contrary,",`The sessions are explicitly a month apart. Their order, rather than a disagreement between the dates, is the relationship signaled by the blank.`],
        [`${opening} Two independent readers reached the view that ${interpretation}. The first pointed out that ${clue}. ______ the second cited essentially the same feature, though in different words.`,"Likewise,","Conversely,","Consequently,","In particular,",`The text sets the second reader’s reasoning alongside a matching observation from the first. Neither reader’s act is presented as causing the other's.`],
        [`${opening} The catalog includes one detail, but the editor lacks the source that would place it in this particular account. ______ it is still unclear whether the detail can be used as evidence that ${interpretation}.`,"Therefore,","Meanwhile,","By contrast,","For instance,",`The missing source gives the reason for uncertainty that follows. The second sentence draws a conclusion from the first.`],
        [`${opening} The writer treats the view that ${interpretation} as provisional. ______ she regards it as a reading that further evidence could change.`,"In other words,","Even so,","Subsequently,","In comparison,",`The second sentence restates the meaning of “provisional” rather than adding a later event or an opposing claim.`],
        [`${opening} A reader making the case that ${interpretation} notes first that ${clue}. ______ the reader identifies an independent record of the same detail, adding a second reason to take it seriously.`,"Moreover,","Nonetheless,","In contrast,","Previously,",`The independent record adds support to the same reading. It neither qualifies nor replaces the initial observation.`],
        [`${opening} A commentator assumed that everyone had favored the idea that ${interpretation}. ______ the earliest recorded response explicitly argues that ${alternative}.`,"On the contrary,","Similarly,","As a consequence,","For instance,",`The earliest response is a counterexample to the assertion about everyone. It contradicts that assertion instead of illustrating it.`],
        [`${opening} A report on ${topic} covers several issues, including how sources were identified and how readers chose between interpretations. The final page treats one of these issues in detail. ______ it compares the grounds for thinking that ${interpretation} with those for thinking that ${alternative}.`,"Specifically,","Regardless,","Instead,","Earlier,",`The last sentence names the particular issue addressed by the final page, narrowing a broad description to a specific example.`],
      ];
      const [passage,right,...rest]=rows[(index*4+f)%rows.length];
      return entry(passage,transition,right,rest.slice(0,3),rest[3],f===0?"E":"M");}
    case 8: {
      const part = unstop(opening);
      if ((index+f)%3!==0) {
        const second = lower(detail);
        const notes = `A reader offers this interpretation of ${topic}: ${claim}`;
        return [
          entry(`${notes} The reader points to a concrete ______ ${lower(detail)}`, convention,"detail:",["detail that:","detail because;","detail, namely;"],
            `The complete clause “The reader points to a concrete detail” introduces the specific detail that follows. A colon marks that explanation. The phrase “that:” breaks the link to its clause.`),
          entry(`${notes} Although the opening observation is compatible with that ______ a second interpretation remains possible.`,convention,"reading,",["reading;","reading.","reading:"],
            `The word “Although” makes the first clause dependent. A comma joins it to the main clause about a second interpretation; a period or semicolon would leave the opening fragment unattached.`),
          entry(`${opening} A second reader disputed the initial ______ the two readers continued to agree about the description itself.`,convention,"explanation, but",["explanation,","explanation but,","explanation"],
            `Both “a second reader disputed the initial explanation” and “the two readers continued to agree” have subjects and finite verbs. A comma and “but” join the independent clauses and express the contrast.`),
          entry(`${notes} The proposed reading rests on a detail that is easy to ______ ${second}`,convention,"overlook:",["overlook because:","overlook and;","overlook, however"],
            `The complete clause ending with “overlook” introduces the detail itself. A colon links those parts. “Because:” would separate a subordinating conjunction from its clause.`),
          entry(`${opening} The two explanations — each advanced by a different ______ agree on the observation itself.`,convention,"reader —",["reader,","reader;","reader:"],
            `The first dash opens an interruption. A second dash closes it and allows the main clause, “The two explanations agree on the observation itself,” to continue.`),
          entry(`${notes} A detail that a second observer recorded ______ particular attention. ${detail}`,convention,"deserves",["; deserves",", deserves",": deserves"],
            `The whole noun phrase “A detail that a second observer recorded” is the subject. Place its verb “deserves” immediately after the subject without a comma, colon, or semicolon.`),
          entry(`${opening} The first description was ______ the second, much longer. Both took the same observation as their point of departure.`,convention,"brief;",["brief, and,","brief: and","brief and,"],
            `The parallel second clause omits “was”: “the second [was] much longer.” A semicolon cleanly separates the two clauses, while the comma in the second marks the omitted verb.`,"H"),
          entry(`${notes} In a review of the ______ a different reader proposed that ${lower(rival)}`,convention,"original account,",["original, account","original account;","original account."],
            `“In a review of the original account” introduces the main clause. The comma belongs after the complete introductory phrase, rather than between “original” and “account.”`,"E"),
        ][(index*3+f)%8];
      }
      return [
        entry(`${part} ______ a later account adds a second detail. ${detail}`,convention,"; however,",[", however,"," however,"," however and,"],
          `“${opening}” is a complete clause, as is “a later account adds a second detail.” Place a semicolon between them and a comma after the transitional adverb “however.”`),
        entry(`An essay on ${topic} opens with a claim. According to one ______ the observation supports the following reading: ${claim}`,convention,"reviewer,",["reviewer;","reviewer.","reviewer:"],
          `“According to one reviewer” is an introductory prepositional phrase. A comma sets it off from the complete clause beginning “the observation.” None of the other separators can end the introductory phrase here.`,"E"),
        entry(`One proposal about ${topic}, a possibility raised in a discussion of the ______ depends on a specific detail. ${detail}`,convention,"evidence,",["evidence","evidence;","evidence:"],
          `Remove “a possibility raised in a discussion of the evidence” to see the main clause: one proposal depends on a detail. The inserted phrase opens with a comma and needs a matching closing comma.`),
        entry(`${opening} A reader weighing two possible explanations would need to decide ______ the evidence favors the view that ${lower(unstop(claim))} or lends more weight to the competing view.`,convention,"whether",["whether,","whether:","; whether"],
          `The clause beginning “whether” is the object of “decide.” Keep the verb attached to what must be decided; punctuation after “whether” would also split that conjunction from its clause.`,"H"),
      ][f];}
    case 9: {
      if ((index+f)%3!==0) {
        return [
          entry(`${opening} Neither the first explanation nor the two alternatives ______ every detail in the account.`,convention,"explain",["explains","explaining","has explained"],
            `With “neither … nor,” the nearer subject controls agreement. The nearer subject, “the two alternatives,” is plural and takes “explain.”`),
          entry(`${opening} Each of the readers who proposed alternative interpretations ______ a different detail to the discussion.`,convention,"brings",["bring","bringing","have brought"],
            `The subject of the main clause is singular “Each.” The phrase about readers contains plural words, but none is the subject of the main verb.`),
          entry(`${opening} The writer examined the competing explanations before ______ the one best supported by the evidence.`,convention,"selecting",["selected","to select","will select"],
            `After the preposition “before,” use the -ing form when there is no new subject. “Before selecting” also makes the writer the person taking both actions.`,"E"),
          entry(`Having read the account of ${topic} twice, ______. The original observation seemed clear, but its significance did not.`,convention,"the students compared their interpretations",["the interpretations were compared by the students","a comparison of interpretations began","the discussion turned to interpretation"],
            `The students read the account, so “the students” must follow the introductory participial phrase. The alternatives make interpretations, a comparison, or a discussion appear to have read it.`),
          entry(`${opening} Both researchers cited a single shared source. Their joint note identifies that source as the two ______ starting point.`,convention,"researchers’",["researcher’s","researchers","researcher"],
            `Two people share the starting point. Form the plural “researchers” first, then put the possessive apostrophe after the final s.`),
          entry(`${opening} The initial account and the later note each have a date. The editor checks both dates because ______ order determines which observer could have read the other’s work.`,convention,"their",["its","they’re","there"],
            `The order belongs to the two dates, so the possessive determiner is “their.” “They’re” means “they are,” and “there” does not express possession.`,"E"),
          entry(`${opening} Yesterday, after looking again at the observation, the reader ______ the earlier explanation and offered another.`,convention,"withdrew",["withdraws","withdrawing","will withdraw"],
            `“Yesterday” places the decision in the past, and “offered” confirms the tense of the coordinated actions. The matching finite verb is “withdrew.”`),
          entry(`${opening} Evidence for the first reading includes one detail. Evidence for the competing reading, along with two notes on the source, ______ in a separate appendix.`,convention,"appears",["appear","have appeared","appearing"],
            `The subject is singular “Evidence.” The phrase beginning “along with” adds information without making the subject plural, so the finite verb is “appears.”`),
        ][(index*3+f)%8];
      }
      return [
      entry(`${opening} The collection of notes about the competing explanations ______ one especially revealing detail. ${detail}`,convention,"includes",["include","including","have included"],
        `The subject is the singular “collection.” The plural nouns inside “of notes about the competing explanations” do not control the verb. “Includes” is the singular finite verb.`,"E"),
      entry(`${opening} By the time a second reader proposed that ${lower(unstop(rival))}, the first reader ______ the original account and filed the notes away.`,convention,"had already examined",["will already examine","already examining","has already been examining"],
        `The proposal and filing are in the past. Examining occurred earlier than the second reader’s proposal, which the past perfect “had already examined” makes clear.`),
      entry(`While comparing two interpretations of ${topic}, ______. One interpretation was that ${lower(claim)}`,convention,
        "the editor noticed a detail in the second account",["a detail in the second account caught the editor’s attention","the second account contained a detail that caught the editor’s attention","a detail became apparent to the editor in the second account"],
        `The opening participial phrase describes whoever compared the interpretations. Placing “the editor” immediately after the comma identifies that person; a detail or an account cannot compare readings.`,"M"),
      entry(`${opening} A reader's goals were to describe the observation, to compare the proposed explanations, and ______ whether the following detail favored either one: ${detail}`,convention,
        "to determine",["determining","determined","for determining"],
        `The first two goals use infinitives: “to describe” and “to compare.” The third goal needs the same grammatical form, “to determine.”`,"M"),
    ][f];
    }
    default: throw new Error("Unmapped reading skill: "+skill);
  }
}

export function workshopReading(): Question[] {
  const random = rng(6439);
  const layered = new Set(["qualify","currency","bearing","relief","vehicle","discipline","interest","margin","capacity","exhaust","instrumental","qualified","tenable","noncommittal","conciliatory","prehistory","noninterventionist","benchmark","episodic"]);
  const direct = new Set(["fine","faint","modest","accessible","partial","omit","scarce","visible","unchanged","absent","separate","incomplete","routine","contrast","unanimous","finite","backup","retain","ample","physical","converge"]);
  const level = (term:string):Difficulty => layered.has(term) ? "H" : direct.has(term) ? "E" : "M";
  const vocabulary: Exercise[] = [
    ...wordCards.map(({word,passage,right,wrong,why}) => {
      return entry(passage,`As used in the text, what does “${word}” most nearly mean?`,right,wrong,
        `${why} In this context, “${right}” captures the meaning of “${word}.”`,level(word));
    }),
    ...completions.map(({passage,right,wrong,why})=>entry(passage,"Which choice completes the text with the most logical and precise word or phrase?",right,wrong,
      `${why} The word or phrase that fits is “${right}.”`,level(right))),
  ];
  if (vocabulary.length!==200 || cases.length!==50) throw new Error(`Expected 200 word exercises and 50 cases, got ${vocabulary.length} and ${cases.length}`);
  return skills.flatMap(({domain,skill}, skillIndex) => {
    const slots = random.shuffle(Array.from({length:200},(_,i)=>i%4));
    return slots.map((slot,j) => {
      const caseIndex = Math.floor(j/4);
      const q = skillIndex===3 ? vocabulary[j] : fromCase(caseIndex,j%4,skillIndex);
      const choices = random.shuffle(q.wrong);
      choices.splice(slot,0,q.right);
      return {id:`wr-${skillIndex+1}-${j+1}`, collection:"skill-workshop" as const, section:"rw" as const, domain, skill,
        family:skillIndex===3 ? undefined : `reading-${caseIndex+1}`, type:"mcq" as const,difficulty:q.d,
        passage:q.passage,passage2:q.passage2,table:q.table,stem:q.stem,choices,answer:LETTERS[slot],explanation:q.why};
    });
  });
}
