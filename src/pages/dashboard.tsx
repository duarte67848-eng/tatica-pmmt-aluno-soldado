"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import OnboardingTour from "../components/OnboardingTour";

interface Result {
  id: number;
  email_usuario: string;
  nome_usuario: string;
  acertos: number;
  erros: number;
  pf: number;
  total_questoes: number;
  detalhes?: string;
  criado_em: string;
}

interface DetalheQuestao {
  questao_id: string;
  disciplina: string;
  resposta_usuario: string;
  resposta_correta: string;
  acertou: boolean;
}

interface DashboardProps {
  colors?: any;
  isDark?: boolean;
  toggleTheme?: () => void;
}

function formatDateTimeCuiaba(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Cuiaba",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const pastDaysOfMonth = (date.getTime() - firstDay.getTime()) / 86400000;
  return Math.ceil((pastDaysOfMonth + firstDay.getDay() + 1) / 7);
}

export default function Dashboard({ colors }: DashboardProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Result[]>([]);
  const [activeTab, setActiveTab] = useState<"resumo" | "estatisticas" | "historico" | "analise" | "ranking">("resumo");
  const [ranking, setRanking] = useState<any[]>([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const done = localStorage.getItem("tatica-onboarding-done");
      if (!done) setShowOnboarding(true);
    }
  }, []);

  const c = colors || {
    background: "#0d0d0d",
    backgroundSecondary: "#1a1a1a",
    backgroundTertiary: "#252525",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    border: "#333333",
    gold: "#ffd700",
    goldHover: "#b8860b",
    green: "#22c55e",
    red: "#ef4444",
    blue: "#3b82f6",
    purple: "#a855f7"
  };

  useEffect(() => {
    const userData = window.sessionStorage.getItem("tatica_user");
    if (!userData) {
      router.push("/login");
    } else {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      loadResults(userObj.email);
      loadRanking();
      loadUserFromDB(userObj.email);
    }
  }, [router]);

  async function loadUserFromDB(email: string) {
    const { data } = await supabase.from("usuario").select("*").eq("email", email).single();
    if (data) {
      setUser(data as any);
      sessionStorage.setItem("tatica_user", JSON.stringify(data));
    }
  }

  async function loadResults(email: string) {
    const { data } = await supabase
      .from("resultado")
      .select("*")
      .eq("email_usuario", email)
      .order("criado_em", { ascending: false });
    
    if (data) setResults(data as any);
    setLoading(false);
  }

  async function loadRanking() {
    const { data, error } = await supabase
      .from("resultado")
      .select("email_usuario, nome_usuario, pf, criado_em")
      .order("pf", { ascending: false });
    
    console.log("Ranking data:", data, "error:", error);
    
    if (data && data.length > 0) {
      const rankingMap = new Map();
      data.forEach((r: any) => {
        if (!rankingMap.has(r.email_usuario)) {
          rankingMap.set(r.email_usuario, { 
            email: r.email_usuario, 
            nome: r.nome_usuario, 
            melhorPF: r.pf, 
            simulados: 1 
          });
        } else {
          const existing = rankingMap.get(r.email_usuario);
          if (r.pf > existing.melhorPF) existing.melhorPF = r.pf;
          existing.simulados++;
        }
      });
      
      const rankingArray = Array.from(rankingMap.values())
        .sort((a: any, b: any) => b.melhorPF - a.melhorPF)
        .slice(0, 20);
      
      setRanking(rankingArray);
    }
    setRankingLoading(false);
  }

  function handleLogout() {
    window.sessionStorage.removeItem("tatica_user");
    router.push("/login");
  }

  const totalSimulados = results.length;
  const melhorPF = results.length > 0 ? Math.max(...results.map(r => r.pf)) : 0;
  const mediaPF = results.length > 0 ? (results.reduce((acc, r) => acc + r.pf, 0) / results.length) : 0;
  const ultimoPF = results.length > 0 ? results[0].pf : 0;
  const totalAcertos = results.reduce((acc, r) => acc + r.acertos, 0);
  const totalErros = results.reduce((acc, r) => acc + r.erros, 0);
  const totalQuestoes = results.reduce((acc, r) => acc + r.total_questoes, 0);
  const percentualGeral = results.length > 0 ? (results.reduce((acc, r) => acc + r.pf, 0) / results.length) : 0;

  const getBlockPerformance = () => {
    const blocks: { [key: string]: { acertos: number; total: number } } = { 
      lp: { acertos: 0, total: 0 }, 
      historia_mt: { acertos: 0, total: 0 }, 
      geografia_mt: { acertos: 0, total: 0 }, 
      fisica: { acertos: 0, total: 0 },
      matematica: { acertos: 0, total: 0 },
      quimica: { acertos: 0, total: 0 },
      rel_inter: { acertos: 0, total: 0 },
      etica_filosofia: { acertos: 0, total: 0 },
      informatica: { acertos: 0, total: 0 },
      gestao_publica: { acertos: 0, total: 0 },
      leg_basica: { acertos: 0, total: 0 }
    };
    
    results.forEach(r => {
      if (r.detalhes) {
        try {
          if (typeof r.detalhes === 'string') {
            const parsed = JSON.parse(r.detalhes);
            if (Array.isArray(parsed)) {
              parsed.forEach((d: DetalheQuestao) => {
                if (d.disciplina && blocks[d.disciplina]) {
                  blocks[d.disciplina].total++;
                  if (d.acertou) blocks[d.disciplina].acertos++;
                }
              });
            } else {
              Object.entries(parsed).forEach(([disc, stats]: [string, any]) => {
                if (blocks[disc] && stats.total > 0) {
                  blocks[disc].total += stats.total;
                  blocks[disc].acertos += stats.acertos;
                }
              });
            }
          } else {
            Object.entries(r.detalhes as any).forEach(([disc, stats]: [string, any]) => {
              if (blocks[disc] && stats.total > 0) {
                blocks[disc].total += stats.total;
                blocks[disc].acertos += stats.acertos;
              }
            });
          }
        } catch {}
      }
    });
    
    return blocks;
  };

  const blockStats = getBlockPerformance();

  const getEvolutionData = () => {
    const weekly: { [key: string]: number[] } = {};
    results.forEach(r => {
      const date = new Date(r.criado_em);
      const week = `${date.getFullYear()}-W${getWeekOfMonth(date)}`;
      if (!weekly[week]) weekly[week] = [];
      weekly[week].push(r.pf);
    });
    
    const evolution = Object.entries(weekly).map(([week, pfs]) => ({
      week,
      media: pfs.reduce((a, b) => a + b, 0) / pfs.length,
      melhor: Math.max(...pfs)
    })).reverse();
    
    return evolution;
  };

