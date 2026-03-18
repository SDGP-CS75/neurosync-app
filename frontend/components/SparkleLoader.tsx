import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import LottieView from "lottie-react-native";

export default function Loader() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  const bounce = (anim: Animated.Value, delay: number) =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: -6,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );

  useEffect(() => {
    Animated.parallel([
      bounce(dots[0], 0),
      bounce(dots[1], 150),
      bounce(dots[2], 300),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        source={require("../assets/lottie/generating.json")}
        autoPlay
        loop
        style={styles.lottie}
      />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: 200,
    height: 200,
  },
  textRow: {
    flexDirection: "row",
    marginTop: 0,
    marginBottom: 120,
  },
  text: {
    fontSize: 23,
    fontWeight: "500",
    color: "#555",
  },
});
