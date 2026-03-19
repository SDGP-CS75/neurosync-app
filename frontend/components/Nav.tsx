/**
 * CustomNavBar.tsx
 *
 * ROOT CAUSE of "only home highlights":
 * ─────────────────────────────────────
 * expo-router's usePathname() inside a (tabs) group returns the segment
 * name WITHOUT the group prefix and sometimes without a leading slash —
 * e.g.  "home"  not  "/(tabs)/home".
 *
 * Using .includes("/home") on that string:
 *   - "home".includes("/home")  → FALSE  ← bug! home never highlights
 *   - "home".includes("/daily-routine") → FALSE
 *   ...except by coincidence sometimes it matched just home because
 *   the path happened to be "/home" with a slash on some RN versions.
 *
 * FIX:
 * ────
 * Use useSegments() which returns an array like ["(tabs)", "home"].
 * The last segment is always the exact screen name, no ambiguity.
 * Match with strict equality: segments.at(-1) === item.segment
 */

import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useSegments } from "expo-router";
import { useAppTheme } from "../context/ThemeContext";

// ─────────────────────────────────────────────────────────────────
// Responsive scale
// ─────────────────────────────────────────────────────────────────

const BASE_WIDTH = 390;

function useScale() {
  const { width } = useWindowDimensions();
  const scale = Math.min(width / BASE_WIDTH, 1.35);
  return { width, scale };
}

// ─────────────────────────────────────────────────────────────────
// SVG bar shape with notch
// ─────────────────────────────────────────────────────────────────

function buildBarPath(w: number, h: number, notchR: number): string {
  const cx    = w / 2;
  const gap   = notchR + 10;
  const curve = notchR * 0.65;
  const cR    = 20;

  return [
    `M ${cR} 0`,
    `L ${cx - gap - curve} 0`,
    `C ${cx - gap} 0 ${cx - notchR} ${notchR} ${cx} ${notchR}`,
    `C ${cx + notchR} ${notchR} ${cx + gap} 0 ${cx + gap + curve} 0`,
    `L ${w - cR} 0`,
    `Q ${w} 0 ${w} ${cR}`,
    `L ${w} ${h - cR}`,
    `Q ${w} ${h} ${w - cR} ${h}`,
    `L ${cR} ${h}`,
    `Q 0 ${h} 0 ${h - cR}`,
    `L 0 ${cR}`,
    `Q 0 0 ${cR} 0`,
    `Z`,
  ].join(" ");
}

// ─────────────────────────────────────────────────────────────────
// Nav item definitions
//
// `segment` must EXACTLY match the file name inside (tabs)/:
//   app/(tabs)/home.tsx          → segment: "home"
//   app/(tabs)/daily-routine.tsx → segment: "daily-routine"
//   app/(tabs)/focus-timer.tsx   → segment: "focus-timer"
//   app/(tabs)/profile.tsx       → segment: "profile"
// ─────────────────────────────────────────────────────────────────

type RouteKey = "home" | "calendar" | "focus" | "profile";

interface NavItem {
  key:        RouteKey;
  path:       string;
  segment:    string;   // exact file name in (tabs) folder — used for matching
  renderIcon: (size: number, color: string) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    key:     "home",
    path:    "/(tabs)/home",
    segment: "home",
    renderIcon: (size, color) => (
      <Ionicons name="home" size={size} color={color} />
    ),
  },
  {
    key:     "calendar",
    path:    "/(tabs)/todo-list",
    segment: "todo-list",
    renderIcon: (size, color) => (
      <Ionicons name="calendar" size={size} color={color} />
    ),
  },
  {
    key:     "focus",
    path:    "/(tabs)/focus-timer",
    segment: "focus-timer",
    renderIcon: (size, color) => (
      <FontAwesome5 name="crosshairs" size={size} color={color} />
    ),
  },
  {
    key:     "profile",
    path:    "/(tabs)/mood-tracking",
    segment: "mood-tracking",
    renderIcon: (size, color) => (
      <MaterialCommunityIcons name="account" size={size} color={color} />
    ),
  },
];

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────

