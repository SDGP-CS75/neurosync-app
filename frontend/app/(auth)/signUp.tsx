// keyboard bug need to fix
//terms and comdition
//duplicate emails need to implement
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Button, HelperText, Text } from "react-native-paper";
import { inputTheme, theme, buttonTheme } from "../../constants/theme";
import { Image, StyleSheet, useWindowDimensions } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { router } from "expo-router";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase'; 


type FormData = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },
});

export default function signUp() {
    const { width, height } = useWindowDimensions();
    const isSmallScreen = width < 375;
    const isMediumScreen = width >= 375 && width < 768;

    const {
        control,
        handleSubmit,
        watch,
        formState: { isSubmitted },
    } = useForm<FormData>({
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const passwordValue = watch("password"); // watch the password field
  const onSubmit = async (data: FormData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        createdAt: new Date(),
      });

      router.push('/(tabs)/profile');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Sign up error:', error.message);
      } else {
        console.error('Sign up error:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <>
        <Text
          theme={theme}
          style={{
            fontSize: 30,
            fontWeight: "bold",
            marginBottom: 60,
            textAlign: "center",
          }}
        >
          Create Your Account
        </Text>

        
       
        <Controller
          control={control}
          name="firstName"
          rules={{ required: "First name is required" }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                label="First Name"
                mode="outlined"
                theme={inputTheme}
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

        <Controller
          control={control}
          name="lastName"
          rules={{ required: "Last name is required" }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                label="Last Name"
                mode="outlined"
                theme={inputTheme}
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

        <Controller
          control={control}
          name="email"
          rules={{ required: "Email is required" }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                label="Email"
                mode="outlined"
                theme={inputTheme}
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
                theme={inputTheme}
                error={!!error && isSubmitted}
              />
              <HelperText type="error" visible={!!error && isSubmitted}>
                {error?.message}
              </HelperText>
            </>
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          rules={{
                required: "Confirm password is required",
                validate: (value) =>
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
                theme={inputTheme}
                error={!!error && isSubmitted}
              />
              <HelperText type="error" visible={!!error && isSubmitted}>
                {error?.message}
              </HelperText>
            </>
          )}
        />

        <Button
          mode="contained"
          theme={buttonTheme}
          style={{
            paddingVertical: isSmallScreen ? 5 : 7,
            paddingHorizontal: isSmallScreen ? 5: 7,
            width: '100%',
            marginTop: 'auto',
            marginBottom: isSmallScreen ? 10 : 15,
            maxWidth: 400,
          }}
          onPress={handleSubmit(onSubmit)} 
        >
          Sign Up
        </Button>

        <Text
          style={{
            fontSize: isSmallScreen ? 14 : 16,
            color: theme.colors.otherText,
            textAlign: "center",
            fontWeight: "bold",
            marginTop: 40,
          }}
        >
          Already have an account?{" "}
          <Text
            onPress={() => router.push("/(auth)/signIn")}
            style={{ color: theme.colors.primary, fontWeight: "bold" }}
          >
            Sign In
          </Text>
        </Text>
      </>
    </SafeAreaView>
  );
}
