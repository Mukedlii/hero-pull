export type LiveEvent = "arena_win" | "boss_kill" | "dungeon_clear" | "floor_clear"
const KEY = "hero-pull-liveops-v1"
function dayKey(){return new Date().toISOString().slice(0,10)}
function weekKey(){const d=new Date();const first=new Date(Date.UTC(d.getUTCFullYear(),0,1));return String(d.getUTCFullYear())+"-W"+String(Math.ceil((((d.getTime()-first.getTime())/86400000)+first.getUTCDay()+1)/7)).padStart(2,"0")}
type State={day:string;week:string;seasonXp:number;counts:Record<LiveEvent,number>;claimed:string[]}
function fresh():State{return {day:dayKey(),week:weekKey(),seasonXp:0,counts:{arena_win:0,boss_kill:0,dungeon_clear:0,floor_clear:0},claimed:[]}}
export function readLiveOps():State{if(typeof window==="undefined")return fresh();try{const raw=JSON.parse(localStorage.getItem(KEY)||"null");const v={...fresh(),...(raw||{})};if(v.day!==dayKey()){v.day=dayKey();v.counts.arena_win=0;v.counts.boss_kill=0;v.claimed=v.claimed.filter((x:string)=>!x.startsWith("daily:"))}if(v.week!==weekKey()){v.week=weekKey();v.counts.dungeon_clear=0;v.counts.floor_clear=0;v.claimed=v.claimed.filter((x:string)=>!x.startsWith("weekly:"))}return v}catch{return fresh()}}
export function recordLiveEvent(event:LiveEvent,amount=1){if(typeof window==="undefined")return;const s=readLiveOps();s.counts[event]=(s.counts[event]||0)+amount;s.seasonXp+=event==="boss_kill"?50:event==="dungeon_clear"?40:event==="arena_win"?15:5;localStorage.setItem(KEY,JSON.stringify(s));window.dispatchEvent(new Event("hero-pull-liveops-updated"))}
export function claimLiveReward(id:string,xp:number){const s=readLiveOps();if(s.claimed.includes(id))return s;s.claimed.push(id);s.seasonXp+=xp;localStorage.setItem(KEY,JSON.stringify(s));window.dispatchEvent(new Event("hero-pull-liveops-updated"));return s}
