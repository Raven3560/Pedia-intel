(() => {
"use strict";

/* ---------- questions ---------- */
/* Each question carries parent wording (title, label) and clinician wording (ct, ch, c, cs) for the Clinician lens. */
const Q = [
  {id:"age", short:"Age", cshort:"Age band", title:"How old is your baby?", hint:"Pick the closest range.", ct:"Postnatal age band", ch:"Sets context: neonatal red flags (meconium, cholestasis, bilious vomiting) and the no-water-under-6-months rule.", opts:[
    {v:"0-2w",label:"0-2 weeks",c:"Neonate, day 0 to 14"},{v:"3-4w",label:"3-4 weeks",c:"Neonate, day 15 to 28"},{v:"1-3m",label:"1-3 months",c:"Young infant, 1 to 3 months"},{v:"4-6m",label:"4-6 months",c:"Infant, 4 to 6 months"},{v:"7-12m",label:"7-12 months",c:"Infant, 7 to 12 months (complementary feeding)"}]},
  {id:"feed", short:"Feeding", cshort:"Feeding mode", title:"How is your baby fed?", ct:"Feeding mode", ch:"Gates maternal-diet advice (breast milk) and formula-handling advice (formula or mixed).", opts:[
    {v:"breast",label:"Breast milk only",c:"Exclusive breastfeeding (EBF)"},{v:"mixed",label:"Breast milk and formula",c:"Mixed feeding: breast milk with formula supplementation"},{v:"formula",label:"Formula only",c:"Exclusive formula feeding"}]},
  {id:"cry", short:"Crying", cshort:"Crying pattern", title:"Which sounds most like your baby's crying?", ct:"Crying and irritability pattern", ch:"Separates physiological crying from fussing and the Rome IV infant colic pattern.", opts:[
    {v:"needs",label:"Only when hungry, tired or wet",c:"Crying with an identifiable cause (hunger, fatigue, wet nappy)"},{v:"often",label:"Often cries for no clear reason",c:"Frequent unexplained fussing or irritability"},{v:"long",label:"3 hours or more at a time",sub:"On many days",c:"Prolonged paroxysmal crying, 3 h or more on most days",cs:"Consistent with an infant colic pattern if under 5 months and thriving"}]},
  {id:"gas", short:"Gas", cshort:"Flatulence", title:"How does your baby seem with gas?", ct:"Flatulence and abdominal discomfort", ch:"Parent-reported; rarely pathological in isolation.", opts:[
    {v:"none",label:"No problem with gas",c:"No reported flatulence or discomfort"},{v:"lots",label:"Seems to have a lot of gas",c:"Excess flatulence without distress"},{v:"painful",label:"Seems to have painful gas",c:"Flatulence with apparent abdominal pain"}]},
  {id:"stool", short:"Stools", cshort:"Stool consistency", title:"What are your baby's stools like?", ct:"Stool consistency and frequency", ch:"Normal frequency varies widely by feeding mode; consistency matters more than count.", opts:[
    {v:"normal",label:"Normal for my baby",c:"Normal for age and feeding mode"},{v:"hard",label:"Hard and dry",sub:"Like gravel",c:"Hard, pellet-like stools",cs:"Possible functional constipation"},{v:"watery",label:"Watery and frequent",c:"Loose, increased-frequency stools",cs:"Possible acute diarrhoea; assess hydration"}]},
  {id:"colour", short:"Stool colour", cshort:"Stool colour", title:"What colour are the stools?", ct:"Stool pigmentation", ch:"Red, black and pale stools are red flags; pale stools screen for cholestasis.", opts:[
    {v:"normal",label:"Yellow, green or brown",c:"Normal pigmentation (yellow, green, brown)"},{v:"red",label:"Bright red or black",c:"Red or black stools",cs:"Possible haematochezia or melaena"},{v:"pale",label:"Pale, white, grey or clay-coloured",c:"Acholic stools (pale, white, grey, clay)",cs:"Cholestasis until proven otherwise"}]},
  {id:"spit", short:"Spit-up", cshort:"Regurgitation", title:"How much does your baby spit up?", ct:"Regurgitation and vomiting", ch:"Effortless regurgitation in a thriving infant is physiological GER.", opts:[
    {v:"rare",label:"Rarely spits up",c:"Rare regurgitation"},{v:"often",label:"Spits up often",c:"Frequent effortless regurgitation",cs:"Physiological GER pattern"},{v:"vomit",label:"Vomits more than spits up",c:"Vomiting exceeding regurgitation",cs:"Needs a differential: GERD, pyloric stenosis, obstruction, infection"}]},
  {id:"allergy", short:"Allergies", cshort:"Atopy history", title:"Is there a family history of allergies?", hint:"Parents, brothers or sisters.", ct:"Family history of atopy", ch:"First-degree relatives with food allergy, eczema, asthma or allergic rhinitis.", opts:[
    {v:"no",label:"No",c:"Negative"},{v:"yes",label:"Yes",c:"Positive in a first-degree relative"}]}
];
const QI = Object.fromEntries(Q.map((q,i)=>[q.id,i]));
const optLabel = (id,v)=> (Q[QI[id]].opts.find(o=>o.v===v)||{}).label || "";
const optClin = (id,v)=> { const o=Q[QI[id]].opts.find(o=>o.v===v)||{}; return o.c || o.label || ""; };

/* Clinician read for each answer: interpretation, what to consider, what to do, key source. */
const CLIN = {
  cry:{
    needs:{i:"Physiological crying.",a:"Anticipatory guidance only.",r:"Rome IV (Benninga 2016)"},
    often:{i:"Unexplained fussing without a defined pattern.",c:"Feeding adequacy, hunger cues, growth trajectory, overstimulation.",a:"Check weight gain and feeding history; review if pattern escalates.",r:"Rome IV (Benninga 2016)"},
    long:{i:"Fits the infant colic pattern if under 5 months, thriving, with a normal examination and no red flags.",c:"A serious underlying cause was found in about 5% of afebrile infants seen for crying, urinary tract infection the most common. Also consider hair tourniquet, otitis, fracture or abusive injury, and CMPA or GERD when other features are present.",a:"Full examination and growth plot; reassure and support parents; screen for maternal depression; give safe-sleep and never-shake advice. Simethicone has no proven benefit.",r:"Rome IV (Benninga 2016); Freedman, Pediatrics 2009; Cochrane, Biagioli 2016"}
  },
  gas:{
    none:{i:"No concern.",r:""},
    lots:{i:"Benign flatulence; common and rarely pathological alone.",c:"Air swallowing, feeding technique; CMPA if with blood in stool, eczema or vomiting.",a:"Feeding technique and burping; avoid unproven remedies.",r:"Cochrane, Biagioli 2016 (simethicone and other agents for colic)"},
    painful:{i:"Apparent abdominal pain with flatulence; overlaps with the colic pattern.",c:"Check for distension, bilious vomiting, blood in stool, fever, poor feeding.",a:"Examine the abdomen; reassure if normal and thriving; escalate on red flags.",r:"Rome IV (Benninga 2016)"}
  },
  stool:{
    normal:{i:"No concern.",r:""},
    hard:{i:"Functional constipation is likely if there are no red flags.",c:"Red flags: delayed passage of meconium (beyond 48 hours in a term baby), constipation from birth or the first weeks, ribbon stools, distension with vomiting, failure to thrive, abnormal anus or spine (Hirschsprung disease, anorectal malformation, hypothyroidism).",a:"History and examination are usually enough. In formula-fed infants check how feeds are made up. If a laxative is needed, follow the guideline (polyethylene glycol first line, lactulose if it is not available). Straining before a soft stool in a well infant under 6 months is infant dyschezia and does not need laxatives.",r:"ESPGHAN/NASPGHAN constipation guideline (Tabbers 2014); Rome IV (Benninga 2016)"},
    watery:{i:"Possible acute gastroenteritis.",c:"Dehydration grade, blood in stool (dysentery), co-existing vomiting, age under 3 months.",a:"Classify dehydration (WHO); ORS and zinc; continue breastfeeding; no anti-diarrhoeal drugs; antibiotics only when appropriate, such as bloody diarrhoea or severe cholera.",r:"WHO, Treatment of diarrhoea (2005); WHO/UNICEF zinc statement (2004)"}
  },
  colour:{
    normal:{i:"No concern.",r:""},
    red:{i:"Possible haematochezia or melaena.",c:"Swallowed maternal blood (Apt test) in neonates, anal fissure, allergic proctocolitis (CMPA), infectious colitis, NEC in preterms, volvulus or intussusception. Meconium is normal in the first days; iron makes stools dark.",a:"Examine, inspect the stool and perianal area; urgent review if unwell, distended or vomiting. Occasional blood specks alone do not establish CMPA.",r:"ESPGHAN CMPA position paper (Vandenplas 2024)"},
    pale:{i:"Acholic stools: cholestasis until proven otherwise; biliary atresia is the time-critical cause.",c:"Prolonged jaundice, dark urine, hepatomegaly.",a:"Total and conjugated bilirubin the same day; urgent hepatology or surgical referral. Kasai outcomes are best when done early.",r:"NASPGHAN/ESPGHAN cholestasis guideline (Fawaz 2017); Serinet, Pediatrics 2009"}
  },
  spit:{
    rare:{i:"No concern.",r:""},
    often:{i:"Physiological GER (happy spitter) if thriving; it usually settles within the first year.",c:"Overfeeding; GERD only if troublesome symptoms or complications.",a:"No investigations or acid suppression for visible regurgitation in a healthy infant. Step by step: avoid overfeeding by adjusting volume and frequency and support breastfeeding; thickened feeds are an option in formula-fed infants per the guideline; safe sleep on the back.",r:"NASPGHAN/ESPGHAN GER guideline (Rosen 2018)"},
    vomit:{i:"Vomiting needs a differential diagnosis.",c:"Bilious vomiting (malrotation, surgical emergency), persistent forceful vomiting in the first 2 months (pyloric stenosis), infection including UTI, CMPA, raised intracranial pressure, metabolic causes.",a:"Check weight, hydration and abdomen; bilious or bloody vomit needs urgent surgical review.",r:"NASPGHAN/ESPGHAN GER guideline (Rosen 2018)"}
  },
  allergy:{
    no:{i:"No added atopy risk reported.",r:""},
    yes:{i:"Higher risk of atopic disease.",c:"CMPA if GI symptoms (blood or mucus in stool, vomiting, diarrhoea) co-exist with eczema or respiratory symptoms.",a:"Continue breastfeeding; diagnose CMPA by elimination and reintroduction rather than IgE tests for non-IgE presentations.",r:"ESPGHAN CMPA position paper (Vandenplas 2024)"}
  }
};

/* ---------- icons ---------- */
const S = (inner, extra="") => `<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${inner}</svg>`;
const drop = (x,y,s=1)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M0-8c3 4.5 5 7.5 5 10a5 5 0 0 1-10 0c0-2.5 2-5.5 5-10z"/>`;
const bottle = `<path d="M13 5h6v3l2 3v15a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V11l2-3z"/><path d="M11 16h10"/>`;
const sw = (c)=> c.map((col,i)=>`<circle cx="${8+i*8}" cy="16" r="5" fill="${col}" stroke="var(--line)" stroke-width="1"/>`).join("");
function icon(q,v){
  switch(q){
    case "age": { const r=[3,4.5,6,7.5,9][["0-2w","3-4w","1-3m","4-6m","7-12m"].indexOf(v)]; return S(`<circle cx="16" cy="16" r="12" stroke-dasharray="2 3"/><circle cx="16" cy="16" r="${r}" fill="currentColor" stroke="none"/>`); }
    case "feed": return v==="breast"?S(drop(16,16,1.4)):v==="formula"?S(bottle):S(drop(10,17,1)+`<g transform="translate(6 0) scale(.8)">${bottle}</g>`);
    case "cry": { const n={needs:1,often:2,long:3}[v]; let a=`<circle cx="9" cy="16" r="3" fill="currentColor" stroke="none"/>`; for(let i=1;i<=n;i++) a+=`<path d="M${12+i*4} ${16-3-i*2.5}a${4+i*3} ${4+i*3} 0 0 1 0 ${6+i*5}"/>`; return S(a); }
    case "gas": return v==="none"?S(`<path d="M5 18c3-4 6-4 9 0s6 4 9 0 4-2 4-2"/>`):S(`<circle cx="11" cy="20" r="5"/><circle cx="20" cy="12" r="3.5"/><circle cx="22" cy="22" r="2.5"/>`+(v==="painful"?`<path d="M24 4l-2 4h3l-2 4" stroke-width="1.8"/>`:""));
    case "stool": return v==="normal"?S(`<ellipse cx="16" cy="17" rx="10" ry="6"/>`):v==="hard"?S(`<path d="M6 20l3-4 4 1 1 4-4 2z"/><path d="M15 13l4-3 3 2-1 4-4 0z"/><path d="M18 22l4-2 3 3-3 3-3-1z"/>`):S(drop(10,15,.8)+drop(18,12,.8)+drop(22,22,.8));
    case "colour": return S(v==="normal"?sw(["#E2B33C","#7FA04A","#8A5A2B"]):v==="pale"?sw(["#EFE8D8","#B9BCB8","#D9CDB4"]):sw(["#C62828","#7B1F1F","#1E1E1E"]));
    case "spit": { if(v==="rare") return S(`<path d="M8 24c2-8 8-12 16-12"/>`+drop(24,10,.5)); if(v==="often") return S(`<path d="M8 24c2-8 8-12 16-12"/>`+drop(22,9,.55)+drop(26,15,.45)); return S(`<path d="M16 26V12"/><path d="M11 16l5-5 5 5"/>`+drop(9,9,.6)+drop(23,8,.6)+drop(26,17,.5)); }
    case "allergy": return S(`<circle cx="11" cy="11" r="3.5"/><circle cx="21" cy="11" r="3.5"/><path d="M5 25c0-4 3-7 6-7s6 3 6 7"/><path d="M15 25c0-4 3-7 6-7s6 3 6 7"/>`+(v==="yes"?`<path d="M27 3v5M24.5 5.5h5" stroke-width="1.8"/>`:""));
  }
  return "";
}
const ICO = {
  check:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>`,
  chev:`<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`,
  alert:`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/></svg>`
};

/* ---------- content modules ---------- */
const LV = {calm:0,watch:1,doctor:2,urgent:3};
const LV_LABEL = {calm:"Reassuring",watch:"Keep an eye on it",doctor:"Talk to your doctor",urgent:"Call your doctor"};
const NORMAL = `Babies can have bouts of crying, fussiness and spit-up from time to time.`;
const UNSURE = `If you are unsure about your baby's behaviour, or have not been able to soothe them despite your best efforts, ask your baby's doctor for advice.`;
const FORMULA_SWITCH = `<div class="aside"><b>Thinking of switching formula?</b>Talk to your baby's doctor before you decide. If your doctor says it is fine, they will also suggest a way to make the change smoothly, for example mixing the two formulas together little by little before stopping the original one. If you are also breastfeeding, keep breastfeeding; your doctor or a lactation counsellor can help.</div>`;

function gasBlock(painful, feed){
  const bottleTip = feed!=="breast" ? `<li>If you bottle-feed, try a different bottle or teat that may let in less air. There are many types, so it may take some trial and error.</li>` : "";
  const dietTip = feed!=="formula" ? `<li>Occasionally, what you eat can affect your baby. Gas-producing vegetables (such as onion and broccoli), spicy seasonings and citrus fruits can cause tummy troubles in some babies. Ask your baby's doctor for feeding advice; they may suggest removing one food at a time and watching for changes in your baby.</li>` : "";
  return `<p>You might be able to ease their gas ${painful?"pain":"discomfort"} by:</p>
  <ul><li>Massaging their tummy.</li><li>Holding them along your arm, face down, using your hand to apply gentle pressure on their tummy.</li><li>Bouncing them gently with a regular rhythm, as if they were on a car ride or in a bouncy seat.</li></ul>
  <p>Do not give any medicine, gripe water, janam ghutti or honey unless your baby's doctor advises it.</p>
  <h4>To help manage gas</h4>
  <ul><li>Crying makes babies swallow air, so try to feed your baby before hunger makes them cry.</li>
  <li>Burp your baby often during feeds so they do not swallow too much air. If they do not burp after a few minutes, change their position and try for a few minutes more.</li>${bottleTip}${dietTip}</ul>
  <p>If you have tried these steps and are still worried about your baby's gas, discuss it with your baby's doctor.</p>${feed!=="breast"?FORMULA_SWITCH:""}`;
}

function buildBlocks(a){
  const B = [];
  const add = (o)=>B.push(o);
  // M1 crying
  if(a.cry==="needs") add({q:"cry",code:"M1",topic:"Crying",level:"calm",said:"Your baby cries only when hungry, tired or wet.",
    html:`<p>Your baby is showing normal behaviour. ${NORMAL} If you are unsure about your baby's behaviour, please contact your baby's doctor.</p>`});
  if(a.cry==="often") add({q:"cry",code:"M1",topic:"Crying",level:"watch",said:"Your baby often cries for no clear reason.",
    html:`<p>Crying is your baby's main way of telling you about a need or some discomfort. Some babies have fussy spells without a clear cause.</p><p>Check the basics first: hunger, a wet nappy, tiredness or wanting to be held. ${UNSURE}</p>`});
  if(a.cry==="long") add({q:"cry",code:"M1 colic",topic:"Crying",level:"doctor",said:"Your baby cries for 3 hours or more at a time, on many days.",
    html:`<p>Long periods of crying or fussing that start and stop without an obvious cause, in a baby under 5 months who is otherwise healthy and growing well, are often described as <b>colic</b>.</p><p>Colic usually settles with time, but crying this long should be checked by your baby's doctor. They can rule out other causes and help you find ways to cope.</p><p>Looking after a baby who cries a lot is tiring. If you feel overwhelmed, put your baby down safely on their back and ask someone you trust for help. <b>Never shake a baby.</b></p>`});
  // M2 gas
  if(a.gas==="none") add({q:"gas",code:"M2 base",topic:"Gas",level:"calm",said:"Your baby does not seem to have a particular problem with gas.",
    html:`<p>Your baby is showing normal behaviour. ${NORMAL} ${UNSURE}</p>`});
  if(a.gas==="lots") add({q:"gas",code:"M2",topic:"Gas",level:"watch",said:"Your baby passes more gas than you think is normal.",html:gasBlock(false,a.feed)});
  if(a.gas==="painful") add({q:"gas",code:"M2 painful",topic:"Gas",level:"watch",said:"Your baby seems to have painful gas.",html:gasBlock(true,a.feed)});
  // M3 stools
  if(a.stool==="normal") add({q:"stool",code:"M3 base",topic:"Stools",level:"calm",said:"Your baby's stools are normal.",
    html:`<p>Your baby is showing normal signs. ${NORMAL} If you are unsure about your baby's stools or behaviour, or have not been able to soothe them despite your best efforts, ask your baby's doctor for advice.</p>`});
  if(a.stool==="hard") add({q:"stool",code:"M3a",topic:"Stools",level:"doctor",said:"Your baby's stools are hard and dry, like gravel.",
    html:`<p>Hard and dry stools mean your baby is constipated. Check with your baby's doctor. ${a.age==="7-12m"?"They might recommend adding a little extra water to your baby's diet.":"Do not give water or other drinks to a baby under 6 months unless your baby's doctor advises it."}</p><p>Do not give your baby over-the-counter stool softeners unless your baby's doctor advises you to.</p>`});
  if(a.stool==="watery") add({q:"stool",code:"M3b",topic:"Stools",level:a.spit==="vomit"?"urgent":"doctor",said:"Your baby's stools are watery and frequent.",
    html:`<p>If your baby's stools become looser and more frequent than is normal for them, talk to your baby's doctor. It might be a sign of an infection, or that your baby is not able to absorb the nutrients in their food.</p>
    <h4>Talk to your baby's doctor if you notice any of these</h4>
    <ul class="watch"><li>Blood or mucus in stools</li><li>Fever</li><li>Vomiting</li><li>Irritability</li><li>Refusal to eat</li><li>Fewer or dark-coloured wet nappies</li><li>Less active than usual</li></ul>
    ${a.spit==="vomit"?"<p><b>Watery stools together with vomiting can quickly lead to dehydration in babies. Call your baby's doctor today.</b></p>":""}<p>Keep breastfeeding or feeding as usual unless your doctor says otherwise. Do not give your baby anti-diarrhoea medicine unless your baby's doctor advises it.</p>
    <p>To keep your baby hydrated, your baby's doctor might recommend an oral rehydration solution (ORS) to replace the fluids and salts lost through diarrhoea and vomiting. Talk to your baby's doctor about any concerns.</p>${a.feed!=="breast"?FORMULA_SWITCH:""}`});
  // M4 colour
  if(a.colour==="normal") add({q:"colour",code:"M4 base",topic:"Stool colour",level:"calm",said:"Your baby's stools are yellow, green or brown.",
    html:`<p>The colour of your baby's stools is normal. If you are unsure about your baby's behaviour, please contact your baby's doctor.</p>`});
  if(a.colour==="red") add({q:"colour",code:"M4",topic:"Stool colour",level:"urgent",said:"Your baby's stools are bright red or black.",
    html:`<p><b>Bright red or black stools are not normal.</b> These colours could point to a condition that needs further checking. Call your baby's doctor.</p>${a.age==="0-2w"?"<p>In the first 2 to 3 days after birth, sticky dark green-black stools (meconium) are normal. If black stools continue after that, or you see red, call your baby's doctor.</p>":""}`});
  if(a.colour==="pale") add({q:"colour",code:"M4 pale",topic:"Stool colour",level:"urgent",said:"Your baby's stools are pale, white, grey or clay-coloured.",
    html:`<p><b>Pale, white, grey or clay-coloured stools are not normal.</b> They can be a sign of a liver problem that needs to be checked quickly. Call your baby's doctor today, and take a photo of the nappy to show them.</p>`});
  // M5 spit-up
  if(a.spit==="rare") add({q:"spit",code:"M5 base",topic:"Spit-up",level:"calm",said:"Your baby rarely spits up.",
    html:`<p>Your baby is showing normal behaviour. ${NORMAL} ${UNSURE}</p>`});
  if(a.spit==="often") add({q:"spit",code:"M5a",topic:"Spit-up",level:"watch",said:"Your baby spits up often.",
    html:`<p>Small spit-ups after feeds are common, because a baby's digestive system is still maturing. This is called gastro-oesophageal reflux (GER). It is usually not a worry when your baby is feeding well, gaining weight and seems comfortable, and it often gets better as your baby grows.</p>
    <ul><li>Burp your baby during and after feeds.</li><li>Keep your baby upright for a while after feeding.</li></ul>
    <p>Always put your baby to sleep on their back, on a firm, flat surface, even if they spit up. Talk to your baby's doctor before changing how or what your baby is fed.</p>`});
  if(a.spit==="vomit") add({q:"spit",code:"M5b",topic:"Spit-up",level:"urgent",said:"Your baby vomits more than they spit up.",
    html:`<p><b>Vomiting is different from normal spit-up and needs to be checked by your baby's doctor.</b> Sometimes it can be a sign of gastro-oesophageal reflux disease (GERD) or another condition.</p>
    <div class="aside"><b>Get emergency help now (call 108 or 112, or go to the nearest hospital) if</b>the vomit is green, contains blood, the vomiting is forceful and shoots out (projectile), or your baby is very drowsy or hard to wake.</div>
    <h4>Tell your doctor soon if you notice</h4>
    <ul class="watch"><li>Refusing feeds or poor feeding</li><li>Not gaining weight</li><li>Arching the back or crying during feeds</li><li>Fewer wet nappies</li></ul>`});
  // M6 allergy
  if(a.allergy==="no") add({q:"allergy",code:"M6 base",topic:"Allergies",level:"calm",said:"There is no family history of allergies.",
    html:`<p>Your baby is showing normal behaviour. ${NORMAL} ${UNSURE}</p>`});
  if(a.allergy==="yes") add({q:"allergy",code:"M6",topic:"Allergies",level:"watch",said:"There is a family history of allergies.",
    html:`<p>A family history of allergies can make a baby more likely to have one too. Watch for these signs and tell your baby's doctor if you notice any of them:</p>
    <ul class="watch"><li>Rash or eczema</li><li>Blood or mucus in stools</li><li>Diarrhoea</li><li>Vomiting</li><li>Wheezing or a runny nose</li></ul>
    <p>Do not change your baby's feeding without your doctor's advice. If an allergy is suspected, your doctor will guide you on the right feeding plan.</p><p><b>Get emergency help (108 or 112) if your baby's face, lips or tongue swell, or they have trouble breathing.</b></p>`});
  return B;
}
const TOPIC_ICON = {cry:"cry",gas:"gas",stool:"stool",colour:"colour",spit:"spit",allergy:"allergy"};
const TOPIC_VAL = (b,a)=>a[b.q];

/* ---------- state ---------- */
let ans = {}, step = 0, view = "q", lens = false;
const $ = (s,r=document)=>r.querySelector(s);
const rail = $("#rail"), beads = $("#beads"), say = $("#say"), legend = $("#legend");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- progress beads ---------- */
function renderBeads(){
  beads.innerHTML = Q.map((q,i)=>{
    const done = !!ans[q.id], cur = view==="q" && i===step;
    const can = done || i===firstOpen();
    return `<button class="bead ${done?"done":""} ${cur?"cur":""}" type="button" data-i="${i}" ${can?"":"disabled"} aria-label="Question ${i+1}: ${q.short}${done?", answered":""}" ${cur?'aria-current="step"':""}><i></i></button>`;
  }).join("");
  beads.querySelectorAll(".bead").forEach(b=>b.onclick=()=>{ if(!b.disabled) go(+b.dataset.i); });
}
const firstOpen = ()=>{ const i=Q.findIndex(q=>!ans[q.id]); return i<0?Q.length:i; };

/* ---------- question view ---------- */
function go(i, dir){
  view="q"; const d = dir ?? (i>=step?1:-1); step=i;
  const q=Q[i];
  const intro = Object.keys(ans).length===0 && i===0 ? `<div class="intro"><h1>What is your baby's <em>tummy</em> telling you?</h1><p>Answer 8 quick questions about crying, gas, stools and spit-up. Watch the tummy respond as you go, then get simple next steps to discuss with your baby's doctor.</p></div>` : "";
  const L = (o)=> lens ? o.c : o.label, LS = (o)=> lens ? o.cs : o.sub;
  const trail = Object.keys(ans).length ? `<div class="trail" aria-label="Your answers">${Q.filter(x=>ans[x.id]).map(x=>`<button type="button" data-j="${QI[x.id]}">${lens?x.cshort:x.short}: <b>${lens?optClin(x.id,ans[x.id]):optLabel(x.id,ans[x.id])}</b></button>`).join("")}</div>` : "";
  const introC = Object.keys(ans).length===0 && i===0 && lens ? `<div class="intro"><h1>Clinical <em>intake</em> view</h1><p>The same 8 items in clinical terms. Each answer shows how it maps to the parent-facing module, and the report adds an interpretation, differentials and the source behind every message.</p></div>` : "";
  rail.innerHTML = `${lens?introC:intro}
  <div class="qcard ${lens?"clin":""}" data-dir="${d>0?"f":"b"}">
    <p class="eyebrow"><span>${lens?"Item":"Question"} ${i+1} of 8</span><span class="dot"></span><span>${lens?q.cshort:q.short}</span>${lens?`<span class="lens-tag">Clinician lens</span>`:""}</p>
    <h2 id="qh" tabindex="-1">${lens?q.ct:q.title}</h2>${(lens?q.ch:q.hint)?`<p class="qhint">${lens?q.ch:q.hint}</p>`:""}
    <div class="opts ${q.opts.length===2?"cols2":""}" role="group" aria-labelledby="qh">
      ${q.opts.map(o=>`<button class="opt" type="button" id="opt-${q.id}-${o.v}" data-v="${o.v}" aria-pressed="${ans[q.id]===o.v}"><span class="opt-ico">${icon(q.id,o.v)}</span><span class="opt-txt"><b>${L(o)}</b>${LS(o)?`<small>${LS(o)}</small>`:""}${lens?`<small class="pw">Parent sees: "${o.label}"</small>`:""}</span><span class="opt-check">${ICO.check}</span></button>`).join("")}
    </div>
    <div class="qnav"><button class="btn ghost" type="button" id="back" ${i===0?"disabled":""}>Back</button><button class="btn primary" type="button" id="next" ${ans[q.id]?"":"disabled"}>${i===Q.length-1?"See the tummy report":"Next"}</button></div>
  </div>${trail}`;
  rail.querySelectorAll(".opt").forEach(b=>{
    b.onclick=()=>choose(q, b.dataset.v);
    if(!reduce){
      b.onpointermove=e=>{ const r=b.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5; b.style.setProperty("--ry",(x*6)+"deg"); b.style.setProperty("--rx",(-y*8)+"deg"); };
      b.onpointerleave=()=>{ b.style.setProperty("--ry","0deg"); b.style.setProperty("--rx","0deg"); };
    }
  });
  $("#back").onclick=()=>go(i-1,-1);
  $("#next").onclick=()=> i===Q.length-1 ? showReport() : go(i+1,1);
  rail.querySelectorAll(".trail button").forEach(b=>b.onclick=()=>go(+b.dataset.j));
  renderBeads();
  if(Object.keys(ans).length) $("#qh").focus({preventScroll:true});
  scene && scene.focus(q.id);
}
let advanceTimer=0;
function choose(q, v){
  ans[q.id]=v;
  rail.querySelectorAll(".opt").forEach(b=>b.setAttribute("aria-pressed", b.dataset.v===v));
  $("#next").disabled=false;
  react(q.id);
  renderBeads(); renderLens();
  clearTimeout(advanceTimer);
  advanceTimer = setTimeout(()=>{ if(view!=="q"||Q[step].id!==q.id) return; const n=firstOpen(); if(n>=Q.length) showReport(); else go(n,1); }, reduce?250:900);
}

/* ---------- stage reactions ---------- */
const SAY = {
  age:{"0-2w":"A brand-new tummy. Size follows age.","3-4w":"A tiny tummy, settling in.","1-3m":"Growing tummy, busy gut.","4-6m":"A bigger tummy, steadier rhythms.","7-12m":"Nearly a toddler tummy."},
  feed:{breast:"Milk travels down to the stomach.",mixed:"Milk travels down to the stomach.",formula:"Milk travels down to the stomach."},
  cry:{needs:"An occasional cry with a reason.",often:"Restless arms and legs, more frequent cries: fussy spells.",long:"Tense, restless and crying for long spells."},
  gas:{none:"Calm inside. No gas bubbles in the gut.",lots:"Gas bubbles drift through the gut and the tummy swells a little.",painful:"Bubbles crowd and jitter, the tummy is tight and baby is unsettled."},
  stool:{normal:"Soft stool glides through the colon.",hard:"Hard pebbles crawl through the colon.",watery:"Watery stool rushes through the colon."},
  colour:{normal:"A normal stool colour in the colon.",red:"The stool turns red or dark: this needs a doctor.",pale:"The stool turns pale: this needs a doctor."},
  spit:{rare:"Milk stays down.",often:"Small spit-ups come back after feeds.",vomit:"Bigger bursts come up: vomiting."},
  allergy:{no:"Clear skin.",yes:"Red patches on the skin: allergy signs to watch."}
};
const LEGEND = {
  age:()=>({sw:"var(--ink-2)",t:"Size = age"}),
  feed:()=>({sw:"#f4ead8",t:"Milk to stomach = feeding"}),
  cry:v=>({sw:{needs:"var(--calm)",often:"var(--watch)",long:"var(--doctor)"}[v],t:"Rings and restless limbs = crying"}),
  gas:v=>v==="none"?null:({sw:"radial-gradient(circle at 30% 30%,#fff,#9fd8ff 50%,#f5b3ff)",t:"Pearls in the gut = gas"}),
  stool:v=>({sw:{normal:"#d9a441",hard:"#8a5a2b",watery:"#c9b26a"}[v],t:{normal:"Soft beads in the colon = normal stools",hard:"Pebbles in the colon = hard stools",watery:"Fast droplets = watery stools"}[v]}),
  colour:v=>({sw:v==="normal"?"#e0a23e":"var(--urgent)",t:"Colon colour = stool colour"}),
  spit:v=>v==="rare"?null:({sw:v==="vomit"?"#e9c46a":"#fbf6ea",t:v==="vomit"?"Bursts from the mouth = vomiting":"Drops from the mouth = spit-up"}),
  allergy:v=>v==="yes"?({sw:"#e04a64",t:"Skin patches = allergy watch-list"}):null
};
function renderLegend(){
  legend.innerHTML = Q.map(q=>{ if(!ans[q.id]) return ""; const L=LEGEND[q.id](ans[q.id]); return L?`<span class="chip"><span class="sw" style="background:${L.sw}"></span>${L.t}</span>`:""; }).join("");
}
let toastShown=false;
function react(id){
  say.textContent = SAY[id][ans[id]];
  renderLegend();
  renderFlag();
  if(scene){ scene.apply(ans, id); }
}
function renderFlag(){
  const slot=$("#flagSlot");
  if(ans.colour==="red"||ans.colour==="pale") slot.innerHTML = `<div class="flag" role="alert">${ICO.alert}<div><b>Call your baby's doctor</b><p>${ans.colour==="pale"?"Pale, white, grey or clay-coloured":"Bright red or black"} stools are not normal and need to be checked.</p></div></div>`;
  else if(ans.spit==="vomit") slot.innerHTML = `<div class="flag" role="alert">${ICO.alert}<div><b>Vomiting needs a doctor's check</b><p>Vomiting more than spitting up is different from normal spit-up.</p></div></div>`;
  else slot.innerHTML="";
}
function toast(msg){
  const s=$("#toastSlot"); s.innerHTML=`<div class="toast" role="status">${msg}</div>`;
  clearTimeout(toast.t); toast.t=setTimeout(()=>s.innerHTML="",4200);
}

/* ---------- report ---------- */
function showReport(quiet){
  view="report"; renderBeads();
  const blocks = buildBlocks(ans);
  const max = blocks.reduce((m,b)=>Math.max(m,LV[b.level]),0);
  const head = [
    ["Nothing you described stands out as a worry.","From your answers, your baby's tummy sounds settled. Keep watching, and talk to your doctor whenever something worries you."],
    ["Mostly settled, with a few things to watch.","Some answers point to common tummy niggles. The tips below may help."],
    ["Worth a conversation with your paediatrician.","Some answers are best checked by your baby's doctor. Take the summary at the bottom with you."],
    ["Please call your baby's doctor.","One or more answers can be a sign of something that needs checking soon. The details are below."]
  ][max];
  if(lens) Object.assign(head, [
    ["No red flags reported on this intake.","Answers suggest physiological patterns; confirm with history, examination and growth."],
    ["Common, usually self-limiting patterns.","Review feeding technique and growth; the parent receives practical tips and watch-lists."],
    ["Needs clinical review.","At least one finding warrants assessment: see the interpretation and actions below."],
    ["Red flags: prompt assessment.","At least one finding needs prompt evaluation. The parent has been told to call the doctor and given emergency signs."]
  ][max]);
  const order = ["cry","gas","stool","colour","spit","allergy"];
  const sorted = [...blocks].sort((x,y)=> LV[y.level]-LV[x.level] || order.indexOf(x.q)-order.indexOf(y.q));
  const urgent = blocks.filter(b=>b.level==="urgent");
  rail.innerHTML = `<div class="report">
    <div class="sum lv-${Object.keys(LV)[max]}">
      <p class="eyebrow">Tummy report · ${optLabel("age",ans.age)} · ${optLabel("feed",ans.feed)}</p>
      <h2>${head[0]}</h2><p>${head[1]}</p>
      <div class="signal" aria-label="Signal by topic">${order.map((k,i)=>{const b=blocks.find(x=>x.q===k);return `<div class="sig lv-${b.level}"><i style="animation-delay:${i*90}ms"></i><span>${Q[QI[k]].short}</span></div>`}).join("")}</div>
      <div class="keyrow">${Object.keys(LV).map(l=>`<span class="lv-${l}"><i></i>${LV_LABEL[l]}</span>`).join("")}</div>
    </div>
    ${urgent.length?`<div class="urgentbox" role="alert">${ICO.alert}<div><b>Call your baby's doctor</b><p>${urgent.map(u=>u.said).join(" ")} This needs to be checked. If your baby seems very unwell, go to the nearest hospital.</p></div></div>`:""}
    ${lens?`<div class="clinsum"><h3>Clinical intake</h3><dl>${Q.map(x=>`<div><dt>${x.cshort}</dt><dd>${optClin(x.id,ans[x.id])}</dd></div>`).join("")}</dl></div>`:""}
    ${sorted.map((b,i)=>{ const cr=(CLIN[b.q]||{})[ans[b.q]]||{}; return `<details class="rcard lv-${b.level}" ${LV[b.level]>0||i<1?"open":""}>
      <summary><span class="rc-topic"><span class="ic">${icon(TOPIC_ICON[b.q],TOPIC_VAL(b,ans))}</span>${lens?Q[QI[b.q]].cshort:b.topic}</span><span class="pill">${LV_LABEL[b.level]}</span><span class="rc-said">${lens?`Finding: ${optClin(b.q,ans[b.q])}`:`You said: ${b.said.replace(/^Your baby/,"your baby").replace(/^There is/,"there is")}`}</span><span class="rc-meta">Module ${b.code}</span></summary>
      <div class="rc-body">${lens?`<div class="cread"><div><b>Interpretation</b><p>${cr.i||""}</p></div>${cr.c?`<div><b>Consider</b><p>${cr.c}</p></div>`:""}${cr.a?`<div><b>Act</b><p>${cr.a}</p></div>`:""}${cr.r?`<div class="src"><b>Source</b><p>${refsHTML(cr.r)}</p></div>`:""}</div><p class="pwhead">What the parent reads</p><div class="pwbody">${b.html}</div>`:b.html}</div></details>`}).join("")}
    <div class="urgentbox" style="background:var(--bg-2);border-color:var(--line)">${ICO.alert}<div><b>Get help now, whatever your answers</b><p>Call 108 or 112, or go to the nearest hospital, if your baby has trouble breathing or turns blue; is very drowsy or hard to wake; is under 3 months old and has a fever of 38°C or more; has green vomit or blood in the vomit; or has far fewer wet nappies than usual, a dry mouth or a sunken soft spot on the head.</p></div></div>
    <div class="note"><h3>Take this to your baby's doctor</h3><p class="small" style="margin:4px 0 0">A short summary of your answers. Copy it into a message or show it on your phone at the visit.</p><pre id="noteTxt">${noteText(blocks)}</pre>
      <div class="row"><button class="btn primary" type="button" id="copy">Copy summary</button><button class="btn" type="button" id="again">Start again</button><span class="small" id="copyMsg" role="status"></span></div></div>
    <div class="trail" aria-label="Change an answer">${Q.map((x,j)=>`<button type="button" data-j="${j}">${x.short}: <b>${optLabel(x.id,ans[x.id])}</b></button>`).join("")}</div>
  </div>`;
  $("#copy").onclick=async()=>{ const t=$("#noteTxt").textContent; try{ await navigator.clipboard.writeText(t); $("#copyMsg").textContent="Copied"; }catch(e){ const r=document.createRange(); r.selectNodeContents($("#noteTxt")); const s=getSelection(); s.removeAllRanges(); s.addRange(r); $("#copyMsg").textContent="Selected. Press Ctrl+C or Copy to copy."; } };
  $("#again").onclick=()=>{ restartCheck(); window.scrollTo({top:0,behavior:reduce?"auto":"smooth"}); };
  rail.querySelectorAll(".trail button").forEach(b=>b.onclick=()=>go(+b.dataset.j));
  if(scene && !quiet) scene.result(max);
  say.textContent = ["All calm, outside and in.","A few things stirring.","Some things worth a doctor's look.","Something here needs a doctor."][max];
  renderLens();
  if(!quiet && matchMedia("(max-width:960px)").matches) rail.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
}
function noteText(blocks){
  const L=[ "AI Driven Nutrition - summary for my baby's doctor", "" ];
  Q.forEach(q=>L.push(`${q.short}: ${optLabel(q.id,ans[q.id])}`));
  const f=blocks.filter(b=>LV[b.level]>=1);
  L.push("");
  L.push(f.length? "To discuss:" : "Nothing flagged. Everything described fits normal baby behaviour.");
  f.sort((x,y)=>LV[y.level]-LV[x.level]).forEach(b=>L.push(`- ${b.topic}: ${b.said} (${LV_LABEL[b.level]})`));
  return L.join("\n").replace(/&/g,"&amp;").replace(/</g,"&lt;");
}

/* ---------- clinician lens ---------- */
const MODS = [
  {id:"CTX",label:"Age context",from:[0],on:a=>!!a.age},
  {id:"FX",label:"Feeding-gated tips",from:[1],on:a=>!!a.feed && (a.gas&&a.gas!=="none"||a.stool==="watery")},
  {id:"M1",label:"Crying and colic",from:[2],on:a=>!!a.cry, hot:a=>a.cry==="long"},
  {id:"M2",label:"Gas causes and relief",from:[3],on:a=>a.gas==="lots"||a.gas==="painful"},
  {id:"M3a",label:"Constipation",from:[4],on:a=>a.stool==="hard"},
  {id:"M3b",label:"Diarrhoea",from:[4],on:a=>a.stool==="watery"},
  {id:"M4",label:"Red-flag stool colour",from:[5],on:a=>a.colour==="red"||a.colour==="pale",hot:a=>a.colour==="red"||a.colour==="pale"},
  {id:"M5a",label:"Spit-up and GER",from:[6],on:a=>a.spit==="often"},
  {id:"M5b",label:"Vomiting and GERD",from:[6],on:a=>a.spit==="vomit",hot:a=>a.spit==="vomit"},
  {id:"M6",label:"Food allergy watch-list",from:[7],on:a=>a.allergy==="yes"}
];
function renderMap(){
  const W=560, rowQ=44, H=8*rowQ+8, rowM=(H-8)/MODS.length;
  const qy=i=>8+i*rowQ, my=j=>8+j*rowM;
  let edges="", nodes="";
  MODS.forEach((m,j)=>m.from.forEach(i=>{
    const on=m.on(ans), hot=m.hot&&m.hot(ans);
    const y1=qy(i)+15, y2=my(j)+14;
    edges+=`<path class="edge ${on?"on":""} ${hot?"hot":""}" d="M196 ${y1} C 290 ${y1}, 290 ${y2}, 372 ${y2}"/>`;
  }));
  Q.forEach((q,i)=>{ const on=!!ans[q.id]; nodes+=`<g class="node ${on?"on":""}"><rect x="6" y="${qy(i)}" width="190" height="30" rx="9"/><text class="cd" x="16" y="${qy(i)+19}">Q${i+1}</text><text x="44" y="${qy(i)+19}">${q.short}${on?": "+trunc(optLabel(q.id,ans[q.id]),16):""}</text></g>`; });
  MODS.forEach((m,j)=>{ const on=m.on(ans), hot=m.hot&&m.hot(ans); nodes+=`<g class="node ${on?"on":""} ${hot?"hot":""}"><rect x="372" y="${my(j)}" width="182" height="28" rx="9"/><text class="cd" x="382" y="${my(j)+18}">${m.id}</text><text x="418" y="${my(j)+18}">${m.label}</text></g>`; });
  $("#map").innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Logic map from 8 questions to content modules, with this path's modules highlighted">${edges}${nodes}</svg>`;
}
const trunc=(s,n)=>s.length>n?s.slice(0,n-1)+"…":s;
function renderPath(){
  const done = Q.every(q=>ans[q.id]);
  let idx=0; Q.forEach(q=>{ idx = idx*q.opts.length + Math.max(0,q.opts.findIndex(o=>o.v===ans[q.id])); });
  const total = Q.reduce((p,q)=>p*q.opts.length,1);
  const fired = MODS.filter(m=>m.id.startsWith("M")&&m.on(ans)).map(m=>m.id);
  const blocks = buildBlocks(ans);
  $("#pathPanel").innerHTML = `<h3>This path</h3>
    <div class="big">${done?`#${(idx+1).toLocaleString("en-IN")}`:"In progress"} <span class="small" style="font-family:var(--f-body);font-weight:500">of ${total.toLocaleString("en-IN")} possible paths</span></div>
    <div class="pathcode">${Q.map((q,i)=>{const k=q.opts.findIndex(o=>o.v===ans[q.id]);return `<div>Q${i+1}<b>${k<0?"-":k+1}</b></div>`}).join("")}</div>
    <p class="small" style="margin:8px 0 0">Specialist modules fired: <b>${fired.length?fired.join(", "):"none (reassurance cluster)"}</b>.</p>
    <p class="small" style="margin:6px 0 0">Age (Q1) sets context only. Feeding type (Q2) now gates two blocks: maternal diet tips for breast-fed babies and formula switching guidance for formula-fed babies.</p>`;
}
const PRESETS = [
  {n:"Settled baby",c:"reassurance cluster",a:{age:"1-3m",feed:"mixed",cry:"needs",gas:"none",stool:"normal",colour:"normal",spit:"rare",allergy:"no"}},
  {n:"Gas with hard stools",c:"M2 + M3a",a:{age:"1-3m",feed:"mixed",cry:"needs",gas:"lots",stool:"hard",colour:"normal",spit:"rare",allergy:"no"}},
  {n:"Red-flag stool colour",c:"M4",a:{age:"1-3m",feed:"mixed",cry:"needs",gas:"none",stool:"normal",colour:"red",spit:"rare",allergy:"no"}},
  {n:"Colic pattern, allergy history",c:"M1 + M2 + M5a + M6",a:{age:"3-4w",feed:"breast",cry:"long",gas:"painful",stool:"normal",colour:"normal",spit:"often",allergy:"yes"}},
  {n:"Vomiting with watery stools",c:"M3b + M5b",a:{age:"4-6m",feed:"formula",cry:"often",gas:"none",stool:"watery",colour:"normal",spit:"vomit",allergy:"no"}}
];
function renderPresets(){
  $("#presets").innerHTML = PRESETS.map((p,i)=>`<button type="button" data-i="${i}">${p.n}<small>${p.c}</small></button>`).join("");
  $("#presets").querySelectorAll("button").forEach(b=>b.onclick=()=>{
    ans={...PRESETS[+b.dataset.i].a};
    if(scene) scene.apply(ans,"all");
    renderLegend(); renderFlag();
    showReport();
    $("#stage").scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
  });
}
function renderLens(){ renderMap(); renderPath(); }
function restartCheck(msg){
  ans={}; if(scene) scene.reset(); legend.innerHTML=""; $("#flagSlot").innerHTML="";
  say.textContent=msg||"Fresh start. Each answer changes what you see, outside and inside.";
  go(0,-1); renderLens();
}
function setLens(on){
  const changed = on!==lens;
  lens=on; document.body.classList.toggle("lens-on",on);
  $("#vParent").setAttribute("aria-pressed",!on); $("#vHcp").setAttribute("aria-pressed",on);
  if(changed){ restartCheck(on?"Clinician lens: starting from question 1. Each answer shows the clinical read and the modules it triggers.":"Parent view: starting from question 1."); window.scrollTo({top:0,behavior:reduce?"auto":"smooth"}); }
  else if(view==="report") showReport(true); else go(step,1);
}
$("#vParent").onclick=()=>setLens(false);
$("#vHcp").onclick=()=>setLens(true);

/* ---------- theme ---------- */
const root=document.documentElement;
function isDark(){ const t=root.getAttribute("data-theme"); return t? t==="dark" : matchMedia("(prefers-color-scheme: dark)").matches; }
function syncNight(){ $("#night").setAttribute("aria-pressed", isDark()); if(scene) scene.theme(); }
$("#night").onclick=()=>{ root.setAttribute("data-theme", isDark()?"light":"dark"); syncNight(); };
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",syncNight);
new MutationObserver(()=>{ $("#night").setAttribute("aria-pressed", isDark()); if(scene) scene.theme(); }).observe(root,{attributes:true,attributeFilter:["data-theme"]});

/* =========================================================
   Baby (BABYFRONT, home cot setting): outside view for crying, rash, size; see-inside view for milk, gas, stools
   ========================================================= */
let scene = null;
function initScene(){
  if(!window.BABYFRONT || !BABYFRONT.supported()) return null;
  const stage=$("#stage");
  const fail = ()=>{ stage.classList.add("no-gl"); };
  const E = BABYFRONT.create($("#gl3"), { variant:"term", engine:"cot", devices:false, age:"newborn", view:"outside", padTop: matchMedia("(max-width:520px)").matches ? 120 : 64, theme:isDark()?"night":"day", onReady(){ stage.classList.add("ready"); }, onFail: fail, onLost: fail });
  const VIEW_FOR = {age:"outside",feed:"inside",cry:"outside",gas:"inside",stool:"inside",colour:"inside",spit:"outside",allergy:"outside"};
  const HL = {gas:"gut",stool:"gut",colour:"gut",feed:"stomach",spit:"mouth",cry:"mouth"};
  let hlT=0, feedT=0;
  function setView(v){ E.set({view:v}); document.querySelectorAll("#viewSeg button").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.v===v))); }
  document.querySelectorAll("#viewSeg button").forEach(b=>b.onclick=()=>setView(b.dataset.v));
  function mood(a){ const lv = Object.keys(a).length ? Math.max(0,...buildBlocks(a).map(b=>LV[b.level])) : -1; stage.dataset.mood = lv; return lv; }
  function apply(a, id){
    E.set({
      scale: {"0-2w":.9,"3-4w":.95,"1-3m":1,"4-6m":1.07,"7-12m":1.14}[a.age]||1,
      cry: {needs:1,often:2,long:3}[a.cry]||0,
      stress: Math.max({needs:.05,often:.35,long:.75}[a.cry]||0, a.gas==="painful"?.35:0),
      gas: {lots:12,painful:22}[a.gas]||0, jitter: a.gas==="painful"?1:0,
      distension: {lots:.22,painful:.4}[a.gas]||0,
      stool: a.stool||"idle", colour: a.colour||"normal",
      spit: {rare:0,often:1,vomit:2}[a.spit]||0, spitCol: a.spit==="vomit"?"vomit":"milk",
      rash: a.allergy==="yes"?.85:0
    });
    if(id==="feed"||id==="all"){ E.set({feeding:true, fill:.75}); clearTimeout(feedT); feedT=setTimeout(()=>E.set({feeding:false, fill:.55}),5200); }
    if(id && id!=="all"){ if(VIEW_FOR[id]) setView(VIEW_FOR[id]); E.highlight(HL[id]||null); clearTimeout(hlT); hlT=setTimeout(()=>E.highlight(null),2600); }
    const lv = mood(a); if(lv===3) E.flash("bad");
  }
  return {
    apply, setView,
    focus(){},
    real(on){ if(E.real) E.real(on); stage.classList.toggle("real",!!on); },
    result(max){ E.flash(max>=3?"bad":max>=1?"warn":"ok"); },
    reset(){ E.set({cry:0,stress:0,gas:0,jitter:0,distension:0,stool:"idle",colour:"normal",spit:0,rash:0,scale:1,feeding:false,fill:.35}); setView("outside"); mood({}); },
    theme(){}
  };
}
try { scene = initScene(); } catch(e){ console.warn("Baby view unavailable", e); scene=null; }
if(!scene) $("#stage").classList.add("no-gl");

/* =========================================================
   Case lab: published case files, case sheet with bedside monitor and live illustrated baby, discharge summary, nutrition worksheet
   ========================================================= */
const viewCheck=$("#viewCheck"), viewLab=$("#viewLab");
let labEngine=null, labFilter="all", tab="lab";
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
/* reference links: every cited source opens the paper or guideline (DOI where one exists) */
const REFLINKS=[
  [/Benninga|Rome IV/,"https://doi.org/10.1053/j.gastro.2016.02.016"],[/Freedman/,"https://doi.org/10.1542/peds.2008-0113"],
  [/Biagioli/,"https://doi.org/10.1002/14651858.CD009999.pub2"],[/Sung V/,"https://doi.org/10.1542/peds.2017-1811"],
  [/NG143/,"https://www.nice.org.uk/guidance/ng143"],[/CG192/,"https://www.nice.org.uk/guidance/cg192"],[/CG98/,"https://www.nice.org.uk/guidance/cg98"],
  [/Barr RG/,"https://doi.org/10.1503/cmaj.081419"],[/Rosen/,"https://doi.org/10.1097/MPG.0000000000001889"],
  [/Vandenplas/,"https://doi.org/10.1097/MPG.0000000000003897"],[/Langer/,"https://doi.org/10.1016/j.suc.2016.08.011"],
  [/Fawaz/,"https://doi.org/10.1097/MPG.0000000000001334"],[/Serinet/,"https://doi.org/10.1542/peds.2008-1949"],
  [/Hsiao/,"https://doi.org/10.1002/hep.22182"],[/Mouzaki/,"https://doi.org/10.1097/MPG.0000000000002443"],
  [/Parker LA/,"https://doi.org/10.1001/jamapediatrics.2019.0800"],[/Walsh MC/,"https://doi.org/10.1016/S0031-3955(16)34975-6"],
  [/Neu J/,"https://doi.org/10.1056/NEJMra1005408"],[/Quigley/,"https://doi.org/10.1002/14651858.CD002971.pub5"],
  [/Embleton/,"https://doi.org/10.1097/MPG.0000000000003642"],[/Tabbers/,"https://doi.org/10.1097/MPG.0000000000000266"],
  [/Lu Y|Lu and Zhang/,"https://doi.org/10.21037/tp-21-9"],[/Cendal/,"https://doi.org/10.3389/fped.2021.758006"],
  [/Das SK/,"https://doi.org/10.1186/s13256-015-0611-y"],[/Nowak-W/,"https://doi.org/10.1016/j.jaci.2016.12.966"],
  [/Wedenoja/,"https://doi.org/10.1111/j.1365-2036.2009.04197.x"],
  [/Couturier/,"https://pmc.ncbi.nlm.nih.gov/articles/PMC4642905/"],[/Gelsomino/,"https://doi.org/10.1136/bcr-2021-244918"],
  [/Alvarez-Lopez/,"https://doi.org/10.7759/cureus.88600"],
  [/WHO\/UNICEF|WHO\/Unicef|zinc statement/i,"https://www.who.int/publications/i/item/WHO_FCH_CAH_04.7"],
  [/WHO/,"https://www.who.int/publications/i/item/9241593180"]
];
function refUrl(t){ for(const [re,u] of REFLINKS) if(re.test(t)) return u; return ""; }
function refHTML(t){ const u=refUrl(t); return u?`<a class="ref" href="${u}" target="_blank" rel="noopener noreferrer">${esc(t)}<span aria-hidden="true"> ↗</span><span class="sr-only"> (opens in a new tab)</span></a>`:esc(t); }
function refsHTML(s){ return String(s).split(/;\s*/).map(refHTML).join("; "); }

const store={ get(){ try{ return JSON.parse(localStorage.getItem("ttt-lab")||"{}"); }catch(e){ return {}; } }, set(v){ try{ localStorage.setItem("ttt-lab",JSON.stringify(v)); }catch(e){} } };
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const today=()=>{ const d=new Date(); return d.getDate()+" "+MON[d.getMonth()]+" "+d.getFullYear(); };
function disposeLab(){ if(labEngine){ try{ labEngine.dispose(); }catch(e){} labEngine=null; } if(heroEngine){ try{ heroEngine.dispose(); }catch(e){} heroEngine=null; } }
function setTab(t, caseId){
  tab=t; document.body.classList.toggle("tab-lab", t==="lab"); document.body.classList.toggle("tab-kol", t==="kol"); if(t!=="kol") closeKolAll();
  document.querySelectorAll("#tabs button").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.tab===t)));
  viewCheck.hidden = t!=="check"; viewLab.hidden = t!=="lab"; viewKol.hidden = t!=="kol";
  if(t==="check") disposeLab(); else if(t==="kol"){ disposeLab(); renderKol(); } else if(caseId) playCase(caseId); else renderLab();
  window.scrollTo({top:0});
}
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>setTab(b.dataset.tab));

const FILTERS=[["all","All cases"],["nicu","Neonatal unit"],["opd","Outpatient and emergency"]];
const caseMatch=(c,f)=> f==="all" || (f==="nicu"&&c.engine==="nicu") || (f==="opd"&&c.engine!=="nicu");
const bedNo=c=> "Case "+String(CASES.indexOf(c)+1).padStart(2,"0");
const audTxt=a=> a==="paed"?"Paediatrics":"Dietetics";
const ptName=c=> c.pt.name.replace(/,.*$/,"");
const yearOf=c=>{ const m=/ (\d{4});[^;]*$/.exec(c.pub.cite); return m?+m[1]:null; };
let heroEngine=null;
function renderLab(){
  disposeLab();
  const done=store.get(), nSteps=CASES.reduce((s,c)=>s+c.steps.length,0), yrs=CASES.map(yearOf).filter(Boolean);
  const cards=CASES.filter(c=>caseMatch(c,labFilter)).map(c=>{ const d=done[c.id];
    return `<article class="cc${d?" done":""}" tabindex="0" role="button" data-id="${c.id}" aria-label="Start ${bedNo(c)}: ${esc(c.title)}">
      <p class="cc-k"><span>${bedNo(c)}</span><span>${c.engine==="nicu"?"Neonatal unit":"Outpatient and emergency"}</span></p>
      <h3>${esc(c.title)}</h3>
      <p class="cc-pt">${esc(ptName(c))} · ${esc(c.pt.tag)}</p>
      <div class="cc-f"><span>${c.steps.length} decision points · ${c.min} min · ${c.level}</span><span class="cc-go">${d?`Completed ${d.score}/${d.total} · Retry`:"Start case"}<span aria-hidden="true"> →</span></span></div>
    </article>`; }).join("") || `<p class="small">No cases match this filter.</p>`;
  viewLab.innerHTML=`<div class="lab">
    <header class="lh">
      <div class="lh-t">
        <p class="lab-k">Case lab · For healthcare professionals</p>
        <h1>Clinical reasoning in paediatric gastroenterology and nutrition</h1>
        <p class="sub">${CASES.length} peer-reviewed case reports, reconstructed as stepwise clinical decisions. Commit to each decision before the published management, outcome and supporting evidence are revealed.</p>
        <ol class="lh-steps"><li><b>01</b>Review the presentation</li><li><b>02</b>Commit to a decision</li><li><b>03</b>Compare with the published management</li></ol>
        <p class="lh-meta">${CASES.length} cases · ${nSteps} decision points · Peer-reviewed sources, ${Math.min(...yrs)}–${Math.max(...yrs)}</p>
      </div>
      <div class="lh-v" aria-hidden="true">
        <div class="lh-baby" id="heroBaby"></div>
        <div class="lh-pill"><svg viewBox="0 0 20 20" width="16" height="16"><path class="hx-heart" d="M10 17 C3 12 1.5 7.5 4.5 5 C7 3.2 9 5 10 6.6 C11 5 13 3.2 15.5 5 C18.5 7.5 17 12 10 17Z" fill="#F2684A"/></svg><b id="hxHr">138</b><span>bpm</span><i>SpO₂ <b id="hxSp">98</b>%</i></div>
      </div>
    </header>
    <section class="cl-cases" aria-label="Cases">
      <div class="cl-bar"><h2>Cases</h2><div class="seg" role="group" aria-label="Filter cases">${FILTERS.map(([k,l])=>`<button type="button" data-f="${k}" aria-pressed="${labFilter===k}">${l}</button>`).join("")}</div></div>
      <div class="cc-grid">${cards}</div>
      <p class="cl-note">Case details are kept to the initial presentation. Diagnosis, published management and the source article are revealed as you work through each case.</p>
    </section>
    <details class="ws-d"><summary><span><b>Nutrition worksheet</b><span>ORS, maintenance fluid, intake and growth velocity calculators for dietitians</span></span></summary>
    <section class="ws" aria-label="Nutrition worksheet">
      <div class="ws-h" style="border-bottom-width:1px"><p>Educational aids that show their working. Check every figure against your unit's protocol before use.</p></div>
      <div class="ws-row"><div class="ws-q"><b>ORS for some dehydration</b><span>WHO Plan B, first 4 hours</span></div><div class="ws-in"><label for="c-ors-w">Weight (kg)<input id="c-ors-w" type="number" inputmode="decimal" min="1" max="30" step="0.1" value="7.5"></label></div><div class="ws-out" id="r-ors"></div></div>
      <div class="ws-row"><div class="ws-q"><b>Daily maintenance fluid</b><span>Holliday-Segar, beyond the newborn period; total fluid, not a milk target</span></div><div class="ws-in"><label for="c-mf-w">Weight (kg)<input id="c-mf-w" type="number" inputmode="decimal" min="3" max="40" step="0.1" value="6"></label></div><div class="ws-out" id="r-mf"></div></div>
      <div class="ws-row"><div class="ws-q"><b>Intake from a feeding diary</b><span>Rule of thumb for term formula-fed infants under 6 months: about 150 mL/kg/day; not for preterm babies</span></div><div class="ws-in"><label for="c-in-v">Milk per day (mL)<input id="c-in-v" type="number" inputmode="decimal" min="0" step="10" value="1080"></label><label for="c-in-w">Weight (kg)<input id="c-in-w" type="number" inputmode="decimal" min="0.5" step="0.1" value="6"></label></div><div class="ws-out" id="r-in"></div></div>
      <div class="ws-row"><div class="ws-q"><b>Growth velocity</b><span>Exponential method (<a class="ref" href="https://doi.org/10.1038/jp.2009.55" target="_blank" rel="noopener noreferrer">Patel et al., J Perinatol 2009<span aria-hidden="true"> ↗</span></a>)</span></div><div class="ws-in"><label for="c-gv-1">Earlier (g)<input id="c-gv-1" type="number" inputmode="decimal" min="300" step="10" value="1250"></label><label for="c-gv-2">Latest (g)<input id="c-gv-2" type="number" inputmode="decimal" min="300" step="10" value="1460"></label><label for="c-gv-d">Days<input id="c-gv-d" type="number" inputmode="numeric" min="1" step="1" value="14"></label></div><div class="ws-out" id="r-gv"></div></div>
    </section></details>
    <p class="cl-disc">Educational material for healthcare professionals. Cases follow the cited published reports; decision points and response options are constructed for learning. Generic terms only; no products are named or recommended. Not a substitute for clinical judgement or local protocols.</p>
  </div>`;
  viewLab.querySelectorAll(".seg button").forEach(b=>b.onclick=()=>{ labFilter=b.dataset.f; renderLab(); });
  startHero();
  viewLab.querySelectorAll(".cc[data-id]").forEach(r=>{ r.onclick=()=>playCase(r.dataset.id); r.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); playCase(r.dataset.id); } }; });
  const num=id=>parseFloat(($("#"+id)||{}).value);
  const fmt=n=>Math.round(n).toLocaleString("en-IN");
  const f1=n=>(Math.round(n*10)/10).toLocaleString("en-IN");
  function calc(){
    const w1=num("c-ors-w"); $("#r-ors").innerHTML = w1>0 ? `${f1(w1)} kg × 75 mL/kg = <b>${fmt(w1*75)} mL</b><em>over 4 hours by spoon or cup, then reassess</em>` : "Enter a weight";
    const w2=num("c-mf-w"); if(w2>0){ const d = w2<=10 ? 100*w2 : w2<=20 ? 1000+50*(w2-10) : 1500+20*(w2-20); const how = w2<=10 ? `${f1(w2)} kg × 100 mL/kg` : w2<=20 ? `1,000 + 50 × ${f1(w2-10)} kg` : `1,500 + 20 × ${f1(w2-20)} kg`; $("#r-mf").innerHTML=`${how} = <b>${fmt(d)} mL/day</b><em>about ${fmt(d/24)} mL an hour</em>`; } else $("#r-mf").textContent="Enter a weight";
    const v=num("c-in-v"), w3=num("c-in-w"); if(v>=0&&w3>0){ const k=v/w3; $("#r-in").innerHTML=`${fmt(v)} mL ÷ ${f1(w3)} kg = <b>${fmt(k)} mL/kg/day</b><em>${k>170?"Above the usual rule of thumb: review for overfeeding":k<120?"Below the usual rule of thumb: review feeding and growth":"Close to the usual rule of thumb"}</em>`; } else $("#r-in").textContent="Enter volume and weight";
    const a=num("c-gv-1"), b=num("c-gv-2"), d=num("c-gv-d"); if(a>0&&b>0&&d>0){ const gv=1000*Math.log(b/a)/d; $("#r-gv").innerHTML=`1000 × ln(${fmt(b)} ÷ ${fmt(a)}) ÷ ${fmt(d)} = <b>${gv.toFixed(1)} g/kg/day</b><em>${fmt((b-a)/d)} g a day on average</em>`; } else $("#r-gv").textContent="Enter both weights and the days";
  }
  viewLab.querySelectorAll(".ws input").forEach(i=>i.oninput=calc); calc();
}

function startHero(){
  const host=$("#heroBaby"); if(!host||!window.BABYFRONT||!BABYFRONT.supported()) return;
  try{ heroEngine=BABYFRONT.create(host,{variant:"term", engine:"nicu", age:"newborn", smile:true, ogt:false, padTop:0, padBot:0, hr:138, onReady(){ host.classList.add("ready"); }}); }catch(e){ heroEngine=null; }
  const tick=()=>{ const h=document.getElementById("hxHr"); if(!h) return; h.textContent=134+Math.round(Math.random()*8); $("#hxSp").textContent=97+Math.round(Math.random()*2); setTimeout(tick,2600); };
  setTimeout(tick,2600);
}
function shuffle(n){ const a=[...Array(n).keys()]; for(let i=n-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

/* bedside monitor: ECG and pleth traces drawn from the live heart rate */
function startMonitor(cv, V){
  const ctx=cv.getContext("2d"), ecg=[], pl=[]; let ph=0, last=performance.now();
  function size(){ const r=cv.getBoundingClientRect(), d=Math.min(2,window.devicePixelRatio||1); cv.width=Math.max(10,r.width*d); cv.height=Math.max(10,r.height*d); }
  size(); const ro=new ResizeObserver(size); ro.observe(cv);
  const css=n=>getComputedStyle(cv).getPropertyValue(n).trim();
  (function loop(now){
    if(!document.body.contains(cv)){ ro.disconnect(); return; }
    requestAnimationFrame(loop);
    if(document.hidden) { last=now; return; }
    const dt=Math.min(.05,(now-last)/1000); last=now; ph=(ph+dt*V.shownHr/60)%1;
    const p=ph, e = p<.08?Math.sin(p/.08*Math.PI)*.15 : p<.12?-.12 : p<.15?1 : p<.18?-.35 : p<.3?0 : p<.45?Math.sin((p-.3)/.15*Math.PI)*.22 : 0;
    const pp = p<.25?Math.sin(p/.25*Math.PI/2):Math.cos((p-.25)/.75*Math.PI/2)*.92+.04*Math.sin(p*18);
    const W=cv.width, H=cv.height, n=Math.floor(W/3);
    ecg.push(e); pl.push(pp); while(ecg.length>n) ecg.shift(); while(pl.length>n) pl.shift();
    ctx.fillStyle=css("--mon-bg")||"#06110F"; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle=css("--mon-grid")||"#12302B"; ctx.lineWidth=1;
    for(let x=0;x<W;x+=H/6){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=0;y<H;y+=H/6){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    const tr=(arr,y0,amp,col)=>{ ctx.strokeStyle=col; ctx.lineWidth=Math.max(1.5,H/70); ctx.beginPath(); arr.forEach((v,i)=>{ const x=i*3, y=y0-v*amp; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke(); };
    tr(ecg,H*.42,H*.3,V.alarm?"#FF6A5E":(css("--ecg")||"#4BE38E"));
    tr(pl,H*.9,H*.24,css("--pleth")||"#56C8F5");
  })(last);
}

function playCase(id){
  const c=CASES.find(x=>x.id===id); if(!c) return renderLab();
  disposeLab();
  const t=CASE_TRACKS[c.track], nicu=c.engine==="nicu", ans=[]; let step=0;
  const V={hr:c.scene.hr||140, spo2:c.scene.spo2||null, temp:c.scene.temp||36.8, alarm:!!c.scene.alarm, shownHr:c.scene.hr||140, shownSp:c.scene.spo2||0};
  const MODES = nicu ? [["nicu","Incubator"],["inside","Inside"],["gut","Gut"]] : [["outside","Outside"],["inside","See inside"]];
  viewLab.innerHTML=`<div class="lab" style="--tc:${t.color}">
    <div class="cs-top"><button class="lnk" type="button" id="exit">Back to cases</button>
      <div class="band"><span class="tri"></span><b>${esc(ptName(c))}</b><span>${esc(c.pt.tag)}</span><span>${esc(c.vitals[1][0])} ${esc(c.vitals[1][1])}</span><span>${esc(c.vitals[2][0])} ${esc(c.vitals[2][1])}</span><span>${bedNo(c)}</span></div>
      <div class="prog" id="prog" aria-label="Decisions"></div></div>
    <div class="cs-grid">
      <aside class="bedside" id="bedside" aria-label="Bedside">
        <div class="p3d" id="p3d"><div class="loader"><span></span>Preparing the baby</div></div>
        <div class="monitor"><span class="mon-tag"><i></i>${nicu?"NICU MONITOR":"OBSERVATIONS"} · ${esc(ptName(c).toUpperCase())}</span><canvas id="mon-c" aria-hidden="true"></canvas>
          <div class="mon-num"><small>HR</small><b class="hr" id="v-hr">-</b><small>SpO2</small><b class="sp" id="v-sp">${V.spo2?"-":"--"}</b><small>Temp</small><b class="tp" id="v-t">-</b></div></div>
        <p class="pt-line">${esc(c.pt.line)}</p>
      </aside>
      <article class="sheet" id="sheet" aria-label="Case sheet">
        <header class="sheet-h"><div><p class="lab-k">${bedNo(c)} · ${nicu?"Neonatal unit":"Outpatient and emergency"}</p><h2>${esc(c.title)}</h2></div><div class="meta">${c.aud.map(audTxt).join(" + ")}<br>${c.level} · ${c.min} min</div>${c.pub?`<p class="pubsrc">Based on a peer-reviewed case report. The source article is revealed in the case summary.</p>`:""}</header>
        <ol class="entries" id="entries"></ol>
        <section class="cs-now" id="now" aria-live="polite"></section>
      </article>
    </div></div>`;
  $("#exit").onclick=()=>renderLab();
  const host=$("#p3d");
  function labFail(){ host.classList.add("ready"); if(!host.querySelector(".fallback")) host.insertAdjacentHTML("beforeend",`<div class="fallback"><div class="blob"></div></div>`); }
  try{
    if(window.BABYFRONT && BABYFRONT.supported()) labEngine = BABYFRONT.create(host, Object.assign({variant:nicu?"preterm":"term", engine:nicu?"nicu":"home", age:/\bmo\b/.test(c.pt.tag)?"infant":"newborn", padTop:46, padBot:8, onReady(){ host.classList.add("ready"); }, onFail: labFail}, c.scene));
  }catch(e){ console.warn("Baby view unavailable", e); labEngine=null; }
  if(!labEngine) labFail();
  const seg=document.createElement("div"); seg.className="seg vseg"; seg.setAttribute("role","group"); seg.setAttribute("aria-label","Baby view");
  seg.innerHTML=MODES.map(([k,l])=>`<button type="button" data-m="${k}" aria-pressed="false">${l}</button>`).join(""); host.appendChild(seg);
  function syncSeg(m){ seg.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.m===m))); }
  seg.querySelectorAll("button").forEach(b=>b.onclick=()=>{ if(!labEngine) return; labEngine.set(nicu?{mode:b.dataset.m}:{view:b.dataset.m}); syncSeg(b.dataset.m); });
  syncSeg(nicu ? (c.scene.mode||"nicu") : (c.scene.view||"outside"));
  function applyScene(p){
    if(!p) return; if(p.hr!=null) V.hr=p.hr; if(p.spo2!=null) V.spo2=p.spo2; if(p.temp!=null) V.temp=p.temp; if(p.alarm!=null) V.alarm=p.alarm;
    if(labEngine) labEngine.set(p);
    const m = nicu ? p.mode : p.view; if(m) syncSeg(m);
  }
  startMonitor($("#mon-c"), V);
  const hrEl=$("#v-hr"), spEl=$("#v-sp"), tEl=$("#v-t");
  (function vloop(){
    if(!document.body.contains(hrEl)) return;
    V.shownHr+=(V.hr-V.shownHr)*.05; if(V.spo2) V.shownSp+=(V.spo2-V.shownSp)*.05;
    hrEl.textContent=Math.round(V.shownHr); hrEl.classList.toggle("alarm", V.shownHr>185||V.shownHr<100||V.alarm);
    if(V.spo2){ spEl.textContent=Math.round(V.shownSp); spEl.classList.toggle("alarm", V.shownSp<88); }
    tEl.textContent=V.temp.toFixed(1)+"°";
    requestAnimationFrame(vloop);
  })();
  function prog(){ $("#prog").innerHTML=c.steps.map((s,i)=>{ const cl=i<ans.length?(ans[i].ok?"ok":"bad"):i===step?"cur":""; return `<span class="${cl}" title="${esc(s.s)}">${i<ans.length?(ans[i].ok?"✓":"✕"):i+1}</span>`; }).join(""); }
  function logEntry(i){
    const s=c.steps[i], a=ans[i], ch=s.o[a.i], best=s.o.find(o=>o[2]), fx=s.fx&&s.fx[a.ok?"ok":"bad"];
    $("#entries").insertAdjacentHTML("beforeend",`<li class="entry"><div class="mg"><span>${String(i+1).padStart(2,"0")}</span><span class="mk ${a.ok?"ok":"bad"}">${a.ok?"✓":"✕"}</span></div>
      <div class="bd"><h4>${esc(s.s)}</h4><p>${esc(s.v)}</p><p class="order"><b>Order:</b> ${esc(ch[0])}</p>${a.ok?"":`<p class="order"><b>Evidence-based order:</b> ${esc(best[0])}</p>`}${fx?`<p class="eff">Outcome: ${esc(fx.cap)}</p>`:""}</div></li>`);
  }
  function render(){
    prog(); const s=c.steps[step], order=shuffle(s.o.length);
    applyScene(s.pre); if(labEngine&&labEngine.highlight) labEngine.highlight(null);
    $("#bedside").classList.remove("fx-ok","fx-warn","fx-bad");
    $("#now").innerHTML=`<div class="cs-note"><div class="mg">${String(step+1).padStart(2,"0")}</div><div class="bd">
      <p class="lbl">Entry ${step+1} of ${c.steps.length} · ${esc(s.s)}</p><p class="vig">${esc(s.v)}</p><h3 class="q">${esc(s.q)}</h3>
      <div class="orders" role="group" aria-label="Choose your order">${order.map(oi=>`<button class="ord" type="button" data-i="${oi}"><span class="bx" aria-hidden="true"></span><span class="ot">${esc(s.o[oi][0])}</span></button>`).join("")}</div>
      <div id="after"></div></div></div>`;
    $("#now").querySelectorAll(".ord").forEach(b=>b.onclick=()=>pick(+b.dataset.i));
    if(step>0) $("#now").scrollIntoView({behavior:reduce?"auto":"smooth", block:"start"});
  }
  function pick(i){
    const s=c.steps[step], ok=!!s.o[i][2]; ans.push({i,ok});
    $("#now").querySelectorAll(".ord").forEach(b=>{
      const j=+b.dataset.i; b.disabled=true;
      if(j===i){ b.classList.add(ok?"ok":"bad"); b.querySelector(".bx").textContent=ok?"✓":"✕"; b.querySelector(".ot").insertAdjacentHTML("beforeend",`<span class="fb">${esc(s.o[j][1])}</span>`); }
      else if(s.o[j][2]){ b.classList.add("ok"); b.querySelector(".bx").textContent="✓"; b.querySelector(".ot").insertAdjacentHTML("beforeend",`<span class="fb"><b>Evidence-based order.</b> ${esc(s.o[j][1])}</span>`); }
      else b.classList.add("dim");
    });
    const fx=s.fx&&s.fx[ok?"ok":"bad"], kind= ok?"ok":((fx&&fx.kind)||"bad");
    if(fx){
      const p=Object.assign({}, fx.set||{}); if(fx.mode) p.mode=fx.mode; applyScene(p);
      if(labEngine){ labEngine.flash(kind); if(labEngine.highlight) labEngine.highlight(fx.hl||null); }
      const bs=$("#bedside"); bs.classList.remove("fx-ok","fx-warn","fx-bad"); void bs.offsetWidth; bs.classList.add("fx-"+kind);
    }
    const last=step===c.steps.length-1;
    $("#after").innerHTML=`<div class="review">
      <div class="rv-line"><span class="mk ${ok?"ok":"bad"}">${ok?"✓":"✕"}</span><div><b>${ok?"In line with the evidence.":"Not the evidence-based order."}</b></div></div>
      ${fx?`<div class="obs"><b>At the bedside</b>${esc(fx.cap)}</div>`:""}
      <div class="ev"><p>${esc(s.a)}${s.g.map((g,k)=>`<sup>${k+1}</sup>`).join("")}</p><ol>${s.g.map(g=>`<li>${refHTML(g)}</li>`).join("")}</ol></div>
      <div class="tpt"><b>Teaching point</b><span>${esc(s.p)}</span></div>${s.dp?`<div class="tpt"><b>Dietitian note</b><span>${esc(s.dp)}</span></div>`:""}
      <div class="cs-nav"><span class="small">${ans.filter(a=>a.ok).length} of ${ans.length} in line with the evidence</span><button class="act" type="button" id="nx">${last?"Write discharge summary":"Next entry"}</button></div></div>`;
    prog();
    $("#nx").onclick=()=>{ logEntry(step); if(last) finish(); else { step++; render(); } };
    if(matchMedia("(max-width:960px)").matches) setTimeout(()=>$("#bedside").scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"}),200);
  }
  function finish(){
    const sc=ans.filter(a=>a.ok).length, n=c.steps.length;
    const all=store.get(); all[c.id]={score:Math.max(sc,(all[c.id]||{}).score||0), total:n}; store.set(all);
    const nxt=CASES[(CASES.indexOf(c)+1)%CASES.length];
    step=n; prog();
    $("#entries").innerHTML="";
    $("#now").innerHTML=`<div class="dc"><p class="lab-k">Discharge summary · ${today()}</p>
      <div class="dc-score"><b>${sc} of ${n}</b><span>decisions in line with the evidence · ${esc(c.title)}</span></div>
      <h3>Decisions</h3><table><thead><tr><th></th><th>Entry</th><th>Order written</th></tr></thead><tbody>${c.steps.map((s,i)=>{ const a=ans[i]||{}, best=s.o.find(o=>o[2]), ch=s.o[a.i]||best; return `<tr><td class="mk ${a.ok?"ok":"bad"}">${a.ok?"✓":"✕"}</td><td>${esc(s.s)}</td><td>${esc(ch[0])}${a.ok?"":`<br><span style="color:var(--muted)">Evidence-based: ${esc(best[0])}</span>`}</td></tr>`; }).join("")}</tbody></table>
      <h3>Teaching points</h3><ul>${c.steps.map(s=>`<li>${esc(s.p)}</li>`).join("")}</ul>
      ${c.steps.some(s=>s.dp)?`<h3>Dietitian notes</h3><ul>${c.steps.filter(s=>s.dp).map(s=>`<li>${esc(s.dp)}</li>`).join("")}</ul>`:""}
      <h3>References</h3><ol>${c.pub?`<li>Case source: ${refHTML(c.pub.cite)}</li>`:""}${c.refs.filter(r=>!c.pub||refUrl(r)!==c.pub.url).map(r=>`<li>${refHTML(r)}</li>`).join("")}</ol>
      <div class="cs-nav" style="margin-top:18px"><button class="act sec" type="button" id="again2">Replay this case</button><button class="act" type="button" id="next2">Next patient: ${esc(nxt.title)}</button></div></div>`;
    $("#again2").onclick=()=>playCase(c.id); $("#next2").onclick=()=>playCase(nxt.id);
    $("#sheet").scrollIntoView({behavior:reduce?"auto":"smooth", block:"start"});
  }
  render();
}


/* =========================================================
   KOL finder: searchable directory of nutrition key opinion leaders with scores, filters, shortlist, CSV export
   and a profile panel. Every source link carries its verification result (v: 1 confirmed, 2 archived copy, 3 not checkable).
   ========================================================= */
const viewKol=$("#viewKol");
/* Preview access: the top profiles are open; the rest ship as locked teasers (specialty, place, band only).
   Set REQUEST_TO to the address that should receive access requests; when empty, the request is shown to copy. */
const REQUEST_TO="";
let KOL=null, kolState={q:"",grp:"",hcp:"",zone:"",state:"",band:"",rel:"",has:{tr:false,gl:false,intl:false},active:false,short:false,sort:"score",shown:40};
const KSTORE={ get(){ try{ return JSON.parse(localStorage.getItem("ttt-kol-short")||"[]"); }catch(e){ return []; } }, set(v){ try{ localStorage.setItem("ttt-kol-short",JSON.stringify(v)); }catch(e){} } };
let shortlist=new Set(KSTORE.get());
const SC_LABEL=["KOL score","Research impact","Clinical trials","Leadership and honours","Public profile","Guideline authorship"];
const SC_HINT=["Overall score across the five components","From publication and citation metrics (h-index)","Registered trials and trial leadership","Society, editorial and advisory roles, and awards","Institutional and research profiles that can be found publicly","Guidelines and consensus statements co-authored"];
const BANDS=[["A","Band A (70+)"],["B","Band B (55-69)"],["C","Band C (40-54)"],["D","Band D (below 40)"],["U","Unscored"]];
const bandOf=k=> k.tier.startsWith("Band A")?"A":k.tier.startsWith("Band B")?"B":k.tier.startsWith("Band C")?"C":k.tier.startsWith("Band D")?"D":"U";
const GROUPS=[
  ["neo","Neonatology and paediatrics",/neonat|paediatric(s)?$|^paediatrics|pediatric(s)?$|child health|adolescent/i],
  ["pgi","Paediatric GI and hepatology",/paediatric gastro|pediatric gastro|paediatric hepat/i],
  ["gi","Gastroenterology and hepatology",/gastro|hepat|liver|hpb|gi \//i],
  ["endo","Endocrinology, diabetes and obesity",/endocrin|diabet|obesity|metabol/i],
  ["diet","Clinical nutrition and dietetics",/dietet|clinical nutrition|food science|nutrition science|nutritionist|biochem/i],
  ["ph","Public health and community nutrition",/public health|community|epidemiol|preventive|social/i],
  ["icu","Critical care and surgery",/critical care|intensive|icu|surg|anaesth|anesth/i],
  ["onc","Oncology and haematology",/oncolog|haemat|hemat|cancer/i],
  ["oth","Other specialties",/.*/]
];
const grpOf=k=>{ for(const [id,,re] of GROUPS){ if(id==="oth") return id; if(re.test(k.sp)) return id; } return "oth"; };
const fmtN=n=> n==null?"-":Number(n).toLocaleString("en-IN");
const initials=n=> n.replace(/\(.*?\)/g,"").split(/\s+/).filter(w=>w&&/[A-Za-z]/.test(w[0])).slice(0,2).map(w=>w[0]).join("").toUpperCase();
const cleanState=s=> (s||"").replace(/\s*\(UT\)/,"");
function kolLoad(){
  if(KOL) return KOL;
  KOL = window.KOL_DATA || { built:"", stats:{links:0,checked:0,blocked:0,removed:0}, kols:[] };
  KOL.kols.forEach(k=>{ if(k.lk===undefined && k.locked){ Object.assign(k,{t:"",n:"",alias:"",d:"",i:"",q:"",sub:"",stat:"",ex:[],lk:{},ro:k.intl?[{lv:"International"}]:[],tr:Array(k.ntr||0).fill(0),gl:Array(k.ngl||0).fill(0),sc:[k.sc0,null,null,null,null,null]}); }
    k._b=bandOf(k); k._g=grpOf(k); k._st=cleanState(k.st); k._intl=k.ro.some(r=>r.lv==="International");
    k._s=[k.t,k.n,k.alias,k.d,k.i,k.c,k._st,k.sp,k.sub,k.q,...(k.ex||[])].join(" ").toLowerCase(); });
  return KOL;
}
function kolFilter(){
  const s=kolState, q=s.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let L=KOL.kols.filter(k=> q.every(w=>k._s.includes(w)) && (!s.grp||k._g===s.grp) && (!s.hcp||k.hcp===s.hcp) && (!s.zone||k.z===s.zone) && (!s.state||k._st===s.state)
    && (!s.band||k._b===s.band) && (!s.rel||k.rel===s.rel) && (!s.has.tr||k.tr.length) && (!s.has.gl||k.gl.length) && (!s.has.intl||k._intl) && (!s.active||!/retired/i.test(k.stat)) && (!s.short||shortlist.has(k.id)));
  const key={score:k=>k.sc[0]??-1,h:k=>k.h??-1,pubs:k=>k.pubs??-1,cit:k=>k.cit??-1,tr:k=>k.tr.length,gl:k=>k.gl.length}[s.sort];
  L.sort((a,b)=>((a.locked?1:0)-(b.locked?1:0)) || (s.sort==="name"?a.n.localeCompare(b.n):(key(b)-key(a))||((b.sc[0]??-1)-(a.sc[0]??-1))||a.n.localeCompare(b.n)));
  return L;
}
const opt=(v,l,cur)=>`<option value="${esc(v)}"${v===cur?" selected":""}>${esc(l)}</option>`;
function renderKol(){
  kolLoad(); const K=KOL.kols, s=kolState;
  const uniq=f=>[...new Set(K.map(f).filter(Boolean))].sort();
  const cnt=b=>K.filter(k=>k._b===b).length;
  const nChecked=KOL.stats.checked, nLinks=KOL.stats.links;
  viewKol.innerHTML=`<div class="kol">
    <header class="kh">
      <div><p class="eyebrow">KOL finder · Nutrition experts in India</p><h1>Find the right <em>experts</em></h1>
        <p class="kh-sub">${K.length} public profiles of paediatricians, neonatologists, gastroenterologists, endocrinologists, dietitians and nutrition scientists, scored on research, trials, leadership, public profile and guideline work. Data as of ${esc(KOL.built)}.</p></div>
      <div class="kstats">
        <div><b>${K.length}</b><span>Profiles</span></div>
        <div><b>${cnt("A")}</b><span>Band A (70+)</span></div>
        <div><b>${cnt("B")}</b><span>Band B (55-69)</span></div>
        <div><b>${K.filter(k=>k.tr.length).length}</b><span>Trialists</span></div>
        <div><b>${K.filter(k=>k.gl.length).length}</b><span>Guideline authors</span></div>
      </div>
    </header>
    <div class="kaccess"><span class="klock lg" aria-hidden="true"></span><div><b>Preview access: ${K.filter(k=>!k.locked).length} of ${K.length} profiles are open.</b><span>The top-ranked experts are shown in full. The other ${K.filter(k=>k.locked).length} are listed by specialty, location and score band; names, contacts and evidence unlock with full access.</span></div><button class="btn primary" type="button" data-req>Need more? Request full access</button></div>
    <p class="kverify"><span class="vk v1" aria-hidden="true">✓</span> ${fmtN(nChecked)} of ${fmtN(nLinks)} source links were opened and confirmed to name the expert and support the entry. <span class="vk v3" aria-hidden="true">!</span> marks a page that could not be checked automatically (the site blocks automated access, or only an archived copy remains); open it to confirm. Entries whose source did not support them have been left out.</p>
    <div class="kgrid">
      <aside class="kf" aria-label="Filters">
        <label class="kf-search"><span class="sr-only">Search</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="kq" type="search" placeholder="Name, institution, city or topic" value="${esc(s.q)}" autocomplete="off"></label>
        <label>Specialty group<select data-k="grp">${opt("","All specialties",s.grp)}${GROUPS.map(([id,l])=>opt(id,`${l} (${K.filter(k=>k._g===id).length})`,s.grp)).join("")}</select></label>
        <label>Professional type<select data-k="hcp">${opt("","All types",s.hcp)}${uniq(k=>k.hcp).map(v=>opt(v,v,s.hcp)).join("")}</select></label>
        <label>Score band<select data-k="band">${opt("","All bands",s.band)}${BANDS.map(([id,l])=>opt(id,`${l} (${cnt(id)})`,s.band)).join("")}</select></label>
        <div class="kf-row"><label>Zone<select data-k="zone">${opt("","All",s.zone)}${uniq(k=>k.z).map(v=>opt(v,v,s.zone)).join("")}</select></label>
        <label>State<select data-k="state">${opt("","All",s.state)}${uniq(k=>k._st).map(v=>opt(v,v,s.state)).join("")}</select></label></div>
        <label>Relevance to nutrition<select data-k="rel">${opt("","All",s.rel)}${uniq(k=>k.rel).map(v=>opt(v,v,s.rel)).join("")}</select></label>
        <fieldset><legend>Must have</legend>
          <label class="ck"><input type="checkbox" data-h="tr"${s.has.tr?" checked":""}> Clinical trials or research projects</label>
          <label class="ck"><input type="checkbox" data-h="gl"${s.has.gl?" checked":""}> Guideline or consensus work</label>
          <label class="ck"><input type="checkbox" data-h="intl"${s.has.intl?" checked":""}> An international role</label>
          <label class="ck"><input type="checkbox" id="kact"${s.active?" checked":""}> Active (hide retired or former)</label>
        </fieldset>
        <button class="btn ghost kreset" type="button" id="kreset">Clear filters</button>
      </aside>
      <section class="kres" aria-label="Results">
        <div class="kbar"><b id="kcount"></b>
          <div class="kbar-r">
            <button type="button" class="iconbtn" id="kshort" aria-pressed="${s.short}">★ Shortlist <span id="kshortn">${shortlist.size}</span></button>
            <label class="ksort">Sort<select id="ksort">${[["score","KOL score"],["h","h-index"],["pubs","Publications"],["cit","Citations"],["tr","Trials"],["gl","Guidelines"],["name","Name A-Z"]].map(([v,l])=>opt(v,l,s.sort)).join("")}</select></label>
            <button type="button" class="iconbtn" id="kcsv"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3"/></svg>Export CSV</button>
          </div></div>
        <ol class="klist" id="klist"></ol>
        <div class="kmore"><button class="btn" type="button" id="kmore">Show more</button></div>
      </section>
    </div>
    <p class="small kfoot">Profiles are compiled from public sources: institutional pages, ORCID, PubMed, ClinicalTrials.gov, Europe PMC and society websites. Contact details are shown only where they were published by the expert or their institution. Scores rank public evidence of expertise; they are not an endorsement, and any engagement should follow your organisation's HCP interaction and compliance policies.</p>
  </div>
  <div class="kreq" id="kreq" hidden><div class="kd-scrim" data-rclose></div><form class="kreq-box" role="dialog" aria-modal="true" aria-labelledby="kreq-t" id="kreqf">
    <header><span class="klock lg" aria-hidden="true"></span><div><p class="eyebrow">KOL finder · full access</p><h2 id="kreq-t">Need more experts?</h2><p class="small">Tell us what you are looking for and the Mediception team will open the full directory or send a matched shortlist.</p></div><button type="button" class="kd-x" data-rclose aria-label="Close">✕</button></header>
    <div class="kreq-g"><label>Your name<input name="name" required autocomplete="name"></label><label>Organisation<input name="org" required autocomplete="organization"></label>
    <label>Work email<input name="email" type="email" required autocomplete="email"></label><label>Need<select name="need"><option>Full directory access</option><option>A matched shortlist for a project</option><option>Advisory board or speaker search</option><option>Something else</option></select></label>
    <label class="full">What are you looking for?<textarea name="msg" rows="3" id="kreq-msg"></textarea></label></div>
    <div class="kreq-out" id="kreq-out" hidden></div>
    <footer><button class="btn primary" type="submit">Send request</button><button class="btn ghost" type="button" data-rclose>Cancel</button></footer></form></div>
  <div class="kdrawer" id="kdrawer" hidden><div class="kd-scrim" data-close></div><article class="kd" role="dialog" aria-modal="true" aria-labelledby="kd-title" tabindex="-1" id="kd"></article></div>`;
  const rer=()=>{ s.shown=40; renderList(); };
  $("#kq").oninput=e=>{ s.q=e.target.value; rer(); };
  viewKol.querySelectorAll(".kf select[data-k]").forEach(el=>el.onchange=()=>{ s[el.dataset.k]=el.value; rer(); });
  viewKol.querySelectorAll(".kf input[data-h]").forEach(el=>el.onchange=()=>{ s.has[el.dataset.h]=el.checked; rer(); });
  $("#kact").onchange=e=>{ s.active=e.target.checked; rer(); };
  $("#ksort").onchange=e=>{ s.sort=e.target.value; rer(); };
  $("#kreset").onclick=()=>{ kolState={q:"",grp:"",hcp:"",zone:"",state:"",band:"",rel:"",has:{tr:false,gl:false,intl:false},active:false,short:false,sort:"score",shown:40}; renderKol(); };
  $("#kshort").onclick=()=>{ s.short=!s.short; $("#kshort").setAttribute("aria-pressed",s.short); rer(); };
  $("#kmore").onclick=()=>{ s.shown+=40; renderList(); };
  $("#kcsv").onclick=exportCsv;
  $("#kdrawer").addEventListener("click",e=>{ if(e.target.closest("[data-close]")) closeKol(); });
  viewKol.addEventListener("click",e=>{ const b=e.target.closest("[data-req]"); if(b) openReq(b.dataset.req); });
  $("#kreq").addEventListener("click",e=>{ if(e.target.closest("[data-rclose]")) closeReq(); });
  $("#kreqf").onsubmit=sendReq;
  renderList();
}
function scoreBars(k){
  return `<span class="kbars" aria-hidden="true">${k.sc.slice(1).map((v,i)=>`<i style="--v:${v==null?0:v}" title="${SC_LABEL[i+1]}: ${v==null?"no data":v}"></i>`).join("")}</span>`;
}
function renderList(){
  const L=kolFilter(), s=kolState;
  $("#kcount").textContent=`${L.length} expert${L.length===1?"":"s"}`;
  const nLock=L.filter(k=>k.locked).length; let sep=false;
  $("#klist").innerHTML=L.slice(0,s.shown).map(k=>{ if(k.locked){ const head = sep?"":(sep=true,`<li class="ksep"><span class="klock" aria-hidden="true"></span><b>${nLock} more expert${nLock===1?"":"s"} match${nLock===1?"es":""}, locked in this preview</b><button class="btn" type="button" data-req="${esc(kolAsk())}">Request access</button></li>`);
    return head+`<li class="krow locked"><button type="button" class="kopen" data-req="${esc(k.sp+" in "+(k.c||k._st||"India"))}" aria-label="Locked profile: ${esc(k.sp)}, ${esc(k.c||k._st)}. Request access">
      <span class="kav lockav"><span class="klock" aria-hidden="true"></span></span>
      <span class="kwho"><b><span class="kblur" aria-hidden="true">Dr Xxxxxx Xxxxxx</span><span class="sr-only">Locked profile</span></b><span>${esc(k.hcp)} · ${esc(k.rel)}</span><small>${esc(k.c||"")}${k._st&&k._st!==k.c?`${k.c?", ":""}${esc(k._st)}`:""}${k.z?` · ${esc(k.z)} zone`:""}</small></span>
      <span class="kspec"><span class="ktag">${esc(k.sp)}</span>${k.tr.length?`<span class="ktag">Trialist</span>`:""}${k.gl.length?`<span class="ktag">Guideline author</span>`:""}${k._intl?`<span class="ktag">International role</span>`:""}</span>
      <span class="kmet kmet-l"><span class="kblur" aria-hidden="true"><b>000</b>papers</span><span class="kblur" aria-hidden="true"><b>00</b>h-index</span></span>
      <span class="kscore">${k._b==="U"?`<b class="un">Unscored</b>`:`<small class="kband b-${k._b}">Band ${k._b}</small>`}<small class="kneed">Request access</small></span>
    </button></li>`; }
    return `<li class="krow" data-id="${k.id}">
    <button type="button" class="kopen" data-id="${k.id}" aria-label="Open profile: ${esc(k.t+" "+k.n)}">
      <span class="kav b-${k._b}">${esc(initials(k.n))}</span>
      <span class="kwho"><b>${esc((k.t?k.t+" ":"")+k.n)}</b><span>${esc(k.d)}</span><small>${esc(k.i)}${k.c?` · ${esc(k.c)}`:""}${k._st&&k._st!==k.c?`, ${esc(k._st)}`:""}</small></span>
      <span class="kspec"><span class="ktag">${esc(k.sp)}</span>${/retired/i.test(k.stat)?`<span class="ktag warn">Retired or former</span>`:""}</span>
      <span class="kmet"><span><b>${fmtN(k.pubs)}</b>papers</span><span><b>${k.h??"-"}</b>h-index</span><span><b>${k.tr.length}</b>trials</span><span><b>${k.gl.length}</b>guidelines</span></span>
      <span class="kscore">${k.sc[0]==null?`<b class="un">Unscored</b><small>Too little public data</small>`:`<b>${k.sc[0]}</b><small class="kband b-${k._b}">Band ${k._b}</small>`}${scoreBars(k)}</span>
    </button>
    <button type="button" class="kstar" data-id="${k.id}" aria-pressed="${shortlist.has(k.id)}" aria-label="${shortlist.has(k.id)?"Remove from":"Add to"} shortlist">★</button></li>`; }).join("") || `<li class="kempty">No experts match these filters.</li>`;
  $("#kmore").parentElement.hidden = L.length<=s.shown;
  $("#klist").querySelectorAll(".kopen[data-id]").forEach(b=>b.onclick=()=>openKol(b.dataset.id));
  $("#klist").querySelectorAll(".kstar").forEach(b=>b.onclick=()=>toggleShort(b.dataset.id,b));
}
function toggleShort(id,btn){
  shortlist.has(id)?shortlist.delete(id):shortlist.add(id); KSTORE.set([...shortlist]);
  const on=shortlist.has(id); document.querySelectorAll(`.kstar[data-id="${id}"]`).forEach(b=>{ b.setAttribute("aria-pressed",on); b.setAttribute("aria-label",(on?"Remove from":"Add to")+" shortlist"); });
  $("#kshortn").textContent=shortlist.size; if(kolState.short) renderList();
}
const VMARK={1:`<span class="vk v1" title="Source checked: it names this expert and supports the entry">✓</span>`,2:`<span class="vk v2" title="Original page has gone; archived copy checked">↺</span>`,3:`<span class="vk v3" title="Could not be checked automatically; open it to confirm">!</span>`};
const srcLink=it=> it.u?` <a class="ksrc" href="${esc(it.u)}" target="_blank" rel="noopener noreferrer">${/web\.archive\.org/.test(it.u)?"Archived source":"Source"}<span class="sr-only"> (opens in a new tab)</span></a>${VMARK[it.v]||""}`:"";
function itemList(arr,fn){ return arr.length?`<ul class="kitems">${arr.map(fn).join("")}</ul>`:`<p class="small">None found in public sources.</p>`; }
function openKol(id){
  const k=KOL.kols.find(x=>x.id===id); if(!k) return; const d=$("#kd");
  const lk=k.lk||{}, LKN={profile:"Institutional profile",orcid:"ORCID",scholar:"Google Scholar",rg:"ResearchGate",li:"LinkedIn",x:"X"};
  const lv=["International","National","Zonal/State"]; const roles=[...k.ro].sort((a,b)=>lv.indexOf(a.lv)-lv.indexOf(b.lv));
  d.innerHTML=`<header class="kd-h"><span class="kav lg b-${k._b}">${esc(initials(k.n))}</span>
      <div><p class="eyebrow">${esc(k.hcp)} · ${esc(k.rel)}</p><h2 id="kd-title">${esc((k.t?k.t+" ":"")+k.n)}</h2>${k.alias?`<p class="small">Also listed as ${esc(k.alias)}</p>`:""}${k.idNote?`<p class="small kd-note">${esc(k.idNote)}</p>`:""}
      <p class="kd-d">${esc(k.d)}</p><p class="small">${esc(k.i)} · ${esc(k.c)}${k._st&&k._st!==k.c?`, ${esc(k._st)}`:""}${k.z?` · ${esc(k.z)} zone`:""}</p></div>
      <div class="kd-act"><button type="button" class="kstar lg" data-id="${k.id}" aria-pressed="${shortlist.has(k.id)}" aria-label="${shortlist.has(k.id)?"Remove from":"Add to"} shortlist">★</button><button type="button" class="kd-x" data-close aria-label="Close profile">✕</button></div></header>
    <div class="kd-b">
      <section class="kd-score"><div class="kd-big">${k.sc[0]==null?`<b class="un">Unscored</b><span>Too little public publication data for an overall score</span>`:`<b>${k.sc[0]}</b><span>${esc(k.tier)}</span>`}</div>
        <dl class="kd-comp">${k.sc.slice(1).map((v,i)=>`<div title="${SC_HINT[i+1]}"><dt>${SC_LABEL[i+1]}</dt><dd><i style="--v:${v==null?0:v}"></i><b>${v==null?"n/a":v}</b></dd></div>`).join("")}</dl></section>
      <section><h3>Profile</h3><dl class="kd-facts">
        <div><dt>Qualifications</dt><dd>${esc(k.q||"-")}</dd></div>
        <div><dt>Specialty</dt><dd>${esc(k.sp)}${k.sub?`<br><span class="small">${esc(k.sub)}</span>`:""}</dd></div>
        <div><dt>Experience</dt><dd>${k.exp?`${k.exp} years`:"-"}</dd></div>
        <div><dt>Status</dt><dd>${esc(k.stat)}</dd></div></dl>
        ${k.ex&&k.ex.length?`<div class="kd-tags">${k.ex.map(e=>`<span class="ktag">${esc(e)}</span>`).join("")}</div>`:""}</section>
      <section><h3>Research output</h3>
        <div class="kd-metrics"><div><b>${fmtN(k.pubs)}</b><span>Publications</span></div><div><b>${fmtN(k.p5)}</b><span>Last 5 years</span></div><div><b>${k.h??"-"}</b><span>h-index</span></div><div><b>${fmtN(k.cit)}</b><span>Citations</span></div></div>
        ${k.mfNote?`<p class="small kd-note">${esc(k.mfNote)}</p>`:""}
        ${k.top&&k.top.length?`<h4>Most cited</h4><ul class="kpubs">${k.top.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`:""}
        ${k.rec&&k.rec.length?`<h4>Most recent</h4><ul class="kpubs">${k.rec.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`:""}</section>
      <section><h3>Guidelines and consensus</h3>${itemList(k.gl,it=>`<li><b>${esc(it.l)}</b>${it.b?` <span class="small">${esc(it.b)}</span>`:""}${it.y?` <span class="ky">${esc(it.y)}</span>`:""}${srcLink(it)}</li>`)}</section>
      <section><h3>Clinical trials and research projects</h3>${itemList(k.tr,it=>`<li><b>${esc(it.l)}</b>${it.r?` <span class="small">${esc(it.r.replace(/_/g," ").toLowerCase().replace(/^\w/,c=>c.toUpperCase()))}</span>`:""}${srcLink(it)}</li>`)}</section>
      <section><h3>Leadership roles</h3>${itemList(roles,it=>`<li><span class="klv">${esc(it.lv||"")}</span><b>${esc(it.l)}</b>${it.b?`, ${esc(it.b)}`:""}${it.y?` <span class="ky">${esc(it.y)}</span>`:""}${srcLink(it)}</li>`)}</section>
      <section><h3>Awards and honours</h3>${itemList(k.aw,it=>`<li><b>${esc(it.l)}</b>${it.b?`, ${esc(it.b)}`:""}${it.y?` <span class="ky">${esc(it.y)}</span>`:""}${srcLink(it)}</li>`)}</section>
      <section><h3>Contact and profiles</h3><dl class="kd-facts">
        ${k.em?`<div><dt>Email</dt><dd><a href="mailto:${esc(k.em)}">${esc(k.em)}</a>${k.emt?`<br><span class="small">${esc(k.emt)}</span>`:""}</dd></div>`:""}
        ${k.ph?`<div><dt>Phone</dt><dd>${esc(k.ph)}</dd></div>`:""}
        <div><dt>Profiles</dt><dd>${Object.keys(LKN).filter(x=>lk[x]&&lk[x].u).map(x=>`<a class="ksrc" href="${esc(lk[x].u)}" target="_blank" rel="noopener noreferrer">${LKN[x]}<span class="sr-only"> (opens in a new tab)</span></a>${VMARK[lk[x].v]||""}`).join(" · ")||"-"}</dd></div></dl></section>
    </div>`;
  const dr=$("#kdrawer"); dr.hidden=false; document.body.classList.add("kd-open"); d.focus();
  d.querySelector(".kstar").onclick=e=>toggleShort(k.id,e.currentTarget);
  d.querySelector(".kd-x").onclick=closeKol;
  document.addEventListener("keydown",kolEsc);
}
function kolEsc(e){ if(e.key==="Escape") closeKol(); }
function closeKolAll(){ closeReq(); closeKol(); }
function closeKol(){ const dr=$("#kdrawer"); if(!dr||dr.hidden) return; dr.hidden=true; document.body.classList.remove("kd-open"); document.removeEventListener("keydown",kolEsc); }
function kolAsk(){
  const s=kolState, G=GROUPS.find(g=>g[0]===s.grp), bits=[G&&G[1], s.hcp, s.band&&("Band "+s.band), s.state||s.zone&&(s.zone+" zone"), s.q&&`"${s.q}"`].filter(Boolean);
  return bits.length?"Experts matching: "+bits.join(", "):"";
}
let reqFrom=null;
function openReq(ctx){
  reqFrom=document.activeElement; const r=$("#kreq"); r.hidden=false; document.body.classList.add("kd-open");
  const m=$("#kreq-msg"); if(ctx && !m.value) m.value=ctx; $("#kreq-out").hidden=true;
  setTimeout(()=>$("#kreqf").querySelector("input").focus(),30); document.addEventListener("keydown",reqEsc);
}
function reqEsc(e){ if(e.key==="Escape") closeReq(); }
function closeReq(){ const r=$("#kreq"); if(!r||r.hidden) return; r.hidden=true; document.body.classList.remove("kd-open"); document.removeEventListener("keydown",reqEsc); if(reqFrom&&reqFrom.focus) reqFrom.focus(); }
function sendReq(e){
  e.preventDefault(); const f=new FormData(e.target), v=n=>String(f.get(n)||"").trim();
  const body=`KOL finder: request for full access\n\nName: ${v("name")}\nOrganisation: ${v("org")}\nEmail: ${v("email")}\nNeed: ${v("need")}\n\n${v("msg")}`;
  const out=$("#kreq-out"); out.hidden=false;
  if(REQUEST_TO){ location.href=`mailto:${REQUEST_TO}?subject=${encodeURIComponent("KOL finder: full access request")}&body=${encodeURIComponent(body)}`; out.innerHTML=`<p><b>Your email app should open with the request ready to send.</b> If it does not, copy the text below.</p><pre>${esc(body)}</pre>`; }
  else out.innerHTML=`<p><b>Request ready.</b> Copy it and send it to your Mediception contact.</p><pre id="kreq-txt">${esc(body)}</pre><button class="btn" type="button" id="kreq-copy">Copy request</button><span class="small" role="status" id="kreq-msg2"></span>`;
  const cp=$("#kreq-copy"); if(cp) cp.onclick=async()=>{ try{ await navigator.clipboard.writeText(body); $("#kreq-msg2").textContent=" Copied"; }catch(_){ $("#kreq-msg2").textContent=" Select the text and copy it"; } };
}
function exportCsv(){
  const L=kolFilter().filter(k=>!k.locked), q=v=>`"${String(v==null?"":v).replace(/"/g,'""')}"`;
  const head=["ID","Title","Name","Professional type","Specialty","Sub-specialty","Designation","Institution","City","State","Zone","KOL score","Band",...SC_LABEL.slice(1),"Publications","Last 5 years","h-index","Citations","Trials","Guidelines","Email","Phone","Status"];
  const rows=L.map(k=>[k.id,k.t,k.n,k.hcp,k.sp,k.sub,k.d,k.i,k.c,k._st,k.z,k.sc[0],k._b==="U"?"Unscored":k._b,...k.sc.slice(1),k.pubs,k.p5,k.h,k.cit,k.tr.length,k.gl.length,k.em,k.ph,k.stat]);
  const csv="﻿"+[head,...rows].map(r=>r.map(q).join(",")).join("\r\n");
  try{ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); a.download=`kol-finder-${L.length}-experts.csv`; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); }catch(e){}
}

/* ---------- boot ---------- */
renderPresets(); renderLens(); go(0,1); syncNight();
{ const h=(location.hash||"").slice(1); if(h==="check") setTab("check"); else if(h==="kol") setTab("kol"); else if(h.startsWith("case-") && CASES.some(c=>c.id===h.slice(5))) setTab("lab", h.slice(5)); else setTab("lab"); }
})();
