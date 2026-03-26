import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SectionList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "../context/ThemeContext";
import { useTasks } from "../context/TasksContext";
import {
  getTemplates,
  deleteTemplate,
  TaskTemplate,
} from "../services/templateStorage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Starter templates (hardcoded) ───────────────────────────────────────────

const STARTER_TEMPLATES: TaskTemplate[] = [
  {
    id: "starter_weekly_review",
    title: "Weekly Review",
    category: "Productivity",
    icon: "📋",
    iconBg: "#E8E4FF",
    createdAt: "",
    subtasks: [
      { id: "s1", text: "Review last week's goals", isAdding: true, isGenarated: false, isDone: false },
      { id: "s2", text: "Check on open tasks and projects", isAdding: true, isGenarated: false, isDone: false },
      { id: "s3", text: "Plan this week's top 3 priorities", isAdding: true, isGenarated: false, isDone: false },
      { id: "s4", text: "Clear inbox and notifications", isAdding: true, isGenarated: false, isDone: false },
      { id: "s5", text: "Schedule any key meetings or blocks", isAdding: true, isGenarated: false, isDone: false },
    ],
  },
  {
    id: "starter_grocery_run",
    title: "Grocery Run",
    category: "Errands",
    icon: "🛒",
    iconBg: "#DCFCE7",
    createdAt: "",
    subtasks: [
      { id: "g1", text: "Check what's running low at home", isAdding: true, isGenarated: false, isDone: false },
      { id: "g2", text: "Write shopping list", isAdding: true, isGenarated: false, isDone: false },
      { id: "g3", text: "Check store hours and plan route", isAdding: true, isGenarated: false, isDone: false },
      { id: "g4", text: "Shop and check off list", isAdding: true, isGenarated: false, isDone: false },
      { id: "g5", text: "Unpack and store groceries", isAdding: true, isGenarated: false, isDone: false },
    ],
  },
  {
    id: "starter_deep_work",
    title: "Deep Work Block",
    category: "Focus",
    icon: "🧠",
    iconBg: "#FEF9C3",
    createdAt: "",
    subtasks: [
      { id: "d1", text: "Close all non-essential tabs and apps", isAdding: true, isGenarated: false, isDone: false },
      { id: "d2", text: "Set phone to Do Not Disturb", isAdding: true, isGenarated: false, isDone: false },
      { id: "d3", text: "Write down the single goal for this block", isAdding: true, isGenarated: false, isDone: false },
      { id: "d4", text: "Work uninterrupted for 90 minutes", isAdding: true, isGenarated: false, isDone: false, durationMinutes: 90 },
      { id: "d5", text: "Do a quick review — what did I accomplish?", isAdding: true, isGenarated: false, isDone: false },
    ],
  },
];

// ─── Template card ────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: TaskTemplate;
  isStarter?: boolean;
  onUse: (template: TaskTemplate) => void;
  onDelete?: (templateId: string) => void;
  theme: any;
}

