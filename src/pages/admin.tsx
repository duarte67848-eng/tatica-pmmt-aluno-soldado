import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Question, User, Result, Pdf, TabType } from "../lib/adminTypes";
import { c, card } from "../styles/admin";
import AdminLogin from "../components/admin/AdminLogin";
import QuestionsTab from "../components/admin/QuestionsTab";
import UsersTab from "../components/admin/UsersTab";
import ResultsTab from "../components/admin/ResultsTab";
import BibliotecaTab from "../components/admin/BibliotecaTab";
import RelatorioTab from "../components/admin/RelatorioTab";

export default function Admin() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("questionsSimulado");
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  async function handleLogin() {
    try {
      const res = await fetch("/api/check-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword })
      });
      const data = await res.json();
      if (data.valid) setIsAuthorized(true);
      else alert("Senha incorreta ou variável ADMIN_PASSWORD não configurada no Vercel.");
    } catch (e) {
      alert("Erro ao conectar com o servidor. Verifique se o deploy foi concluído.");
    }
  }

  function showTab(tab: TabType): boolean {
    return activeTab === tab;
  }

  useEffect(() => {
    async function loadData() {
      const { data: q } = await supabase.from("questao").select("*");
      if (q) setQuestions(q as Question[]);

      const { data: allUsers } = await supabase.from("usuario").select("*").order("criado_em", { ascending: false });
      if (allUsers) {
        setUsers(allUsers.filter(u => u.aprovado) as User[]);
        setBlockedUsers(allUsers.filter(u => !u.aprovado) as User[]);
      }

      const { data: r } = await supabase.from("resultado").select("*").order("criado_em", { ascending: false });
      if (r) setResults(r as Result[]);

      setLoading(false);
    }

    async function loadPdfs() {
      const { data } = await supabase.from("biblioteca").select("*").order("created_at", { ascending: false });
      if (data) setPdfs(data as Pdf[]);
    }

    loadData();
    loadPdfs();
  }, []);

  if (!isAuthorized) {
    return <AdminLogin password={adminPassword} onPasswordChange={setAdminPassword} onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div style={{ color: c.gold, fontSize: "1.25rem" }}>CARREGANDO...</div>
      </div>
    );
  }

  const approvedUsers = users.filter(u => u.aprovado).length;
  const pendingUsers = blockedUsers.filter(u => !u.aprovado).length;
  const avgPF = results.length > 0 ? (results.reduce((acc, r) => acc + r.pf, 0) / results.length).toFixed(2) : "0.00";
  const totalQuestions = questions.length;
  const simulationQuestions = questions.filter(q => q.tipo === "simulado").length;
  const exerciseQuestions = questions.filter(q => q.tipo === "exercicio").length;

  const tabBtn = (tab: TabType, label: string, count?: number) => (
    <button onClick={() => setActiveTab(tab)}
      style={{ padding: "12px 24px", background: activeTab === tab ? c.gold : c.backgroundSecondary, color: activeTab === tab ? "#000" : c.text, border: `1px solid ${c.border}`, borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
      {label}{count !== undefined ? ` (${count})` : ""}
    </button>
  );

  function QuestionList({ filtro }: { filtro: (q: Question) => boolean }) {
    const filtered = questions.filter(filtro);
    return (
      <div style={{ ...card(), marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: c.gold, marginBottom: "1rem" }}>
          Questões ({filtered.length})
        </h2>
        {filtered.length === 0 ? (
          <div style={{ color: c.textSecondary }}>Nenhuma questão encontrada</div>
        ) : (
          <div style={{ maxHeight: "400px", overflow: "auto" }}>
            {filtered.map((q) => (
              <div key={q.id} style={{ background: c.background, border: `1px solid ${c.border}`, borderRadius: "4px", padding: "1rem", marginBottom: "0.5rem" }}>
                <div style={{ color: c.gold, fontWeight: "bold", marginBottom: "0.5rem" }}>{q.disciplina} | Peso: {q.peso}</div>
                <div style={{ color: c.text, marginBottom: "0.5rem" }}>{q.pergunta?.substring(0, 80)}...</div>
                <div style={{ color: c.green, fontSize: "0.875rem" }}>Resp: {q.resposta_correta}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const box = { background: `linear-gradient(180deg, ${c.backgroundSecondary} 0%, ${c.background} 100%)`, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem", textAlign: "center" as const };

  return (
    <div>
      <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: c.gold, marginBottom: "2rem" }}>
        PAINEL DE ADMINISTRAÇÃO
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div style={box}><div style={{ color: c.textSecondary, fontSize: "0.875rem", marginBottom: "0.5rem" }}>TOTAL ALUNOS</div><div style={{ fontSize: "2rem", fontWeight: "bold", color: c.gold }}>{users.length}</div></div>
        <div style={box}><div style={{ color: c.textSecondary, fontSize: "0.875rem", marginBottom: "0.5rem" }}>ATIVOS</div><div style={{ fontSize: "2rem", fontWeight: "bold", color: c.green }}>{approvedUsers}</div></div>
        <div style={box}><div style={{ color: c.textSecondary, fontSize: "0.875rem", marginBottom: "0.5rem" }}>PENDENTES</div><div style={{ fontSize: "2rem", fontWeight: "bold", color: c.red }}>{pendingUsers}</div></div>
        <div style={box}>
          <div style={{ color: c.textSecondary, fontSize: "0.875rem", marginBottom: "0.5rem" }}>TOTAL QUESTÕES</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: c.blue }}>{totalQuestions}</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            <span>Simulado: {simulationQuestions}</span>
            <span>Exercício: {exerciseQuestions}</span>
          </div>
        </div>
        <div style={box}><div style={{ color: c.textSecondary, fontSize: "0.875rem", marginBottom: "0.5rem" }}>SIMULADOS</div><div style={{ fontSize: "2rem", fontWeight: "bold", color: c.purple }}>{results.length}</div></div>
        <div style={box}><div style={{ color: c.textSecondary, fontSize: "0.875rem", marginBottom: "0.5rem" }}>MÉDIA PF</div><div style={{ fontSize: "2rem", fontWeight: "bold", color: c.gold }}>{avgPF}</div></div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {tabBtn("questions", "📝 TODAS QUESTÕES", totalQuestions)}
        {tabBtn("questionsSimulado", "SIMULADO", simulationQuestions)}
        {tabBtn("questionsExercicio", "EXERCÍCIOS", exerciseQuestions)}
        {tabBtn("users", "ALUNOS", users.length)}
        {tabBtn("pdfs", "BIBLIOTECA PDF", pdfs.length)}
        {tabBtn("results", "RESULTADOS", results.length)}
        {tabBtn("relatorio", "📊 RELATÓRIO")}
      </div>

      {activeTab === "questions" && <QuestionsTab questions={questions} setQuestions={setQuestions} />}
      {showTab("questionsSimulado") && <QuestionList filtro={(q: Question) => q.tipo === "simulado"} />}
      {showTab("questionsExercicio") && <QuestionList filtro={(q: Question) => q.tipo === "exercicio"} />}
      {activeTab === "users" && (
        <UsersTab users={users} setUsers={setUsers} blockedUsers={blockedUsers} setBlockedUsers={setBlockedUsers} />
      )}
      {activeTab === "results" && <ResultsTab results={results} setResults={setResults} />}
      {activeTab === "pdfs" && <BibliotecaTab pdfs={pdfs} setPdfs={setPdfs} />}
      {activeTab === "relatorio" && <RelatorioTab users={users} results={results} />}
    </div>
  );
}
