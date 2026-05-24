"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

interface LoginProps {
  colors?: any;
  isDark?: boolean;
  toggleTheme?: () => void;
}

export default function Login({ colors }: LoginProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const c = colors || {
    background: "#080808",
    backgroundSecondary: "#121212",
    backgroundTertiary: "#252525",
    text: "#f0f0f0",
    textSecondary: "#a0a0a0",
    border: "#2a2a2a",
    gold: "#d48c1e",
    goldHover: "#b8860b",
    green: "#22c55e",
    red: "#ef4444"
  };

async function handleLogin(e: React.FormEvent) {
      e.preventDefault();
      setLoading(true);
      setError("");

      if (!email || !password) {
        setError("Preencha email e senha");
        setLoading(false);
        return;
      }

      const { data: users } = await supabase
        .from("usuario")
        .select("*")
        .eq("email", email)
        .limit(1);

      if (!users || users.length === 0) {
        setError("Usuário não cadastrado. Crie uma conta primeiro.");
        setLoading(false);
        return;
      }

      const user = users[0];
      if (!user.aprovado) {
        setError("Aguarde aprovação do administrador!");
        setLoading(false);
        return;
      }

      const hash = await sha256(password);
      if (!user.senha) {
        setError("Conta sem senha. Solicite ao admin que crie uma nova conta ou redefina sua senha.");
        setLoading(false);
        return;
      }
      if (user.senha !== hash) {
        setError("Senha incorreta!");
        setLoading(false);
        return;
      }

      window.sessionStorage.setItem("tatica_user", JSON.stringify({ email: user.email, name: user.nome }));
      router.push("/dashboard");
      setLoading(false);
    }

  async function sha256(text: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function handleSignUp() {
    setLoading(true);
    setError("");

    if (!email || !password) {
      setError("Preencha email e senha");
      setLoading(false);
      return;
    }

    if (password.length < 4) {
      setError("Senha deve ter pelo menos 4 caracteres");
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase
      .from("usuario")
      .select("email")
      .eq("email", email)
      .limit(1);

    if (existing && existing.length > 0) {
      setError("Usuário já cadastrado! Aguarde aprovação.");
      setLoading(false);
      return;
    }

    const hash = await sha256(password);
    const newUser = {
      id: Date.now().toString(),
      nome: email.split("@")[0],
      email: email,
      senha: hash,
      aprovado: false,
      criado_em: new Date().toISOString()
    };

    await supabase.from("usuario").insert([newUser]);
    
    alert("Cadastro realizado! Aguarde aprovação do administrador.");
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <div style={{ 
        background: `linear-gradient(180deg, ${c.backgroundSecondary} 0%, ${c.background} 100%)`, 
        border: `1px solid ${c.border}`, 
        borderRadius: "8px", 
        padding: "2rem", 
        width: "100%", 
        maxWidth: "28rem" 
      }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: c.gold, textAlign: "center", marginBottom: "2rem" }}>
          ACESSO MILITAR
        </h1>
        
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", color: c.textSecondary, marginBottom: "0.5rem", fontSize: "0.875rem" }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ background: c.background, border: `1px solid ${c.border}`, color: c.text, padding: "12px", borderRadius: "4px", width: "100%" }}
              placeholder="seu.email@exemplo.com"
            />
          </div>
          
<div>
             <label style={{ display: "block", color: c.textSecondary, marginBottom: "0.5rem", fontSize: "0.875rem" }}>SENHA</label>
             <input
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               style={{ background: c.background, border: `1px solid ${c.border}`, color: c.text, padding: "12px", borderRadius: "4px", width: "100%" }}
               placeholder="••••••••"
             />
           </div>

          {error && (
            <div style={{ color: c.red, fontSize: "0.875rem", textAlign: "center", padding: "0.5rem", border: `1px solid ${c.red}`, borderRadius: "4px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ background: `linear-gradient(180deg, ${c.gold} 0%, ${c.goldHover} 100%)`, color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}
          >
            {loading ? "AGUARDE..." : "ENTRAR"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <button
            onClick={handleSignUp}
            disabled={loading}
            style={{ background: "transparent", color: c.textSecondary, border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
            Criar nova conta
          </button>
        </div>
      </div>
    </div>
  );
}
