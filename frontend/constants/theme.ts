import { MD2DarkTheme, MD2LightTheme } from "react-native-paper";

// Button Theme Configuration
export const buttonTheme = {
  roundness: 25,
  colors: {
    primary: "#7A69AD",
    accent: "#7A69AD",
    background: "#7A69AD",
    text: "#FFFFFF",
    disabled: "#CCCCCC",
    placeholder: "#AAAAAA",
    backdrop: "#000000",
    notification: "#FF0000",
  },
};

// Card Theme Configuration
export const cardTheme = {
  roundness: 12,
  colors: {
    primary: "#FFFFFF",
    accent: "#7A69AD",
    background: "#FFFFFF",
    text: "#000000",
    disabled: "#CCCCCC",
    placeholder: "#AAAAAA",
    backdrop: "#000000",
    notification: "#FF0000",
  },
};

// Input Theme Configuration
export const inputTheme = {
  roundness: 8,
  colors: {
    primary: "#7A69AD",
    accent: "#7A69AD",
    background: "#F5F5F5",
    text: "#000000",
    disabled: "#CCCCCC",
    placeholder: "#AAAAAA",
    backdrop: "#000000",
    notification: "#FF0000",
  },
};

// Default Theme Configuration
export const theme = {
  ...MD2LightTheme,
  roundness: 8,
  colors: {
    ...MD2LightTheme.colors,
    primary: "#7A69AD",
    accent: "#7A69AD",
    background: "#e97777",
    surface: "#FFFFFF",
    text: "#3A3B47",
    disabled: "#CCCCCC",
    placeholder: "#AAAAAA",
    backdrop: "#000000",
    notification: "#FF0000",
  },
};

// Dark Theme Configuration
export const darkTheme = {
  ...MD2DarkTheme,
  roundness: 8,
  colors: {
    ...MD2DarkTheme.colors,
    primary: "#7A69AD",
    accent: "#7A69AD",
    background: "#1a1a1a",
    surface: "#2a2a2a",
    text: "#FFFFFF",
    disabled: "#666666",
    placeholder: "#888888",
    backdrop: "#000000",
    notification: "#FF0000",
  },
};