export default function CustomNavBar() {
  const { theme }        = useAppTheme();
  const { width, scale } = useScale();
  const insets           = useSafeAreaInsets();

  // useSegments() → e.g. ["(tabs)", "daily-routine"]
  // The last element is always the exact screen name.
  const segments    = useSegments();
  const activeSegment = segments[segments.length - 1] ?? "";

  // Scaled dimensions
  const NAV_HEIGHT   = Math.round(64 * scale);
  const FAB_SIZE     = Math.round(58 * scale);
  const NOTCH_RADIUS = Math.round(34 * scale);
  const ICON_SIZE    = Math.round(22 * scale);
  const ICON_BOX     = Math.round(42 * scale);
  const H_PADDING    = Math.round(12 * scale);
  const FAB_LIFT     = Math.round(4  * scale);
  const FAB_ICON     = Math.round(28 * scale);

  const safeBottom =
    Platform.OS === "ios"
      ? insets.bottom
      : Math.max(insets.bottom, 8);

  const svgPath = buildBarPath(width, NAV_HEIGHT, NOTCH_RADIUS);

  // Theme-derived colours
  const barBg        = theme.colors.navBar;
  const activeColor  = theme.colors.primary;
  const inactiveColor= theme.colors.textMuted;
  const activeRingBg = theme.colors.primary + "1A"; // ~10% opacity

  const renderItem = (item: NavItem) => {
    // Strict equality — no more substring false-positives
    const isActive = activeSegment === item.segment;
    const color    = isActive ? activeColor : inactiveColor;

    return (
      <TouchableOpacity
        key={item.key}
        onPress={() => router.push(item.path as any)}
        style={styles.navItem}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <View
          style={[
            {
              width:          ICON_BOX,
              height:         ICON_BOX,
              borderRadius:   ICON_BOX / 2,
              alignItems:     "center",
              justifyContent: "center",
            },
            isActive && { backgroundColor: activeRingBg },
          ]}
        >
          {item.renderIcon(ICON_SIZE, color)}
        </View>
      </TouchableOpacity>
    );
  };

  const leftItems  = NAV_ITEMS.slice(0, 2);
  const rightItems = NAV_ITEMS.slice(2, 4);

  return (
    <View
      style={[styles.container, { height: NAV_HEIGHT + safeBottom }]}
      pointerEvents="box-none"
    >
      {/* ── SVG bar ── */}
      <View style={{ width, height: NAV_HEIGHT }}>
        <Svg width={width} height={NAV_HEIGHT} style={StyleSheet.absoluteFill}>
          <Path d={svgPath} fill={barBg} />
        </Svg>

        {/* ── Icon row ── */}
        <View style={[styles.row, { height: NAV_HEIGHT, paddingHorizontal: H_PADDING }]}>
          <View style={styles.side}>{leftItems.map(renderItem)}</View>
          <View style={{ width: FAB_SIZE + H_PADDING * 1.5 }} />
          <View style={styles.side}>{rightItems.map(renderItem)}</View>
        </View>
      </View>

      {/* ── Safe-area fill ── */}
      {safeBottom > 0 && (
        <View style={{ width, height: safeBottom, backgroundColor: barBg }} />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            width:        FAB_SIZE,
            height:       FAB_SIZE,
            borderRadius: FAB_SIZE / 2,
            top:          -(FAB_SIZE / 2) - FAB_LIFT,
            shadowColor:  theme.colors.primary,
          },
        ]}
        onPress={() => router.push("/(tabs)/add-task")}
        activeOpacity={0.85}
      >
        <View
          style={{
            width:           FAB_SIZE,
            height:          FAB_SIZE,
            borderRadius:    FAB_SIZE / 2,
            backgroundColor: theme.colors.primary,
            alignItems:      "center",
            justifyContent:  "center",
          }}
        >
          <Ionicons name="add" size={FAB_ICON} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Static styles
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position:       "absolute",
    bottom:         0,
    left:           0,
    right:          0,
    alignItems:     "center",
  },
  row: {
    position:       "absolute",
    top:            0,
    left:           0,
    right:          0,
    flexDirection:  "row",
    alignItems:     "center",
  },
  side: {
    flex:           1,
    flexDirection:  "row",
    justifyContent: "space-evenly",
    alignItems:     "center",
  },
  navItem: {
    alignItems:     "center",
    justifyContent: "center",
  },
  fab: {
    position:       "absolute",
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.45,
    shadowRadius:   12,
    elevation:      12,
  },
});