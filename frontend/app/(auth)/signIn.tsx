import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState, useMemo } from "react";
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
import { useUser } from "../../context/UserContext";

WebBrowser.maybeCompleteAuthSession();

type FormData = {
  email:    string;
  password: string;
};

export default function SignIn() {
  const { width }     = useWindowDimensions();
  const { theme }     = useAppTheme();
  const { updateProfile } = useUser();
  const isSmallScreen = width < 375;

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError,   setGoogleError]   = useState<string | null>(null);

  // ── Google OAuth request ──────────────────────────────────────────────────
  // Using platform-specific client IDs from Firebase Console.
  // webClientId: For web platform
  // androidClientId: For Android builds (APK)
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:     process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
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
          
          // Update UserContext with profile data
          const userData = docSnap.exists() ? docSnap.data() : {
            firstName: user.displayName?.split(" ")[0] ?? "",
            lastName:  user.displayName?.split(" ").slice(1).join(" ") ?? "",
            email:     user.email,
            photoURL:  user.photoURL,
          };
          updateProfile({
            name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            email: userData.email || user.email || '',
            profileImage: userData.photoURL || '',
          });
          
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
        
        // Update UserContext with profile data
        const userData = docSnap.exists() ? docSnap.data() : {
          firstName: user.displayName?.split(" ")[0] ?? "",
          lastName:  user.displayName?.split(" ").slice(1).join(" ") ?? "",
          email:     user.email,
          photoURL:  user.photoURL,
        };
        updateProfile({
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          email: userData.email || user.email || '',
          profileImage: userData.photoURL || '',
        });
        
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
        const userData = docSnap.data();
        console.log("User profile:", userData);
        // Update UserContext with profile data
        updateProfile({
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          email: userData.email || user.email || '',
          profileImage: userData.photoURL || '',
          about: userData.about || '',
          age: userData.age || '',
        });
      } else {
        // If no profile exists, at least set email from auth
        updateProfile({
          email: user.email || '',
        });
      }
      router.push("/(tabs)/home");
    } catch (error: unknown) {
      console.error("Login error:", error instanceof Error ? error.message : error);
    }
  };

  const dynamicStyles = useMemo(() => ({
    title: {
      fontSize: isSmallScreen ? 24 : 30,
      marginBottom: isSmallScreen ? 40 : 60,
    },
    divider: {
      fontSize: isSmallScreen ? 14 : 16,
      marginTop: isSmallScreen ? 8 : 10,
      marginBottom: isSmallScreen ? 20 : 30,
    },
    button: {
      paddingVertical:   isSmallScreen ? 5 : 7,
      paddingHorizontal: isSmallScreen ? 5 : 7,
      marginBottom:      isSmallScreen ? 10 : 15,
    },
    signUpText: {
      fontSize: isSmallScreen ? 14 : 16,
      marginTop: isSmallScreen ? 30 : 40,
    },
  }), [isSmallScreen]);

  return (
    <SafeAreaView style={styles.container}>
      <>
        {/* ── Title ── */}
        <Text style={[styles.title, dynamicStyles.title, { color: theme.colors.onBackground }]}>
          Welcome Back!
        </Text>

        {/* ── Google button ── */}
        <Button
          mode="outlined"
          style={styles.googleButton}
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
        <Text style={[styles.divider, dynamicStyles.divider, { color: theme.colors.textMuted }]}>
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
          style={[styles.button, dynamicStyles.button]}
          onPress={handleSubmit(onSubmit)}
        >
          Login
        </Button>

        {/* ── Forgot password ── */}
        <Text
          onPress={() => router.push("/(auth)/forgotPassword")}
          style={[styles.forgotPassword, { color: theme.colors.textMuted }]}
        >
          Forgot Password
        </Text>

        {/* ── Sign up link ── */}
        <Text style={[styles.signUpText, dynamicStyles.signUpText, { color: theme.colors.textMuted }]}>
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

const styles = StyleSheet.create({
  container: {
    flex:           1,
    justifyContent: "center",
    padding:        30,
  },
  title: {
    fontWeight:   "bold",
    textAlign:    "center",
  },
  googleButton: {
    borderRadius: 55,
    padding: 5,
  },
  divider: {
    textAlign:    "center",
    fontWeight:   "bold",
  },
  button: {
    width:             "100%",
    marginTop:         "auto",
    maxWidth:          400,
  },
  forgotPassword: {
    fontWeight: "600",
    textAlign:  "center",
    marginTop:  5,
  },
  signUpText: {
    textAlign:  "center",
    fontWeight: "bold",
  },
});
