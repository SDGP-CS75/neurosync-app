/**
 * app/components/ThemePicker.tsx
 * ─────────────────────────────────────────────────────────────────
 * Drop into any settings screen to let users choose color themes.
 */

import React from "react";
import { View, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "../context/ThemeContext";

export default function ThemePicker() {
  const { width } = useWindowDimensions();
  const { palette, allPalettes, setPalette, theme } = useAppTheme();

  const isSmallScreen = width < 375;
  const swatchSize    = isSmallScreen ? 40 : 48;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>
        App Colour Theme
      </Text>

      <View style={styles.row}>
        {allPalettes.map((p) => {
          const isSelected = p.name === palette.name;
          return (
            <TouchableOpacity
              key={p.name}
              onPress={() => setPalette(p)}
              activeOpacity={0.8}
              style={[
                styles.swatchWrapper,
                {
                  width:        swatchSize,
                  height:       swatchSize,
                  borderRadius: swatchSize / 2,
                  borderColor:  isSelected ? theme.colors.primary : "transparent",
                },
              ]}
            >
              <View
                style={[
                  styles.swatch,
                  {
                    width:           swatchSize - 6,
                    height:          swatchSize - 6,
                    borderRadius:    (swatchSize - 6) / 2,
                    backgroundColor: p.primary,
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.paletteName, { color: theme.colors.primary }]}>
        {palette.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 16,
  },
  label: {
    fontSize:     14,
    fontWeight:   "600",
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  row: {
    flexDirection:  "row",
    flexWrap:       "wrap",
    justifyContent: "center",
    gap:            10,
  },
  swatchWrapper: {
    borderWidth:  3,
    alignItems:   "center",
    justifyContent:"center",
  },
  swatch: {
    // set inline
  },
  paletteName: {
    marginTop:  12,
    fontSize:   15,
    fontWeight: "700",
  },
});