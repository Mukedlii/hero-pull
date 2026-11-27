export type HeroClass = "Warrior" | "Mage" | "Guardian" | "Ranger" | "Assassin"
export type SkillId = "power" | "vitality" | "rune_mastery" | "critical" | "ability"
export type HeroProgression = { heroName: string; skillPoints: number; unlocked: SkillId[]; xpEarned: number }
export const SKILLS: { id: SkillId; name: string; description: string; cost: number }[] = [
 {id:"power",name:"Weapon Training",description:"+8% hero damage",cost:1},
 {id:"vitality",name:"Vitality",description:"+10% maximum HP",cost:1},
 {id:"rune_mastery",name:"Rune Mastery",description:"+15% rune combo damage",cost:1},
 {id:"critical",name:"Deadly Precision",description:"+5% critical chance",cost:2},
 {id:"ability",name:"Arcane Focus",description:"Hero ability cooldown reduced by 1 turn",cost:2}
]
const KEY="hero-pull-progression-v1"
export function classForAbility(ability:string):HeroClass {
 const a=ability.toLowerCase()
 if(/heal|healing|shield|guard|barrier|prison|freeze|time|oracle/.test(a)) return "Guardian"
 if(/fire|inferno|meteor|plasma|elemental|lightning|thunder|mage|arcane|void/.test(a)) return "Mage"
 if(/shadow|invisib|assassin|drain|blood|reaper|dimension|phantom/.test(a)) return "Assassin"
 if(/wind|speed|sonic|archer|arrow|boom|strike|telekinesis/.test(a)) return "Ranger"
 return "Warrior"
}
export function readProgression(heroName:string):HeroProgression {
 const empty={heroName,skillPoints:0,unlocked:[] as SkillId[],xpEarned:0}
 if(typeof window==="undefined") return empty
 try { const all=JSON.parse(localStorage.getItem(KEY)||"{}"); const v=all[heroName]; if(!v||typeof v!=="object") return empty
 return {heroName,skillPoints:Math.max(0,Math.floor(Number(v.skillPoints)||0)),unlocked:Array.isArray(v.unlocked)?v.unlocked.filter((x:unknown):x is SkillId=>SKILLS.some(s=>s.id===x)):[],xpEarned:Math.max(0,Math.floor(Number(v.xpEarned)||0))} } catch{return empty}
}
function writeProgress(v:HeroProgression){if(typeof window==="undefined")return;try{const all=JSON.parse(localStorage.getItem(KEY)||"{}");all[v.heroName]=v;localStorage.setItem(KEY,JSON.stringify(all));window.dispatchEvent(new Event("hero-pull-progression-updated"))}catch{}}
export function awardHeroXp(heroName:string,amount:number){const p=readProgression(heroName);const before=Math.floor(p.xpEarned/100);p.xpEarned+=Math.max(0,Math.floor(amount));const after=Math.floor(p.xpEarned/100);p.skillPoints+=after-before;writeProgress(p);return {progression:p,levelsGained:after-before}}
export function unlockSkill(heroName:string,id:SkillId){const p=readProgression(heroName);const skill=SKILLS.find(s=>s.id===id);if(!skill||p.unlocked.includes(id)||p.skillPoints<skill.cost)return p;p.skillPoints-=skill.cost;p.unlocked.push(id);writeProgress(p);return p}
export function skillBonus(ids:SkillId[]){return {power:ids.includes("power")?.08:0,health:ids.includes("vitality")?.1:0,combo:ids.includes("rune_mastery")?.15:0,crit:ids.includes("critical")?.05:0,cooldown:ids.includes("ability")?1:0}}
