import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

export default function Loader() {
  const dots = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    Animated.parallel([
      createBounce(dots[0], 0),
      createBounce(dots[1], 150),
      createBounce(dots[2], 300),
    ]).start();
  }, [dots]);

  return (
    <View style={styles.container}>
      <View style={styles.textRow}>
        <Text style={styles.text}>Processing</Text>

        {dots.map((dot, index) => (
          <Animated.Text
            key={index}
            style={[
              styles.text,
              { transform: [{ translateY: dot }] },
            ]}
          >
            .
          </Animated.Text>
        ))}
      </View>
    </View>
  );
}

function createBounce(anim: Animated.Value, delay: number) {
  return Animated.loop(
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, {
        toValue: -6,
        duration: 170,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 0,
        duration: 170,
        useNativeDriver: true,
      }),
    ])
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textRow: {
    flexDirection: "row",
    marginBottom: 120,
  },
  text: {
    fontSize: 23,
    fontWeight: "500",
    color: "#555",
  },
});