const evolution = getEvolutionData();
const tendencia = evolution.length >= 2 ? (evolution[0].media - evolution[evolution.length - 1].media).toFixed(2) : "0.00";

  const getRadarData = () => {
    return [
      { label: "L.Portuguesa", value: blockStats.lp.total > 0 ? (blockStats.lp.acertos / blockStats.lp.total) * 100 : 0 },
      { label: "História MT", value: blockStats.historia_mt.total > 0 ? (blockStats.historia_mt.acertos / blockStats.historia_mt.total) * 100 : 0 },
      { label: "Geografia MT", value: blockStats.geografia_mt.total > 0 ? (blockStats.geografia_mt.acertos / blockStats.geografia_mt.total) * 100 : 0 },
      { label: "Física", value: blockStats.fisica.total > 0 ? (blockStats.fisica.acertos / blockStats.fisica.total) * 100 : 0 },
      { label: "Matemática", value: blockStats.matematica.total > 0 ? (blockStats.matematica.acertos / blockStats.matematica.total) * 100 : 0 },
      { label: "Química", value: blockStats.quimica.total > 0 ? (blockStats.quimica.acertos / blockStats.quimica.total) * 100 : 0 },
      { label: "R.Interpessoais", value: blockStats.rel_inter.total > 0 ? (blockStats.rel_inter.acertos / blockStats.rel_inter.total) * 100 : 0 },
      { label: "Ética/Filosofia", value: blockStats.etica_filosofia.total > 0 ? (blockStats.etica_filosofia.acertos / blockStats.etica_filosofia.total) * 100 : 0 },
      { label: "Informática", value: blockStats.informatica.total > 0 ? (blockStats.informatica.acertos / blockStats.informatica.total) * 100 : 0 },
      { label: "Gestão Pública", value: blockStats.gestao_publica.total > 0 ? (blockStats.gestao_publica.acertos / blockStats.gestao_publica.total) * 100 : 0 },
      { label: "Leg.Básica", value: blockStats.leg_basica.total > 0 ? (blockStats.leg_basica.acertos / blockStats.leg_basica.total) * 100 : 0 },
    ];
  };

  const radarData = getRadarData();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div style={{ color: c.gold, fontSize: "1.25rem" }}>CARREGANDO DASHBOARD...</div>
      </div>
    );
  }

  const Card = ({ title, value, subtitle, color }: { title: string; value: string | number; subtitle?: string; color?: string }) => (
    <div style={{ 
      background: `linear-gradient(180deg, ${c.backgroundSecondary} 0%, ${c.background} 100%)`, 
      border: `1px solid ${c.border}`, 
      borderRadius: "8px", 
      padding: "1.25rem", 
      textAlign: "center" 
    }}>
      <div style={{ color: c.textSecondary, fontSize: "0.75rem", marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ fontSize: "2rem", fontWeight: "bold", color: color || c.gold }}>{value}</div>
      {subtitle && <div style={{ color: c.textSecondary, fontSize: "0.7rem", marginTop: "0.25rem" }}>{subtitle}</div>}
    </div>
  );

  const BlockBar = ({ name, acertos, total }: { name: string; acertos: number; total: number }) => {
    const pct = total > 0 ? (acertos / total) * 100 : 0;
    const barColor = pct >= 70 ? c.green : pct >= 50 ? c.gold : c.red;
    return (
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
          <span style={{ color: c.text, fontWeight: "bold" }}>{name}</span>
          <span style={{ color: barColor }}>{acertos}/{total} ({pct.toFixed(0)}%)</span>
        </div>
        <div style={{ height: "8px", background: c.backgroundTertiary, borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: "4px", transition: "width 0.3s" }} />
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: c.gold }}>
          DASHBOARD ESTRATÉGICO
        </h1>
        <button onClick={handleLogout} style={{ background: c.red, color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
          SAIR
        </button>
      </div>

      {showOnboarding && <OnboardingTour colors={c} onComplete={() => { setShowOnboarding(false); localStorage.setItem("tatica-onboarding-done", "1"); }} />}
      {user && (
        <div style={{ marginBottom: "1.5rem", padding: "1rem", background: c.backgroundSecondary, borderRadius: "8px", border: `1px solid ${c.border}` }}>
          <span style={{ color: c.textSecondary }}>Operador: </span>
          <span style={{ color: c.gold, fontWeight: "bold" }}>{user.name}</span>
          {ranking.length > 0 && (
            <span style={{ marginLeft: "1rem", color: c.textSecondary }}>
              | Ranking Geral: <span style={{ color: c.blue, fontWeight: "bold" }}>{(() => {
                const pos = ranking.findIndex((r: any) => r.email === user?.email);
                return pos >= 0 ? `#${pos + 1}` : "Fora do Top 20";
              })()}</span>
            </span>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { key: "resumo", label: "📊 Resumo" },
          { key: "estatisticas", label: "📈 Estatísticas" },
          { key: "historico", label: "📋 Histórico" },
          { key: "analise", label: "🎯 Análise" },
            { key: "ranking", label: "🏆 Ranking" }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: "10px 20px",
              background: activeTab === tab.key ? c.gold : c.backgroundTertiary,
              color: activeTab === tab.key ? "#000" : c.text,
              border: `1px solid ${c.border}`,
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "0.875rem"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "resumo" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <Card title="PF ATUAL" value={ultimoPF.toFixed(2)} subtitle="Último simulado" color={c.gold} />
            <Card title="MELHOR PF" value={melhorPF.toFixed(2)} subtitle="Recorde pessoal" color={c.green} />
            <Card title="MÉDIA PF" value={mediaPF.toFixed(2)} subtitle=" média geral" color={c.blue} />
            <Card title="SIMULADOS" value={totalSimulados} subtitle="Total realizado" color={c.purple} />
            <Card title="ACERTOS" value={totalAcertos} subtitle={`${percentualGeral.toFixed(1)}% geral`} color={c.green} />
            <Card title="ERROS" value={totalErros} subtitle="Para revisar" color={c.red} />
          </div>

          {/* RANKING GERAL */}
          {rankingLoading ? (
            <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem", textAlign: "center" }}>
              <span style={{ color: c.textSecondary }}>Carregando ranking...</span>
            </div>
          ) : ranking.length > 0 ? (
            <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem" }}>
              <h3 style={{ color: c.gold, marginBottom: "1rem", fontWeight: "bold", fontSize: "1.25rem" }}>🏆 RANKING GERAL - TOP 20</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                      <th style={{ padding: "8px", textAlign: "left", color: c.textSecondary }}>#</th>
                      <th style={{ padding: "8px", textAlign: "left", color: c.textSecondary }}>Aluno</th>
                      <th style={{ padding: "8px", textAlign: "center", color: c.textSecondary }}>Melhor PF</th>
                      <th style={{ padding: "8px", textAlign: "center", color: c.textSecondary }}>Simulados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((r, idx) => (
                      <tr key={r.email} style={{ borderBottom: `1px solid ${c.border}`, background: r.email === user?.email ? `${c.gold}20` : "transparent" }}>
                        <td style={{ padding: "8px" }}>
                          {idx === 0 && <span style={{ fontSize: "1.5rem" }}>🥇</span>}
                          {idx === 1 && <span style={{ fontSize: "1.5rem" }}>🥈</span>}
                          {idx === 2 && <span style={{ fontSize: "1.5rem" }}>🥉</span>}
                          {idx > 2 && <span style={{ color: c.textSecondary }}>{idx + 1}º</span>}
                        </td>
                        <td style={{ padding: "8px", color: c.text, fontWeight: r.email === user?.email ? "bold" : "normal" }}>
                          {r.nome || r.email}
                          {r.email === user?.email && <span style={{ color: c.gold, marginLeft: "8px" }}>(Você)</span>}
                        </td>
                        <td style={{ padding: "8px", textAlign: "center", color: c.gold, fontWeight: "bold" }}>{r.melhorPF.toFixed(2)}</td>
                        <td style={{ padding: "8px", textAlign: "center", color: c.textSecondary }}>{r.simulados}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
) : (
            <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem", textAlign: "center" }}>
              <span style={{ color: c.textSecondary }}>Nenhum resultado ainda. Faça um simulado para entrar no ranking!</span>
            </div>
          )}
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
              <h3 style={{ color: c.gold, marginBottom: "1rem", fontWeight: "bold" }}>DESEMPENHO POR BLOCO</h3>
              <BlockBar name="CLPAP (Peso 1.0)" acertos={blockStats.CLPAP.acertos} total={blockStats.CLPAP.total} />
              <BlockBar name="CPJM (Peso 1.25)" acertos={blockStats.CPJM.acertos} total={blockStats.CPJM.total} />
              <BlockBar name="CLIPM (Peso 1.75)" acertos={blockStats.CLIPM.acertos} total={blockStats.CLIPM.total} />
              <BlockBar name="CP (Peso 2.0)" acertos={blockStats.CP.acertos} total={blockStats.CP.total} />
            </div>

            <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
              <h3 style={{ color: c.gold, marginBottom: "1rem", fontWeight: "bold" }}>RADAR ESTRATÉGICO</h3>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                <div style={{ position: "relative", width: "180px", height: "180px" }}>
                  {[0, 25, 50, 75, 100].map(pct => (
                    <div key={pct} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: `${pct * 0.9}%`, height: `${pct * 0.9}%`, border: `1px dashed ${c.border}`, borderRadius: "50%", opacity: 0.5 }} />
                  ))}
                  {radarData.map((item, idx) => {
                    const angle = (idx * 90 - 90) * (Math.PI / 180);
                    const radius = (item.value / 100) * 80;
                    const x = 90 + radius * Math.cos(angle);
                    const y = 90 + radius * Math.sin(angle);
                    return (
                      <div key={idx} style={{ position: "absolute", left: `${x}px`, top: `${y}px`, width: "12px", height: "12px", borderRadius: "50%", background: c.gold, transform: "translate(-50%, -50%)" }} />
                    );
                  })}
                  <div style={{ position: "absolute", left: "50%", top: "5px", transform: "translateX(-50%)", color: c.textSecondary, fontSize: "0.7rem" }}>CLPAP</div>
                  <div style={{ position: "absolute", right: "5px", top: "50%", transform: "translateY(-50%)", color: c.textSecondary, fontSize: "0.7rem" }}>CPJM</div>
                  <div style={{ position: "absolute", left: "50%", bottom: "5px", transform: "translateX(-50%)", color: c.textSecondary, fontSize: "0.7rem" }}>CP</div>
                  <div style={{ position: "absolute", left: "5px", top: "50%", transform: "translateY(-50%)", color: c.textSecondary, fontSize: "0.7rem" }}>CLIPM</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-around", marginTop: "0.5rem" }}>
                {radarData.map(item => (
                  <div key={item.label} style={{ textAlign: "center" }}>
                    <div style={{ color: c.text, fontWeight: "bold", fontSize: "0.875rem" }}>{item.label}</div>
                    <div style={{ color: c.gold, fontSize: "0.75rem" }}>{item.value.toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ color: c.gold, marginBottom: "1rem", fontWeight: "bold" }}>EVOLUÇÃO SEMANAL</h3>
            {evolution.length > 0 ? (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "120px" }}>
                {evolution.map((e, idx) => (
                  <div key={idx} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ 
                      height: `${(e.media / 10) * 100}px`, 
                      background: `linear-gradient(180deg, ${c.gold} 0%, ${c.goldHover} 100%)`, 
                      borderRadius: "4px 4px 0 0",
                      marginBottom: "0.25rem"
                    }} />
                    <div style={{ color: c.textSecondary, fontSize: "0.6rem" }}>{e.week.replace("W", "Semana ")}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: c.textSecondary, textAlign: "center" }}>Faça mais simulados para ver evolução</div>
            )}
            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <span style={{ color: parseFloat(tendencia) >= 0 ? c.green : c.red, fontWeight: "bold" }}>
                {parseFloat(tendencia) >= 0 ? "↗" : "↘"} Tendência: {parseFloat(tendencia) > 0 ? "+" : ""}{tendencia}
              </span>
            </div>
          </div>
        </>
      )}

      {activeTab === "estatisticas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
          <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ color: c.gold, marginBottom: "1rem" }}>Taxa de Acerto</h3>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ 
                width: "120px", 
                height: "120px", 
                borderRadius: "50%", 
                background: `conic-gradient(${c.green} ${percentualGeral * 3.6}deg, ${c.backgroundTertiary} 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <div style={{ 
                  width: "90px", 
                  height: "90px", 
                  borderRadius: "50%", 
                  background: c.backgroundSecondary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column"
                }}>
                  <span style={{ color: c.gold, fontSize: "1.5rem", fontWeight: "bold" }}>{percentualGeral.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: c.green, fontSize: "1.25rem", fontWeight: "bold" }}>{totalAcertos}</div>
                <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>Acertos</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: c.red, fontSize: "1.25rem", fontWeight: "bold" }}>{totalErros}</div>
                <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>Erros</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: c.text, fontSize: "1.25rem", fontWeight: "bold" }}>{totalQuestoes}</div>
                <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>Total</div>
              </div>
            </div>
          </div>

          <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ color: c.gold, marginBottom: "1rem" }}>Heatmap de Desempenho</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
              {Object.entries(blockStats).map(([block, stats]) => {
                const pct = stats.total > 0 ? (stats.acertos / stats.total) * 100 : 0;
                const bg = pct >= 70 ? c.green : pct >= 50 ? c.gold : c.red;
                return (
                  <div key={block} style={{ 
                    padding: "1rem", 
                    background: bg, 
                    borderRadius: "4px", 
                    textAlign: "center"
                  }}>
                    <div style={{ color: "#000", fontWeight: "bold" }}>{block}</div>
                    <div style={{ color: "#000", fontSize: "0.875rem" }}>{pct.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ color: c.gold, marginBottom: "1rem" }}>Estatísticas Detalhadas</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: c.textSecondary }}>Questões Respondidas</span>
                <span style={{ color: c.text, fontWeight: "bold" }}>{totalQuestoes}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: c.textSecondary }}>Questões Acertadas</span>
                <span style={{ color: c.green, fontWeight: "bold" }}>{totalAcertos}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: c.textSecondary }}>Questões Erradas</span>
                <span style={{ color: c.red, fontWeight: "bold" }}>{totalErros}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: c.textSecondary }}>Média por Simulado</span>
                <span style={{ color: c.text, fontWeight: "bold" }}>{(totalQuestoes / totalSimulados || 0).toFixed(0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: c.textSecondary }}>Melhor Desempenho</span>
                <span style={{ color: c.green, fontWeight: "bold" }}>{melhorPF.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: c.textSecondary }}>Pior Desempenho</span>
                <span style={{ color: c.red, fontWeight: "bold" }}>{results.length > 0 ? Math.min(...results.map(r => r.pf)).toFixed(2) : "-"}</span>
              </div>
            </div>
          </div>
          </div>

          {results.length > 1 && (
            <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
              <h3 style={{ color: c.gold, marginBottom: "1rem" }}>Taxa de Acerto por Simulado</h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "120px" }}>
                {[...results].reverse().map((r, idx) => {
                  const pct = r.total_questoes > 0 ? (r.acertos / r.total_questoes) * 100 : 0;
                  return (
                    <div key={idx} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ height: `${Math.max(4, (pct / 100) * 100)}px`, background: pct >= 70 ? c.green : pct >= 50 ? c.gold : c.red, borderRadius: "4px 4px 0 0", marginBottom: "0.25rem" }} title={`${pct.toFixed(1)}%`} />
                      <div style={{ color: c.textSecondary, fontSize: "0.6rem" }}>#{idx + 1}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: "1rem", textAlign: "center", color: c.textSecondary, fontSize: "0.8rem" }}>
                Verde &ge; 70% | Amarelo &ge; 50% | Vermelho &lt; 50%
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "historico" && (
        <div>
          <h3 style={{ color: c.gold, marginBottom: "1rem" }}>Histórico Completo</h3>
          {results.length === 0 ? (
            <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "2rem", textAlign: "center", color: c.textSecondary }}>
              Nenhum simulado realizado ainda.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {results.map((r, idx) => (
                <div key={r.id} style={{ 
                  background: c.backgroundSecondary, 
                  border: `1px solid ${c.border}`, 
                  borderRadius: "8px", 
                  padding: "1rem",
                  borderLeft: idx === 0 ? `4px solid ${c.gold}` : `1px solid ${c.border}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ color: c.textSecondary, fontSize: "0.875rem" }}>
                      {formatDateTimeCuiaba(r.criado_em)}
                    </span>
                    <span style={{ color: c.gold, fontWeight: "bold", fontSize: "1.25rem" }}>
                      PF: {r.pf.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    <span style={{ color: c.green }}>
                      ✅ {r.acertos} acertos
                    </span>
                    <span style={{ color: c.red }}>
                      ❌ {r.erros} erros
                    </span>
                    <span style={{ color: c.text }}>
                      📝 {r.total_questoes} questões
                    </span>
                    <span style={{ color: c.blue }}>
                      {((r.acertos / r.total_questoes) * 100).toFixed(1)}% acerto
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "analise" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ color: c.gold, marginBottom: "1rem" }}>Estimativa de Aprovação</h3>
            <div style={{ textAlign: "center", padding: "1rem" }}>
              <div style={{ fontSize: "3rem", fontWeight: "bold", color: percentualGeral >= 60 ? c.green : percentualGeral >= 40 ? c.gold : c.red }}>
                {percentualGeral >= 70 ? "ALTO" : percentualGeral >= 50 ? "MÉDIO" : "BAIXO"}
              </div>
              <div style={{ color: c.textSecondary, marginTop: "0.5rem" }}>
                {percentualGeral >= 70 ? "Você está bem posicionado!" : percentualGeral >= 50 ? "Continue estudando!" : "Revise seus pontos fracos!"}
              </div>
              <div style={{ marginTop: "1rem", color: c.textSecondary, fontSize: "0.875rem" }}>
                Baseado no seu desempenho geral
              </div>
            </div>
          </div>

          <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ color: c.gold, marginBottom: "1rem" }}>Disciplinas Críticas</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {Object.entries(blockStats)
                .sort(([, a], [, b]) => (a.total > 0 ? a.acertos/a.total : 1) - (b.total > 0 ? b.acertos/b.total : 1))
                .map(([block, stats]) => {
                  const pct = stats.total > 0 ? (stats.acertos / stats.total) * 100 : 0;
                  const critical = pct < 50;
                  return (
                    <div key={block} style={{ 
                      padding: "0.75rem", 
                      background: critical ? `${c.red}20` : "transparent", 
                      borderRadius: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <span style={{ color: c.text, fontWeight: "bold" }}>{block}</span>
                      <span style={{ color: critical ? c.red : c.green, fontWeight: "bold" }}>
                        {stats.total > 0 ? `${pct.toFixed(0)}%` : "Sem dados"}
                        {critical && " ⚠️"}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.gold}`, borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
            <h4 style={{ color: c.gold, marginBottom: "0.5rem" }}>Direcionamento do Instrutor</h4>
            <div style={{ color: c.text, lineHeight: "1.6" }}>
              {user.direcionamento || "Nenhum direcionamento no momento."}
            </div>
          </div>

          <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
            <h4 style={{ color: c.gold, marginBottom: "1rem" }}>Recomendação Estratégica</h4>
            <div style={{ color: c.text, lineHeight: "1.6" }}>
              {totalSimulados === 0 ? (
                <p>Inicie seu primeiro simulado para receber recomendações personalizadas!</p>
              ) : (
                (() => {
                  const blocos = results[0]?.detalhes;
                  
                  // Força a conversão e garante que seja um objeto
                  let data: any = blocos;
                  if (typeof data === 'string') {
                    try { data = JSON.parse(data); } catch(e) { data = null; }
                  }
                  
                  if (!data || typeof data !== 'object') return <p>Simulado realizado! Processando mapa de desempenho...</p>;

                  // Calcula o impacto real de cada bloco na nota
                  // Pesos: CLPAP (1.0), CPJM (1.25), CLIPM (1.75), CP (2.0)
                  const pesos: Record<string, number> = { "CLPAP": 1.0, "CPJM": 1.25, "CLIPM": 1.75, "CP": 2.0 };
                  
                  const analise = Object.entries(data as any)
                    .filter(([_, d]: [string, any]) => d.total >= 3) // Mínimo de 3 questões para ser estatisticamente relevante
                    .map(([nome, d]: [string, any]) => ({ 
                      nome, 
                      taxa: (d.acertos / d.total),
                      peso: pesos[nome] || 1.0
                    }));

                  // Identifica o bloco que, se melhorado, aumenta mais a PF (baixa taxa * alto peso)
                  const pior = analise.sort((a, b) => (a.taxa * a.peso) - (b.taxa * b.peso))[0];
                  
                  if (!pior) return <p>Continue fazendo simulados para gerarmos seu mapa de desempenho!</p>;
                  
                  return <p>🎯 <strong>Foco Imediato:</strong> O bloco <strong>{pior.nome}</strong> é sua prioridade: {Math.round(pior.taxa * 100)}% de acertos. Com peso {pior.peso}, melhorar este bloco elevará sua nota significativamente.</p>;
                })()
              )}
            </div>
          </div>
        </div>
)}

        {activeTab === "ranking" && (
          <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ color: c.gold, marginBottom: "1.5rem", fontWeight: "bold", fontSize: "1.5rem" }}>🏆 RANKING GERAL</h3>
            
            {rankingLoading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: c.textSecondary }}>
                Carregando ranking...
              </div>
            ) : ranking.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: c.textSecondary }}>
                Nenhum resultado ainda. Faça um simulado para entrar no ranking!
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                      <th style={{ padding: "12px", textAlign: "center", color: c.textSecondary }}>#</th>
                      <th style={{ padding: "12px", textAlign: "left", color: c.textSecondary }}>Aluno</th>
                      <th style={{ padding: "12px", textAlign: "center", color: c.textSecondary }}>Melhor PF</th>
                      <th style={{ padding: "12px", textAlign: "center", color: c.textSecondary }}>Simulados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((r: any, idx: number) => (
                      <tr key={r.email} style={{ borderBottom: `1px solid ${c.border}`, background: r.email === user?.email ? `${c.gold}30` : "transparent" }}>
                        <td style={{ padding: "12px", textAlign: "center", fontSize: "1.25rem" }}>
                          {idx === 0 && "🥇"}
                          {idx === 1 && "🥈"}
                          {idx === 2 && "🥉"}
                          {idx > 2 && <span style={{ color: c.textSecondary }}>{idx + 1}º</span>}
                        </td>
                        <td style={{ padding: "12px", color: c.text, fontWeight: r.email === user?.email ? "bold" : "normal" }}>
                          {r.nome || r.email}
                          {r.email === user?.email && <span style={{ color: c.gold, marginLeft: "8px", fontSize: "0.875rem" }}>(Você)</span>}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", color: c.gold, fontWeight: "bold", fontSize: "1.125rem" }}>
                          {r.melhorPF.toFixed(2)}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", color: c.textSecondary }}>
                          {r.simulados}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <Link href="/simulado">
          <button style={{ 
            background: `linear-gradient(180deg, ${c.gold} 0%, ${c.goldHover} 100%)`, 
            color: "#000",
            fontWeight: "bold", 
            padding: "16px 32px", 
            borderRadius: "4px", 
            border: "none", 
            cursor: "pointer", 
            textTransform: "uppercase", 
            letterSpacing: "1px", 
            fontSize: "1.125rem"
          }}>
            🚀 INICIAR NOVO SIMULADO
          </button>
        </Link>
      </div>
    </div>
  );
}
