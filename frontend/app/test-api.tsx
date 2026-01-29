import { View, Text } from "react-native";
import { useEffect, useState } from "react";
import { getHealth } from "../services/api";

export default function TestAPI() {
  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    getHealth()
      .then(data => setMsg(data.message))
      .catch(() => setMsg("Backend not reachable"));
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{msg}</Text>
    </View>
  );
}
