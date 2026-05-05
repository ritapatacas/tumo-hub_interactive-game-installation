const colors = {
  bg: "#e6e7eb",
  text: "#C1BBE1",
  muted: "rgba(11, 15, 20, 0.62)",
  surface: "#FFFFFF94",
  border: "rgba(11, 15, 20, 0.10)",
  primary: "rgba(11, 15, 20, 0.06)",
  danger: "#c22926",
  dangerText: "#fcfdf6",
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
    titleSize: "60px",
    bodySize: "clamp(30px, 3.15vw, 30px)",
    titleFontFamily: "'Jersey 15', system-ui, sans-serif",
    bodyFontFamily: "'Jersey 15', system-ui, sans-serif",
  },
  radius: {
    md: "16px",
  },
  fontFamily: "'Jersey 15', system-ui, sans-serif",
  quiz: {
    question: {
      color: colors.text,
      fontSize: "50px",
    },
    options: [
      { color: colors.red },
      { color: colors.white },
      { color: colors.blue },
      { color: colors.yellow },
    ],
    aspect: {
      optionsBg: colors.quizzOptionsBg,
      afterTitle: "16px",
      afterQuestion: "42px",
      betweenOptions: "22px",
    },
  },
};
