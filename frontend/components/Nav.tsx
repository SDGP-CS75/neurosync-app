import * as React from "react";
import { View, StyleSheet } from "react-native";
import { BottomNavigation, FAB } from "react-native-paper";
import { router } from "expo-router";

export default function Nav() {
  const [index, setIndex] = React.useState(0);

  const routes = [
    { key: "home", title: "Home", focusedIcon: "home" },
    { key: "calendar", title: "Calendar", focusedIcon: "calendar" },
    { key: "file", title: "Focus", focusedIcon: "file-document-outline" },
    { key: "profile", title: "Profile", focusedIcon: "account" },
  ];

  const handleTabPress = (route: any) => {
    switch (route.key) {
      case "home":
        router.push("/(tabs)/home");
        break;
      case "calendar":
        router.push("/(tabs)/daily-routine");
        break;
      case "file":
        router.push("/(tabs)/focus-timer");
        break;
      case "profile":
        router.push("/(tabs)/profile");
        break;
    }
  };

  return (
    <View style={styles.container}>
      <BottomNavigation.Bar
        navigationState={{ index, routes }}
        onTabPress={({ route }) => {
          const newIndex = routes.findIndex(r => r.key === route.key);
          setIndex(newIndex);
          handleTabPress(route);
        }}
        barStyle={styles.bottomBar}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => console.log("Pressed +")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBar: {
    backgroundColor: "#EDE7F6",
    height: 75,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  fab: {
    position: "absolute",
    alignSelf: "center",
    bottom: 35,
    backgroundColor: "#7C4DFF",
  },
});
