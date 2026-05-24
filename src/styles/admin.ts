export const c = {
  background: "#080808",
  backgroundSecondary: "#121212",
  border: "#2a2a2a",
  text: "#f0f0f0",
  textSecondary: "#808080",
  gold: "#d48c1e",
  goldHover: "#a66e14",
  green: "#4a7c3f",
  red: "#b91c1c",
  blue: "#2d5a7a",
  purple: "#6b3fa8",
};

export function card() {
  return {
    background: `linear-gradient(180deg, ${c.backgroundSecondary} 0%, ${c.background} 100%)`,
    border: `1px solid ${c.border}`,
    borderRadius: "8px",
    padding: "1.5rem",
  };
}

export function input() {
  return {
    background: c.background,
    border: `1px solid ${c.border}`,
    color: c.text,
    padding: "12px",
    borderRadius: "4px",
  };
}

export function btnGold() {
  return {
    background: c.gold,
    color: "#000",
    fontWeight: "bold" as const,
    padding: "12px 24px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  };
}

export function btnBlue() {
  return {
    background: c.blue,
    color: "#fff",
    fontWeight: "bold" as const,
    padding: "12px 24px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  };
}

export function btnGreen() {
  return {
    background: c.green,
    color: "#fff",
    fontWeight: "bold" as const,
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  };
}

export function btnRed() {
  return {
    background: c.red,
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  };
}

export function btnGray() {
  return {
    background: "#6b7280",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  };
}
