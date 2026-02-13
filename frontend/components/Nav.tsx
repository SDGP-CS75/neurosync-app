import * as React from "react";
import { View, StyleSheet } from "react-native";
import { BottomNavigation, FAB } from "react-native-paper";

const HomeRoute = () => <View style={styles.screen} />;
const CalendarRoute = () => <View style={styles.screen} />;
const FileRoute = () => <View style={styles.screen} />;
const ProfileRoute = () => <View style={styles.screen} />;

export default function Nav() {
  const [index, setIndex] = React.useState(0);

  const routes = [
    { key: "home", title: "Home", focusedIcon: "home" },
    { key: "calendar", title: "Calendar", focusedIcon: "calendar" },
    { key: "file", title: "File", focusedIcon: "file-document-outline" },
    { key: "profile", title: "Profile", focusedIcon: "account" },
  ];

  const renderScene = BottomNavigation.SceneMap({
    home: HomeRoute,
    calendar: CalendarRoute,
    file: FileRoute,
    profile: ProfileRoute,
  });

  return (
    <View style={styles.container}>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        barStyle={styles.bottomBar}
      />

      {/* Floating Center Button */}
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
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  bottomBar: {
    backgroundColor: "#EDE7F6",
    height: 70,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  fab: {
    position: "absolute",
    bottom: 35,
    alignSelf: "center",
    backgroundColor: "#7C4DFF",
  },
});