function TemplateCard({
  template,
  isStarter,
  onUse,
  onDelete,
  theme,
}: TemplateCardProps) {
  const subtaskCount = template.subtasks.length;

  return (
    <TouchableOpacity
      style={[cardStyles.card, { backgroundColor: theme.colors.surface }]}
      onPress={() => onUse(template)}
      activeOpacity={0.85}
    >
      {/* Icon + title */}
      <View style={cardStyles.topRow}>
        <View style={[cardStyles.iconWrap, { backgroundColor: template.iconBg }]}>
          <Text style={cardStyles.iconEmoji}>{template.icon}</Text>
        </View>
        <View style={cardStyles.titleWrap}>
          <Text style={[cardStyles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {template.title}
          </Text>
          <View style={cardStyles.metaRow}>
            <View
              style={[
                cardStyles.categoryBadge,
                { backgroundColor: theme.colors.primary + "18" },
              ]}
            >
              <Text style={[cardStyles.categoryText, { color: theme.colors.primary }]}>
                {template.category}
              </Text>
            </View>
            {isStarter && (
              <View style={[cardStyles.starterBadge, { backgroundColor: "#fef9c3" }]}>
                <Text style={[cardStyles.starterText, { color: "#ca8a04" }]}>
                  Starter
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={cardStyles.actions}>
          {!isStarter && onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(template.id)}
              hitSlop={10}
              style={cardStyles.deleteBtn}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={theme.colors.error ?? "#ef4444"}
              />
            </TouchableOpacity>
          )}
          <View style={[cardStyles.useBtn, { backgroundColor: theme.colors.primary }]}>
            <Text style={cardStyles.useBtnText}>Use</Text>
          </View>
        </View>
      </View>

      {/* Subtask preview */}
      {subtaskCount > 0 && (
        <View style={[cardStyles.subtaskPreview, { borderTopColor: theme.colors.background }]}>
          {template.subtasks.slice(0, 2).map((st, i) => (
            <View key={st.id} style={cardStyles.subtaskRow}>
              <Ionicons
                name="ellipse"
                size={5}
                color={theme.colors.onSurfaceVariant}
                style={{ marginTop: 2 }}
              />
              <Text
                style={[cardStyles.subtaskText, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {st.text}
              </Text>
            </View>
          ))}
          {subtaskCount > 2 && (
            <Text style={[cardStyles.moreText, { color: theme.colors.onSurfaceVariant }]}>
              +{subtaskCount - 2} more steps
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 10,
    boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.07)',
    elevation: 2,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: { fontSize: 22 },
  titleWrap: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  starterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  starterText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  useBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  useBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  subtaskPreview: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 5,
  },
  subtaskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  subtaskText: {
    fontSize: 13,
    flex: 1,
  },
  moreText: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: "italic",
  },
});

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, count, theme }: { title: string; count: number; theme: any }) {
  return (
    <View style={sectionStyles.row}>
      <Text style={[sectionStyles.title, { color: theme.colors.onBackground }]}>{title}</Text>
      <View style={[sectionStyles.badge, { backgroundColor: theme.colors.surface }]}>
        <Text style={[sectionStyles.badgeText, { color: theme.colors.onSurfaceVariant }]}>
          {count}
        </Text>
      </View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TemplatesScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { userId } = useTasks();

  const [myTemplates, setMyTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getTemplates(userId);
    setMyTemplates(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Navigate to AddTaskScreen with template data pre-filled
  const handleUseTemplate = (template: TaskTemplate) => {
    router.push({
      pathname: "/add-task",
      params: {
        templateId:    template.id,
        templateTitle: template.title,
        templateCategory: template.category,
        templateIcon:  template.icon,
        templateIconBg: template.iconBg,
        // Pass subtasks as JSON string — AddTaskScreen will parse it
        templateSubtasks: JSON.stringify(template.subtasks),
      },
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    Alert.alert(
      "Delete Template",
      "Are you sure you want to delete this template?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!userId) return;
            await deleteTemplate(userId, templateId);
            setMyTemplates((prev) => prev.filter((t) => t.id !== templateId));
          },
        },
      ]
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.title}>Templates</Text>
        <TouchableOpacity onPress={loadTemplates} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <>
              {/* My Templates */}
              <SectionHeader
                title="My Templates"
                count={myTemplates.length}
                theme={theme}
              />

              {myTemplates.length === 0 ? (
                <View style={styles.emptySection}>
                  <Ionicons
                    name="bookmark-outline"
                    size={36}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    No saved templates yet
                  </Text>
                  <Text style={[styles.emptySub, { color: theme.colors.onSurfaceVariant }]}>
                    Add subtasks to a task and tap "Save as Template" to create one.
                  </Text>
                </View>
              ) : (
                <View style={styles.cardList}>
                  {myTemplates.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      onUse={handleUseTemplate}
                      onDelete={handleDeleteTemplate}
                      theme={theme}
                    />
                  ))}
                </View>
              )}

              {/* Starter Templates */}
              <SectionHeader
                title="Starter Templates"
                count={STARTER_TEMPLATES.length}
                theme={theme}
              />

              <View style={styles.cardList}>
                {STARTER_TEMPLATES.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    isStarter
                    onUse={handleUseTemplate}
                    theme={theme}
                  />
                ))}
              </View>
            </>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyExtractor={() => "header"}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
      position: "relative",
    },
    backBtn: {
      position: "absolute",
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
      boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.08)',
      elevation: 2,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    refreshBtn: {
      position: "absolute",
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    listContent: {
      paddingBottom: 48,
    },
    cardList: {
      paddingHorizontal: 20,
    },
    emptySection: {
      alignItems: "center",
      paddingVertical: 24,
      paddingHorizontal: 40,
      gap: 8,
    },
    emptyText: {
      fontSize: 15,
      fontWeight: "600",
      textAlign: "center",
    },
    emptySub: {
      fontSize: 13,
      textAlign: "center",
      lineHeight: 18,
    },
  });