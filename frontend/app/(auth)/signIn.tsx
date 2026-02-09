import React from 'react'
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Button, HelperText,Text} from "react-native-paper";
import { useState } from "react";
import { inputTheme, theme,  buttonTheme } from "../../constants/theme";
import { Image, StyleSheet, useWindowDimensions } from "react-native"
import { useForm, Controller } from "react-hook-form";


type FormData = {
  email: string;
  password: string;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
  }
});
export default function signIn() {

  // const handleChange = (name: keyof FormData, value: string) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: value
  //   }));
  // };

  // const [formData, setFormData] = useState<FormData>({
  //   email: '',
  //   password: ''
  // });

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

  return (
    <SafeAreaView style={styles.container}>

      {/* <TextInput 
        label="Email"
        mode="outlined" 
        value={formData.email}
        style={{ marginTop: 16 }}
        theme={inputTheme}
        onChangeText={(text) => handleChange("email", text)}
      />

      <TextInput 
        label="Password"
        mode="outlined" 
        secureTextEntry
        style={{ marginTop: 16 }}
        value={formData.password}
        theme={inputTheme}
        onChangeText={(text) => handleChange("password", text)}
      /> */}


      <>

      <Text
        theme={theme}
        style={{
          fontSize: 30,
          fontWeight: "bold",
          marginBottom: 50,
          textAlign: "center",
        }}
      >
        Welcome Back!
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


      <Button mode="contained" theme={ buttonTheme} style={{ marginTop: 16 }} onPress={(e) =>{console.log()} }>
        Submit
      </Button>
      </>
    
    
    </SafeAreaView>
  )
}
