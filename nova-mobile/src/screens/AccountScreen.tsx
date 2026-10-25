import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { novaCloud } from '../api/novaCloud';

export default function AccountScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const signIn = async () => {
    const r = await novaCloud.login(email, password);
    setMsg(r.success ? `Signed in as ${r.user?.email}` : r.error || 'Failed');
  };

  const sync = async () => {
    const pull = await novaCloud.syncPull();
    if (!pull.success && pull.error) {
      setMsg(pull.error);
      return;
    }
    const push = await novaCloud.syncPush({ bookmarks: pull.data?.bookmarks || [], syncedAt: Date.now() });
    setMsg(push.success ? `Synced — ${pull.data?.bookmarks?.length || 0} bookmarks` : push.error || 'Sync failed');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Nova Cloud Account</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#6b7280" autoCapitalize="none" />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#6b7280" secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={signIn}><Text style={styles.btnText}>Sign In</Text></TouchableOpacity>
      <TouchableOpacity style={styles.btnSecondary} onPress={sync}><Text style={styles.btnTextSecondary}>☁️ Sync Now</Text></TouchableOpacity>
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 24 },
  input: { backgroundColor: '#1a1a2e', color: '#fff', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#8b5cf630' },
  btn: { backgroundColor: '#8b5cf6', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
  btnSecondary: { backgroundColor: '#8b5cf620', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  btnTextSecondary: { color: '#a78bfa', fontWeight: '600' },
  msg: { color: '#a78bfa', marginTop: 16, textAlign: 'center' }
});
