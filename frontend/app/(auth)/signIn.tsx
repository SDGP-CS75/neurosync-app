import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Button, HelperText, Text } from "react-native-paper";
import { StyleSheet, useWindowDimensions } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { useAppTheme } from "../../context/ThemeContext";

type FormData = {
  email: string;
  password: string;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },
});

export default function SignIn() {
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();

  const isSmallScreen = width < 375;

  const {
    control,
    handleSubmit,
    formState: { isSubmitted },
  } = useForm<FormData>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const docRef  = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("User profile:", docSnap.data());
      } else {
        console.log("No user document found!");
      }

      router.push("/(tabs)/home");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Login error:", error.message);
      } else {
        console.error("Login error:", error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <>
        {/* ── Title ── */}
        <Text style={{
          fontSize:     30,
          fontWeight:   "bold",
          marginBottom: 60,
          textAlign:    "center",
          color:        theme.colors.onBackground,
        }}>
          Welcome Back!
        </Text>

        {/* ── Google button ── */}
        <Button
          mode="outlined"
          style={{ borderRadius: 55, padding: 5 }}
          icon={() => (
            <FontAwesome name="google" size={24} color={theme.colors.primary} />
          )}
        >
          Continue with Google
        </Button>

        {/* ── Divider ── */}
        <Text style={{
          fontSize:   isSmallScreen ? 14 : 16,
          color:      theme.colors.textMuted,
          textAlign:  "center",
          fontWeight: "bold",
          marginTop:  30,
          marginBottom: 30,
        }}>
          OR LOG IN WITH EMAIL
        </Text>

        {/* ── Email field ── */}
        <Controller
          control={control}
          name="email"
          rules={{ required: "Email is required" }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                label="Email"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                error={!!error && isSubmitted}
              />
              <HelperText type="error" visible={!!error && isSubmitted}>
                {error?.message}
              </HelperText>
            </>
          )}
        />

        {/* ── Password field ── */}
        <Controller
          control={control}
          name="password"
          rules={{
            required: "Password is required",
            minLength: { value: 6, message: "Min 6 characters" },
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                label="Password"
                mode="outlined"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                error={!!error && isSubmitted}
              />
              <HelperText type="error" visible={!!error && isSubmitted}>
                {error?.message}
              </HelperText>
            </>
          )}
        />

        {/* ── Login button ── */}
        <Button
          mode="contained"
          style={{
            paddingVertical:   isSmallScreen ? 5 : 7,
            paddingHorizontal: isSmallScreen ? 5 : 7,
            width:             "100%",
            marginTop:         "auto",
            marginBottom:      isSmallScreen ? 10 : 15,
            maxWidth:          400,
          }}
          onPress={handleSubmit(onSubmit)}
        >
          Login
        </Button>

        {/* ── Forgot password ── */}
        <Text
          onPress={() => router.push("/(auth)/signUp")}
          style={{
            color:     theme.colors.textMuted,
            fontWeight: "600",
            textAlign: "center",
            marginTop: 5,
          }}
        >
          Forgot Password
        </Text>

        {/* ── Sign up link ── */}
        <Text style={{
          fontSize:   isSmallScreen ? 14 : 16,
          color:      theme.colors.textMuted,
          textAlign:  "center",
          fontWeight: "bold",
          marginTop:  40,
        }}>
          Don't have an account?{" "}
          <Text
            onPress={() => router.push("/(auth)/signUp")}
            style={{ color: theme.colors.primary, fontWeight: "bold" }}
          >
            Sign Up
          </Text>
        </Text>
      </>
    </SafeAreaView>
  );
}