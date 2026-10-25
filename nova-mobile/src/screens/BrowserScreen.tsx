import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView } from 'react-native';

let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch {
  WebView = null;
}

export default function BrowserScreen({ route }: any) {
  const initialUrl = route?.params?.url || 'https://www.wikipedia.org';
  const [url, setUrl] = useState(initialUrl);
  const [current, setCurrent] = useState(initialUrl.startsWith('http') ? initialUrl : `https://${initialUrl}`);

  const go = () => {
    let target = url.trim();
    if (!target.startsWith('http')) target = 'https://' + target;
    setCurrent(target);
  };

  if (!WebView) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.hint}>Run: npm install react-native-webview</Text>
        <Text style={styles.url}>{current}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bar}>
        <TextInput style={styles.input} value={url} onChangeText={setUrl} onSubmitEditing={go} autoCapitalize="none" placeholderTextColor="#6b7280" placeholder="Enter URL" />
      </View>
      <WebView source={{ uri: current }} style={styles.web} onNavigationStateChange={(nav) => setUrl(nav.url)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  bar: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  input: { backgroundColor: '#1a1a2e', color: '#fff', padding: 10, borderRadius: 10 },
  web: { flex: 1 },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f1a', padding: 24 },
  hint: { color: '#6b7280', textAlign: 'center' },
  url: { color: '#a78bfa', marginTop: 12, textAlign: 'center' }
});
