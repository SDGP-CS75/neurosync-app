import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BACKEND_URL } from '@env';

export default function TestAPI() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch(`${BACKEND_URL}/health`)
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => setMessage('Error connecting to backend'));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20 }
});
