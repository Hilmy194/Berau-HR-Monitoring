"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, BarChart3, BrainCircuit, BriefcaseBusiness, Building2, CircleGauge, Database, GraduationCap, Loader2, Search, Sparkles, Target, UserRoundSearch } from "lucide-react";
import type { TalentDevelopmentCandidate } from "@/lib/services/talent-development.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getInitials } from "@/lib/utils";

type Ranked = TalentDevelopmentCandidate & { matchScore:number; dataConfidence:number; roleRelevance:number; performanceScore:number; experienceScore:number; readiness:string; readinessTone:string; strengths:string[]; gaps:string[]; developmentFocus:string[] };
type SkillGap = { skill:string; currentLevel:string; targetLevel:string; gap:string; evidence:string; priority:"HIGH"|"MEDIUM"|"LOW" };
type IdpActivity = { category:"70_EXPERIENCE"|"20_SOCIAL"|"10_FORMAL"; title:string; action:string; closesSkillGap:string; owner:string; period:string; successMetric:string };
type AiCandidate = { id:string; rationale:string; strengths:string[]; skillGaps:SkillGap[]; idpActivities:IdpActivity[]; gaps:string[]; idp:string[] };
type AiResult = { mode:"AI"|"DETERMINISTIC"; model?:string; summary?:string; message?:string; candidates?:AiCandidate[] };

