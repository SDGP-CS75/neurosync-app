import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Button, HelperText, Text } from "react-native-paper";
import { inputTheme, theme, buttonTheme } from "../../constants/theme";
import { Image, StyleSheet, useWindowDimensions } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/FontAwesome";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase'; // Import your Firebase configuration

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },
});
export default function signIn() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;

  const {
    control,
    handleSubmit,
    formState: { isSubmitted },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

type FormData = {
  email: string;
  password: string;
};

  const onSubmit = async (data: FormData) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log('User profile:', docSnap.data());
      } else {
        console.log('No user document found!');
      }

      router.push('/(tabs)/home');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Login error:', error.message);
      } else {
        console.error('Login error:', error);
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
          Welcome Back!
        </Text>

        <Button 
          mode="outlined" 
          style={{ borderRadius: 55, padding: 5 }}
          icon={() => <Icon name="google" size={24} color="#7A69AD" />}
        >
          continue with Google
        </Button>

        <Text
          style={{
            fontSize: isSmallScreen ? 14 : 16,
            color: theme.colors.otherText,
            textAlign: "center",
            fontWeight: "bold",
            marginTop: 30,
            marginBottom: 30,
          }}
        >
          OR LOG IN WITH EMAIL
        </Text>

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
          Login
        </Button>

        <Text
          onPress={() => router.push("/(auth)/signUp")}
          style={{ color: theme.colors.otherText, fontWeight:600, textAlign:"center", marginTop:5 }}
        >
          Forget Password
        </Text>

        <Text
          style={{
            fontSize: isSmallScreen ? 14 : 16,
            color: theme.colors.otherText,
            textAlign: "center",
            fontWeight: "bold",
            marginTop: 40,
          }}
        >
          Don’t have an account?{" "}
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
