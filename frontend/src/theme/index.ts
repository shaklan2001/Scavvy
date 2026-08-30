// Scavvy design system — cream + charcoal + orange, yellow accent.
export const colors = {
  orange: "#FF8A00",
  orangeDark: "#E5760A",
  charcoal: "#17120F",
  charcoalSoft: "#241C17",
  yellow: "#FFC107",
  cream: "#FFF6E6",
  softCream: "#FFF1D6",
  card: "#FFFFFF",
  brown: "#6F6257",
  brownSoft: "#9A8B7D",
  green: "#55A63A",
  red: "#E65A32",
  line: "#EFE2CB",
  overlay: "rgba(23,18,15,0.55)",
};

export const font = {
  regular: "Jakarta-Regular",
  medium: "Jakarta-Medium",
  semibold: "Jakarta-SemiBold",
  bold: "Jakarta-Bold",
  extrabold: "Jakarta-ExtraBold",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const shadow = {
  soft: {
    shadowColor: "#5A3A12",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
  card: {
    shadowColor: "#5A3A12",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  button: {
    shadowColor: "#C96A00",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
};

export const fontMap = {
  "Jakarta-Regular": require("../../assets/fonts/PlusJakartaSans-Regular.ttf"),
  "Jakarta-Medium": require("../../assets/fonts/PlusJakartaSans-Medium.ttf"),
  "Jakarta-SemiBold": require("../../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  "Jakarta-Bold": require("../../assets/fonts/PlusJakartaSans-Bold.ttf"),
  "Jakarta-ExtraBold": require("../../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
};
