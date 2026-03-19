import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Button, HelperText, Text } from "react-native-paper";
import { StyleSheet, useWindowDimensions, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  signInWithEmailAndPassword,
  signInWithCredential,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { auth, db } from "../../services/firebase";
import { useAppTheme } from "../../context/ThemeContext";

WebBrowser.maybeCompleteAuthSession();

type FormData = {
  email:    string;
  password: string;
};

const styles = StyleSheet.create({
  container: {
    flex:           1,
    justifyContent: "center",
    padding:        30,
  },
});

export default function SignIn() {
  const { width }     = useWindowDimensions();
  const { theme }     = useAppTheme();
  const isSmallScreen = width < 375;

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError,   setGoogleError]   = useState<string | null>(null);

  // ── Google OAuth request ──────────────────────────────────────────────────
  // Using webClientId for all platforms during Expo Go development.
  // For production builds, replace androidClientId and iosClientId
  // with their real values from Firebase Console → Project Settings → Your apps.
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:     process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // ── Handle native Google response ────────────────────────────────────────
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential   = GoogleAuthProvider.credential(id_token);

      setGoogleLoading(true);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const user    = userCredential.user;
          const docRef  = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          // Create Firestore profile on first Google sign-in
          if (!docSnap.exists()) {
            await setDoc(docRef, {
              firstName: user.displayName?.split(" ")[0] ?? "",
              lastName:  user.displayName?.split(" ").slice(1).join(" ") ?? "",
              email:     user.email,
              photoURL:  user.photoURL,
              createdAt: new Date(),
            });
          }
          router.push("/(tabs)/home");
        })
        .catch((err: Error) => setGoogleError(err.message))
        .finally(() => setGoogleLoading(false));

    } else if (response?.type === "error") {
      setGoogleError(response.error?.message ?? "Google sign-in failed");
    }
  }, [response]);

  // ── Google button press ───────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setGoogleError(null);
    try {
      if (Platform.OS === "web") {
        // Web: use Firebase popup directly
        setGoogleLoading(true);
        const provider = new GoogleAuthProvider();
        const result   = await signInWithPopup(auth, provider);
        const user     = result.user;
        const docRef   = doc(db, "users", user.uid);
        const docSnap  = await getDoc(docRef);

        if (!docSnap.exists()) {
          await setDoc(docRef, {
            firstName: user.displayName?.split(" ")[0] ?? "",
            lastName:  user.displayName?.split(" ").slice(1).join(" ") ?? "",
            email:     user.email,
            photoURL:  user.photoURL,
            createdAt: new Date(),
          });
        }
        router.push("/(tabs)/home");
      } else {
        // Native / Expo Go: open browser redirect
        await promptAsync();
      }
    } catch (err: unknown) {
      setGoogleError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Email / password form ─────────────────────────────────────────────────
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
      const user           = userCredential.user;
      const docRef         = doc(db, "users", user.uid);
      const docSnap        = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("User profile:", docSnap.data());
      }
      router.push("/(tabs)/home");
    } catch (error: unknown) {
      console.error("Login error:", error instanceof Error ? error.message : error);
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
          loading={googleLoading}
          disabled={googleLoading || (!request && Platform.OS !== "web")}
          icon={() => (
            <FontAwesome name="google" size={24} color={theme.colors.primary} />
          )}
          onPress={handleGoogleSignIn}
        >
          Continue with Google
        </Button>

        {/* ── Google error ── */}
        <HelperText type="error" visible={!!googleError}>
          {googleError}
        </HelperText>

        {/* ── Divider ── */}
        <Text style={{
          fontSize:     isSmallScreen ? 14 : 16,
          color:        theme.colors.textMuted,
          textAlign:    "center",
          fontWeight:   "bold",
          marginTop:    10,
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
            required:  "Password is required",
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
          onPress={() => router.push("/(auth)/forgotPassword")}
          style={{
            color:      theme.colors.textMuted,
            fontWeight: "600",
            textAlign:  "center",
            marginTop:  5,
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