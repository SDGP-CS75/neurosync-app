import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Button, HelperText, Text } from "react-native-paper";
import { StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { sendPasswordResetEmail } from "firebase/auth";
import { router } from "expo-router";
import { auth } from "../../services/firebase";
import { useAppTheme } from "../../context/ThemeContext";

type FormData = { email: string };

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 30 },
});

export default function ForgotPassword() {
  const { theme } = useAppTheme();
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { control, handleSubmit, formState: { isSubmitted } } = useForm<FormData>({
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await sendPasswordResetEmail(auth, data.email);
      setSent(true);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={{
        fontSize: 30, fontWeight: "bold",
        marginBottom: 40, textAlign: "center",
        color: theme.colors.onBackground,
      }}>
        Reset Password
      </Text>

      {sent ? (
        <Text style={{ textAlign: "center", color: theme.colors.onBackground, marginBottom: 30 }}>
          ✅ Password reset email sent! Check your inbox.
        </Text>
      ) : (
        <>
          <Controller
            control={control}
            name="email"
            rules={{ required: "Email is required" }}
            render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
              <>
                <TextInput
                  label="Email"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  error={!!fieldError && isSubmitted}
                />
                <HelperText type="error" visible={!!fieldError && isSubmitted}>
                  {fieldError?.message}
                </HelperText>
              </>
            )}
          />

          <HelperText type="error" visible={!!error}>{error}</HelperText>

          <Button
            mode="contained"
            style={{ marginTop: 10, paddingVertical: 7 }}
            onPress={handleSubmit(onSubmit)}
          >
            Send Reset Email
          </Button>
        </>
      )}

      <Text
        onPress={() => router.push("/(auth)/signIn")}
        style={{
          color: theme.colors.primary, fontWeight: "600",
          textAlign: "center", marginTop: 30,
        }}
      >
        Back to Sign In
      </Text>
    </SafeAreaView>
  );
}