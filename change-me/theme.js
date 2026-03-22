const colors = {
  // Base neutra clara (para Soft UI / Neumorphism)
  bg: "#e6e7eb",
  text: "#C1BBE1",
  muted: "rgba(11, 15, 20, 0.62)",
  surface: "#FFFFFF94",
  border: "rgba(11, 15, 20, 0.10)",
  primary: "rgba(11, 15, 20, 0.06)",
  danger: "#c22926",       /* red: background de elementos danger */
  dangerText: "#fcfdf6",   /* white: texto em elementos danger */
  inputBg: "rgba(255, 255, 255, 0.65)",
  thumbBg: "rgba(11, 15, 20, 0.04)",
  optionBg: "rgba(255, 255, 255, 0.60)",
  soundTrackBg: "rgba(11, 15, 20, 0.06)",
  quizzOptionsBg: "0xFFFFFF8C",
  red: "#c22926",
  white: "#fcfdf6",
  blue: "#0854ac",
  yellow: "#e8c21a",
};

export const theme = {
  colors,
  text: {
    titleSize: "80px",
    bodySize: "clamp(24px, 3.15vw, 30px)",
    /** Jersey 15 — Sarah Cadigan-Fried (Google Fonts) */
    titleFontFamily: "'Jersey 15', system-ui, sans-serif",
    bodyFontFamily: "'Jersey 15', system-ui, sans-serif",
  },
  radius: {
    md: "16px",
  },
  /** Corpo da app (inputs, botões via var(--font)) — Jersey 15 */
  fontFamily: "'Jersey 15', system-ui, sans-serif",

  // Quiz: aparência da pergunta e de cada opção (ids: quiz-question, quiz-option-0, ...)
  quiz: {
    question: {
      color: colors.text,
      fontSize: "22px",
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
      afterQuestion: "42px", // entre o texto da pergunta e a lista de opções
      betweenOptions: "10px", // entre cada opção (botões)
    },
  },
};
