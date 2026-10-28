import React, { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Button, HelperText, Text } from "react-native-paper";
import { StyleSheet, useWindowDimensions } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { router } from "expo-router";
import { signUpUser } from "../../services/auth";
import { ensureUserProfile } from "../../services/userProfile";
import { useAppTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function SignUp() {
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();
  const { updateProfile } = useUser();
  const [loading, setLoading] = React.useState(false);
  const [signUpError, setSignUpError] = React.useState<string | null>(null);

  const isSmallScreen = width < 375;

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitted },
  } = useForm<FormData>({
    defaultValues: { email: "", password: "" },
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: FormData) => {
    setSignUpError(null);
    setLoading(true);
    try {
      const user = await signUpUser(data.email, data.password, {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
      });

      try {
        await ensureUserProfile(user, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        });
      } catch (profileError) {
        // Authentication succeeded; the provider retries profile creation on
        // launch, resume, and reconnect instead of trapping the user here.
        console.warn("Profile setup will retry:", {
          name: profileError instanceof Error ? profileError.name : typeof profileError,
        });
      }

      // Update UserContext with profile data
      updateProfile({
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
      });

      router.replace("/(tabs)/home");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Sign up error:", error.message);
      } else {
        console.error("Sign up error:", error);
      }
      const code = (error as { code?: string })?.code || "";
      if (code === "auth/email-already-in-use") {
        setSignUpError("An account with this email already exists.");
      } else if (code === "auth/weak-password") {
        setSignUpError("Password should be at least 6 characters.");
      } else if (code === "auth/invalid-email") {
        setSignUpError("Please enter a valid email address.");
      } else if (error instanceof Error) {
        setSignUpError(error.message);
      } else {
        setSignUpError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = useMemo(() => ({
    title: {
      fontSize: isSmallScreen ? 24 : 30,
      marginBottom: isSmallScreen ? 40 : 60,
    },
    button: {
      paddingVertical:   isSmallScreen ? 5 : 7,
      paddingHorizontal: isSmallScreen ? 5 : 7,
      marginBottom:      isSmallScreen ? 10 : 15,
    },
    signInText: {
      fontSize: isSmallScreen ? 14 : 16,
      marginTop: isSmallScreen ? 30 : 40,
    },
  }), [isSmallScreen]);

  return (
    <SafeAreaView style={styles.container}>
      <>
        {/* ── Title ── */}
        <Text style={[styles.title, dynamicStyles.title, { color: theme.colors.onBackground }]}>
          Create Your Account
        </Text>

        {/* ── First name ── */}
        <Controller
          control={control}
          name="firstName"
          rules={{ required: "First name is required" }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                label="First Name"
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

        {/* ── Last name ── */}
        <Controller
          control={control}
          name="lastName"
          rules={{ required: "Last name is required" }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                label="Last Name"
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

        {/* ── Email ── */}
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

        {/* ── Password ── */}
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

        {/* ── Confirm password ── */}
        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: "Confirm password is required",
            validate:  (value) =>
              value === passwordValue || "Passwords do not match",
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                label="Confirm Password"
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

        {/* ── Sign up error ── */}
        <HelperText type="error" visible={!!signUpError}>
          {signUpError}
        </HelperText>

        {/* ── Sign up button ── */}
        <Button
          mode="contained"
          loading={loading}
          disabled={loading}
          style={[styles.button, dynamicStyles.button]}
          onPress={handleSubmit(onSubmit)}
        >
          Sign Up
        </Button>

        {/* ── Sign in link ── */}
        <Text style={[styles.signInText, dynamicStyles.signInText, { color: theme.colors.textMuted }]}>
          Already have an account?{" "}
          <Text
            onPress={() => router.push("/(auth)/signIn")}
            style={{ color: theme.colors.primary, fontWeight: "bold" }}
            accessibilityRole="link"
            accessibilityLabel="Go to sign in"
          >
            Sign In
          </Text>
        </Text>
      </>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },
  title: {
    fontWeight:   "bold",
    textAlign:    "center",
  },
  button: {
    width:             "100%",
    marginTop:         "auto",
    maxWidth:          400,
  },
  signInText: {
    textAlign:  "center",
    fontWeight: "bold",
  },
});