export function TalentDevelopmentWorkspace({ candidates }: { candidates: TalentDevelopmentCandidate[] }) {
  const [query,setQuery]=useState(""); const [target,setTarget]=useState(""); const [selectedId,setSelectedId]=useState<string|null>(null);
  const [ai,setAi]=useState<AiResult|null>(null); const [loading,setLoading]=useState(false);
  const suggestions=useMemo(()=>Array.from(new Set(candidates.flatMap(c=>[c.currentPosition,c.track.aspiration]).filter(Boolean) as string[])).sort(),[candidates]);
  const ranked=useMemo(()=>target?rankCandidates(candidates,target):[],[candidates,target]);
  const selected=ranked.find(c=>c.id===selectedId)??ranked[0];
  function search(e:FormEvent){e.preventDefault();if(!query.trim())return;setTarget(query.trim());setSelectedId(null);setAi(null)}
  async function analyze(){if(!target||loading)return;setLoading(true);try{const response=await fetch("/api/admin/talent-development/match",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({targetPosition:target})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Analisis AI gagal.");setAi(normalizeAiResult(payload))}catch(error){setAi({mode:"DETERMINISTIC",message:error instanceof Error?error.message:"Analisis AI gagal."})}finally{setLoading(false)}}
  const selectTarget=(value:string)=>{setQuery(value);setTarget(value);setSelectedId(null);setAi(null)};
  return <div className="space-y-6 pb-8">
    <section className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-8"><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl"/><div className="relative grid gap-7 lg:grid-cols-[1fr_430px] lg:items-end"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-primary"><Target className="h-4 w-4"/>Talent Development</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Temukan kandidat, susun jalur pengembangannya.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Talent pool ini berisi karyawan pasca-probation. Cari jabatan tujuan untuk melihat shortlist berbasis track record dan IDP.</p></div><form onSubmit={search} className="rounded-2xl border border-white/10 bg-white/[.07] p-3"><label htmlFor="target" className="mb-2 block text-xs font-semibold text-white/70">Jabatan yang akan diisi</label><div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"/><Input id="target" list="positions" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Contoh: Mining Operations Manager" className="h-11 border-white/10 bg-slate-950/50 pl-9 text-white placeholder:text-white/35"/><datalist id="positions">{suggestions.map(x=><option key={x} value={x}/>)}</datalist></div><Button className="h-11 gap-2 px-4 text-slate-950">Cari<ArrowRight className="h-4 w-4"/></Button></div></form></div></section>
    {!target?<Empty count={candidates.length} suggestions={suggestions.slice(0,6)} onSelect={selectTarget}/>:<>
      <section className="grid gap-3 sm:grid-cols-3"><Summary icon={BriefcaseBusiness} label="Posisi tujuan" value={target}/><Summary icon={UserRoundSearch} label="Talent dianalisis" value={`${candidates.length} karyawan`}/><Summary icon={Sparkles} label="Rekomendasi teratas" value={ranked[0]?.name??"-"}/></section>
      <section className="flex flex-col justify-between gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white p-4 sm:flex-row sm:items-center"><div><p className="flex items-center gap-2 text-sm font-bold"><BrainCircuit className="h-4 w-4 text-violet-700"/>GPT Talent Copilot</p><p className="mt-1 text-xs leading-5 text-slate-500">GPT membaca evidence shortlist untuk menjelaskan fit, gap, dan IDP. Keputusan akhir tetap pada HR dan user.</p></div><Button onClick={analyze} disabled={loading} className="shrink-0 gap-2 bg-violet-700 text-white hover:bg-violet-800">{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<Sparkles className="h-4 w-4"/>}{loading?"Menganalisis...":"Analisis dengan AI"}</Button></section>
      {ai&&<div className={`rounded-2xl border p-4 ${ai.mode==="AI"?"border-violet-200 bg-violet-50":"border-amber-200 bg-amber-50"}`}><p className="text-sm font-bold">{ai.mode==="AI"?`Analisis GPT selesai${ai.model?` · ${ai.model}`:""}`:"Mode scoring engine"}</p><p className="mt-1 text-xs leading-5 text-slate-600">{ai.summary??ai.message}</p></div>}
      {selected&&ai?.candidates?.find(x=>x.id===selected.id)&&<SkillGapAnalysis candidate={ai.candidates.find(x=>x.id===selected.id)!}/>} 
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]"><div className="space-y-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">Candidate recommendation</p><h3 className="mt-1 text-2xl font-bold">Kandidat untuk {target}</h3><p className="mt-1 text-xs text-slate-500">Scoring transparan; data yang tidak lengkap menurunkan confidence.</p></div>{ranked.slice(0,10).map((c,i)=><Candidate key={c.id} candidate={c} rank={i+1} active={selected?.id===c.id} onSelect={()=>setSelectedId(c.id)}/>)}</div>{selected&&<Idp candidate={selected} target={target} ai={ai?.candidates?.find(x=>x.id===selected.id)}/>}</section><DataNotice/>
    </>}
  </div>
}

function Candidate({candidate,rank,active,onSelect}:{candidate:Ranked;rank:number;active:boolean;onSelect:()=>void}){return <button onClick={onSelect} className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${active?"border-primary ring-2 ring-primary/20":"border-slate-200"}`}><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-4"><div className="relative"><Avatar className="h-14 w-14 border">{candidate.photoUrl&&<AvatarImage src={candidate.photoUrl}/>}<AvatarFallback className="bg-primary/15 font-bold text-emerald-700">{getInitials(candidate.name)}</AvatarFallback></Avatar><span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-white">{rank}</span></div><div className="min-w-0"><div className="flex flex-wrap gap-2"><h4 className="font-bold">{candidate.name}</h4><Badge className={candidate.readinessTone}>{candidate.readiness}</Badge></div><p className="mt-1 text-sm text-slate-500">{candidate.currentPosition}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Building2 className="h-3.5 w-3.5"/>{candidate.department} · {candidate.yearsOfService} tahun</p></div></div><div className="w-full sm:w-56"><div className="mb-2 flex items-end justify-between"><span className="text-xs text-slate-500">Match score</span><span className="text-2xl font-black">{candidate.matchScore}<small className="text-xs text-slate-400">/100</small></span></div><Progress value={candidate.matchScore} className="h-2"/><div className="mt-2 flex justify-between text-[10px] text-slate-400"><span>Role {candidate.roleRelevance}%</span><span>Confidence {candidate.dataConfidence}%</span></div></div></div></button>}

function Idp({candidate,target,ai}:{candidate:Ranked;target:string;ai?:AiCandidate}){const gaps=ai?.gaps??candidate.gaps;const activities=ai?.idp??candidate.developmentFocus;return <aside className="h-fit overflow-hidden rounded-2xl border bg-white shadow-sm xl:sticky xl:top-24"><div className="bg-slate-950 p-5 text-white"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-primary"><GraduationCap className="h-4 w-4"/>Individual Development Plan</p><h3 className="mt-3 text-xl font-bold">{candidate.name}</h3><p className="mt-1 text-sm text-slate-400">Target: {target}</p></div><div className="space-y-5 p-5">{ai?.rationale&&<div className="rounded-xl border border-violet-100 bg-violet-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">AI rationale</p><p className="mt-1 text-xs leading-5 text-violet-950">{ai.rationale}</p></div>}<div><p className="text-xs font-semibold uppercase tracking-[.15em] text-slate-400">Strength & gap</p><div className="mt-3 flex flex-wrap gap-2">{(ai?.strengths??candidate.strengths).map(x=><span key={x} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">{x}</span>)}{gaps.map(x=><span key={x} className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">{x}</span>)}</div></div><div className="space-y-4 border-l-2 border-emerald-100 pl-4">{["0–30 hari","31–60 hari","61–90 hari"].map((period,i)=><div key={period} className="relative"><span className="absolute -left-[1.32rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary ring-2 ring-emerald-100"/><p className="text-[10px] font-bold uppercase text-emerald-700">{period}</p><p className="mt-1 text-sm font-semibold">{["Assess & align","Learn & practice","Demonstrate impact"][i]}</p><p className="mt-1 text-xs leading-5 text-slate-500">{activities[i]??`Validasi gap ${target} bersama HR dan atasan.`}</p></div>)}</div><div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs"><Metric icon={BarChart3} label="Performance" value={`${candidate.performanceScore}/100`}/><Metric icon={CircleGauge} label="Data confidence" value={`${candidate.dataConfidence}%`}/></div><Button asChild variant="outline" className="w-full gap-2"><Link href={`/admin/employee-management/${candidate.id}`}>Buka talent card<ArrowRight className="h-4 w-4"/></Link></Button></div></aside>}

function Empty({count,suggestions,onSelect}:{count:number;suggestions:string[];onSelect:(x:string)=>void}){return <Card className="border-dashed"><CardContent className="flex min-h-[350px] flex-col items-center justify-center p-8 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-emerald-700"><Target className="h-8 w-8"/></div><h3 className="mt-5 text-xl font-bold">Mulai dari jabatan tujuan</h3><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Sistem siap menganalisis {count} talent pasca-probation dengan track record lintas fungsi perusahaan tambang.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{suggestions.map(x=><button key={x} onClick={()=>onSelect(x)} className="rounded-full border bg-slate-50 px-3 py-1.5 text-xs hover:border-primary">{x}</button>)}</div></CardContent></Card>}
function Summary({icon:Icon,label,value}:{icon:React.ElementType;label:string;value:string}){return <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="h-5 w-5"/></div><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="truncate text-sm font-bold">{value}</p></div></CardContent></Card>}
function Metric({icon:Icon,label,value}:{icon:React.ElementType;label:string;value:string}){return <div><Icon className="mb-2 h-4 w-4 text-emerald-700"/><p className="text-[10px] text-slate-400">{label}</p><p className="font-bold">{value}</p></div>}
function DataNotice(){return <section className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><Database className="h-5 w-5 shrink-0 text-emerald-700"/><div><p className="text-sm font-semibold">Talent pool terpisah dari Probation Monitoring</p><p className="mt-1 text-xs leading-5 text-slate-600">Scoring memakai performance tiga tahun, potential/readiness, kompetensi, assessment, sertifikasi, project, career history, aspiration, dan masa kerja. GPT memberi penjelasan dan rancangan IDP; keputusan manusia tetap wajib.</p></div></section>}

function rankCandidates(candidates:TalentDevelopmentCandidate[],target:string):Ranked[]{const tokens=tokenize(target);return candidates.map(c=>{const t=c.track;const corpus=tokenize(`${c.currentPosition} ${c.department} ${t.aspiration} ${(t.technical??[]).join(" ")} ${(t.projects??[]).join(" ")}`);const matches=tokens.filter(x=>corpus.includes(x)).length;const aspiration=tokenize(t.aspiration??"").some(x=>tokens.includes(x))?18:0;const leadership=/manager|superintendent|supervisor|lead|head/i.test(target)?Math.max(0,((t.assessment?.leadership??60)-60)*.45):0;const roleRelevance=Math.min(100,Math.round((tokens.length?matches/tokens.length:0)*72+aspiration+leadership));const perf=t.performance??[];const performanceScore=perf.length?Math.round(perf.reduce((a,b)=>a+b,0)/perf.length):60;const experienceScore=Math.min(100,Math.round(c.yearsOfService*8));const potential=t.potential??60,ready=t.readiness??60,technical=Math.min(100,(t.technical?.length??0)*16);const matchScore=Math.round(roleRelevance*.28+technical*.18+performanceScore*.18+potential*.14+ready*.14+experienceScore*.08);const dataConfidence=Math.min(100,Math.round(c.dataSignals/10*100));const readiness=matchScore>=80?"Ready now":matchScore>=65?"Ready with development":"Long-term pipeline";const readinessTone=matchScore>=80?"bg-emerald-100 text-emerald-800":matchScore>=65?"bg-amber-100 text-amber-800":"bg-slate-100 text-slate-600";const strengths=[performanceScore>=88?`Performance konsisten (${performanceScore})`:null,potential>=88?`Potential tinggi (${potential})`:null,roleRelevance>=70?"Track record relevan":null].filter(Boolean) as string[];const gaps=[roleRelevance<70?`Exposure langsung ke role ${target}`:null,ready<82?"Readiness perlu divalidasi melalui panel":null,experienceScore<70?"Pengalaman pada scope lebih besar":null].filter(Boolean) as string[];const developmentFocus=[gaps[0]??`Stretch assignment ${target}`,"Mentoring oleh role incumbent","Business impact project dengan outcome terukur"];return{...c,matchScore,dataConfidence,roleRelevance,performanceScore,experienceScore,readiness,readinessTone,strengths,gaps,developmentFocus}}).sort((a,b)=>b.matchScore-a.matchScore||b.dataConfidence-a.dataConfidence)}
function tokenize(value:string){return Array.from(new Set(value.toLocaleLowerCase("id-ID").split(/[^a-z0-9]+/).filter(x=>x.length>2)))}

function normalizeAiResult(payload: AiResult): AiResult {
  if (!payload.candidates) return payload;
  return {
    ...payload,
    candidates: payload.candidates.map((candidate) => ({
      ...candidate,
      skillGaps: candidate.skillGaps ?? [],
      idpActivities: candidate.idpActivities ?? [],
      gaps: (candidate.skillGaps ?? []).map((item) => `${item.skill}: ${item.gap}`),
      idp: (candidate.idpActivities ?? []).slice(0, 3).map((item) => `${item.action} Ukuran keberhasilan: ${item.successMetric}`),
    })),
  };
}

function SkillGapAnalysis({ candidate }: { candidate: AiCandidate }) {
  const categoryLabel: Record<IdpActivity["category"], string> = {
    "70_EXPERIENCE": "70% Experience",
    "20_SOCIAL": "20% Coaching",
    "10_FORMAL": "10% Formal learning",
  };
  const priorityTone = { HIGH: "bg-red-100 text-red-700", MEDIUM: "bg-amber-100 text-amber-700", LOW: "bg-slate-100 text-slate-600" };

  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">AI Skill Gap & IDP Analysis</p>
      <p className="mt-1 text-sm text-slate-300">Detail kandidat yang sedang dipilih · requirement target yang belum tersedia dianggap sebagai inferensi role dan wajib divalidasi HR.</p>
    </div>
    <div className="space-y-6 p-5">
      <div>
        <h4 className="text-sm font-bold text-slate-950">Skill Gap Analysis</h4>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {candidate.skillGaps.map((gap) => <div key={`${gap.skill}-${gap.priority}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3"><p className="font-bold text-slate-900">{gap.skill}</p><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${priorityTone[gap.priority]}`}>{gap.priority}</span></div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><p className="text-slate-400">Level saat ini</p><p className="mt-1 font-semibold text-slate-700">{gap.currentLevel}</p></div><div><p className="text-slate-400">Target posisi</p><p className="mt-1 font-semibold text-slate-700">{gap.targetLevel}</p></div></div>
            <p className="mt-3 text-xs leading-5 text-amber-800"><span className="font-bold">Gap:</span> {gap.gap}</p>
            <p className="mt-2 text-[11px] leading-5 text-slate-500"><span className="font-semibold">Evidence:</span> {gap.evidence}</p>
          </div>)}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-950">IDP untuk menutup gap</h4>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {candidate.idpActivities.map((activity, index) => <div key={`${activity.title}-${index}`} className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
            <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-700">{categoryLabel[activity.category]}</span>
            <p className="mt-3 font-bold text-slate-900">{activity.title}</p><p className="mt-2 text-xs leading-5 text-slate-600">{activity.action}</p>
            <dl className="mt-3 space-y-2 border-t border-violet-100 pt-3 text-[11px]"><div><dt className="text-slate-400">Menutup gap</dt><dd className="font-semibold text-slate-700">{activity.closesSkillGap}</dd></div><div className="grid grid-cols-2 gap-2"><div><dt className="text-slate-400">Owner</dt><dd className="font-semibold text-slate-700">{activity.owner}</dd></div><div><dt className="text-slate-400">Periode</dt><dd className="font-semibold text-slate-700">{activity.period}</dd></div></div><div><dt className="text-slate-400">Ukuran keberhasilan</dt><dd className="font-semibold text-emerald-800">{activity.successMetric}</dd></div></dl>
          </div>)}
        </div>
      </div>
    </div>
  </section>;
}
