import React, { useState } from 'react';
import { View, TextInput, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function AIScreen() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.chat}>
        {reply ? <Text style={styles.reply}>{reply}</Text> : <Text style={styles.hint}>Ask Nova AI anything. Connect Gemini API in desktop Settings.</Text>}
      </ScrollView>
      <View style={styles.bar}>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Ask Nova AI..." placeholderTextColor="#6b7280" />
        <TouchableOpacity style={styles.btn} onPress={() => setReply(`Nova AI: Processing "${input}" — full AI via Nova Cloud coming in beta v2.`)}>
          <Text style={styles.btnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  chat: { flex: 1, padding: 16 },
  hint: { color: '#6b7280', textAlign: 'center', marginTop: 48 },
  reply: { color: '#e5e7eb', fontSize: 15, lineHeight: 22 },
  bar: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#ffffff10' },
  input: { flex: 1, backgroundColor: '#1a1a2e', color: '#fff', padding: 12, borderRadius: 12 },
  btn: { backgroundColor: '#8b5cf6', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700' }
});
