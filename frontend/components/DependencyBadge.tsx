import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";

interface DependencyBadgeProps {
  blockedByTexts: string[];
  visible: boolean;
}

export default function DependencyBadge({
  blockedByTexts,
  visible,
}: DependencyBadgeProps) {
  const { theme } = useAppTheme();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!visible || blockedByTexts.length === 0) return null;

  const firstBlocker = blockedByTexts[0];
  const truncated =
    firstBlocker.length > 30
      ? firstBlocker.slice(0, 30).trim() + "…"
      : firstBlocker;

  return (
    <>
      <TouchableOpacity
        style={[s.badge, { backgroundColor: theme.colors.outline + "33" }]}
        onPress={() => setShowTooltip(true)}
        activeOpacity={0.8}
        hitSlop={8}
      >
        <Ionicons name="lock-closed" size={11} color={theme.colors.textMuted} />
        <Text style={[s.badgeText, { color: theme.colors.textMuted }]}>
          Locked — complete "{truncated}" first
        </Text>
      </TouchableOpacity>

      {/* Tooltip modal */}
      <Modal
        visible={showTooltip}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTooltip(false)}
      >
        <TouchableOpacity
          style={s.tooltipOverlay}
          activeOpacity={1}
          onPress={() => setShowTooltip(false)}
        >
          <View
            style={[
              s.tooltipBox,
              {
                backgroundColor: theme.colors.surface,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={s.tooltipHeader}>
              <Ionicons name="lock-closed" size={16} color={theme.colors.textMuted} />
              <Text style={[s.tooltipTitle, { color: theme.colors.text }]}>
                Blocked by
              </Text>
              <TouchableOpacity
                onPress={() => setShowTooltip(false)}
                hitSlop={10}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[s.tooltipSub, { color: theme.colors.textMuted }]}>
              Complete these subtasks first:
            </Text>

            {blockedByTexts.map((text, i) => (
              <View
                key={`${text}_${i}`}
                style={[
                  s.blockerRow,
                  { borderLeftColor: theme.colors.primary },
                ]}
              >
                <Ionicons
                  name="ellipse"
                  size={8}
                  color={theme.colors.primary}
                />
                <Text
                  style={[s.blockerText, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {text}
                </Text>
              </View>
            ))}

            <TouchableOpacity
              style={[s.tooltipClose, { backgroundColor: theme.colors.surfaceVariant ?? theme.colors.background }]}
              onPress={() => setShowTooltip(false)}
              activeOpacity={0.8}
            >
              <Text style={[s.tooltipCloseText, { color: theme.colors.text }]}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  tooltipBox: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 18,
    padding: 20,
    boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.15)',
    elevation: 10,
  },
  tooltipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  tooltipTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  tooltipSub: {
    fontSize: 13,
    marginBottom: 14,
  },
  blockerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    marginBottom: 10,
  },
  blockerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  tooltipClose: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  tooltipCloseText: {
    fontSize: 15,
    fontWeight: "600",
  },
});