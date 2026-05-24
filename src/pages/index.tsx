import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "bold", color: "#d48c1e", marginBottom: "1rem", letterSpacing: "2px" }}>
          TÁTICA CONCURSO
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
          Sistema de Simulados Militares
        </p>
        <div style={{ background: "linear-gradient(90deg, transparent, #d48c1e, transparent)", height: "2px", width: "16rem", margin: "1.5rem auto" }}></div>
        <p style={{ color: "#6b7280" }}>
          Prepare-se para a promoção e concursos militares
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem", maxWidth: "48rem", width: "100%" }}>
        <Link href="/login">
          <div style={{ background: "linear-gradient(180deg, #121212 0%, #080808 100%)", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "24px", cursor: "pointer", transition: "all 0.3s" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#d48c1e", marginBottom: "1rem" }}>
              ENTRAR
            </h2>
            <p style={{ color: "#9ca3af" }}>
              Acesse sua conta para iniciar simulados
            </p>
          </div>
        </Link>

        <Link href="/dashboard">
          <div style={{ background: "linear-gradient(180deg, #121212 0%, #080808 100%)", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "24px", cursor: "pointer", transition: "all 0.3s" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#d48c1e", marginBottom: "1rem" }}>
              DASHBOARD
            </h2>
            <p style={{ color: "#9ca3af" }}>
              Verifique seu desempenho e ranking
            </p>
          </div>
        </Link>
      </div>

      <div style={{ marginTop: "3rem", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", textAlign: "center" }}>
        <div style={{ padding: "1rem", border: "1px solid #374151", borderRadius: "4px" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#d48c1e" }}>4</div>
          <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Disciplinas</div>
        </div>
        <div style={{ padding: "1rem", border: "1px solid #374151", borderRadius: "4px" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#d48c1e" }}>10+</div>
          <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Questões</div>
        </div>
        <div style={{ padding: "1rem", border: "1px solid #374151", borderRadius: "4px" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#d48c1e" }}>PF</div>
          <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Automático</div>
        </div>
        <div style={{ padding: "1rem", border: "1px solid #374151", borderRadius: "4px" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#d48c1e" }}>🏆</div>
          <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Ranking</div>
        </div>
      </div>
    </div>
  );
}
