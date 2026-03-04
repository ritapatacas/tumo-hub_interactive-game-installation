const colors = {
  // Base neutra clara (para Soft UI / Neumorphism)
  bg: "#e6e7eb",
  text: "#0b0f14",
  muted: "rgba(11, 15, 20, 0.62)",
  surface: "rgba(255, 255, 255, 0.58)",
  border: "rgba(11, 15, 20, 0.10)",
  primary: "rgba(11, 15, 20, 0.06)",
  danger: "#c22926",       /* red: background de elementos danger */
  dangerText: "#fcfdf6",   /* white: texto em elementos danger */
  inputBg: "rgba(255, 255, 255, 0.65)",
  thumbBg: "rgba(11, 15, 20, 0.04)",
  optionBg: "rgba(255, 255, 255, 0.60)",
  soundTrackBg: "rgba(11, 15, 20, 0.06)",
  quizzOptionsBg: "rgba(255, 255, 255, 0.55)",
  red: "#c22926",
  white: "#fcfdf6",
  blue: "#0854ac",
  yellow: "#e8c21a",
};

export const theme = {
  colors,
  text: {
    titleSize: "clamp(24px, 3vw, 42px)",
    bodySize: "clamp(14px, 1.4vw, 18px)",
  },
  radius: {
    md: "16px",
  },
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",

  // Quiz: aparência da pergunta e de cada opção (ids: quiz-question, quiz-option-0, ...)
  quiz: {
    question: {
      color: colors.text,
      fontSize: "18px",
    },
    options: [
      { color: colors.red },
      { color: colors.white },
      { color: colors.blue },
      { color: colors.yellow },
    ],
    // aspect: fundo das opções e espaçamento entre título, pergunta e opções
    aspect: {
      optionsBg: colors.quizzOptionsBg,
      afterTitle: "16px",    // entre o título do ecrã ("Quiz") e o card da pergunta
      afterQuestion: "18px", // entre o texto da pergunta e a lista de opções
      betweenOptions: "10px", // entre cada opção (botões)
    },
  },
};
