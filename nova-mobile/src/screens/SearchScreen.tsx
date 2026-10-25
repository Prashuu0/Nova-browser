import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { novaCloud } from '../api/novaCloud';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const search = async () => {
    const data = await novaCloud.search(query);
    setResults(data.results || []);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Search Nova..." placeholderTextColor="#6b7280" onSubmitEditing={search} />
        <TouchableOpacity onPress={search} style={styles.btn}><Text style={styles.btnText}>Go</Text></TouchableOpacity>
      </View>
      <FlatList data={results} keyExtractor={(_, i) => String(i)} renderItem={({ item }) => (
        <View style={styles.result}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.url}>{item.url}</Text>
        </View>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  bar: { flexDirection: 'row', padding: 12, gap: 8 },
  input: { flex: 1, backgroundColor: '#1a1a2e', color: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#8b5cf630' },
  btn: { backgroundColor: '#8b5cf6', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700' },
  result: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  title: { color: '#c4b5fd', fontSize: 15, fontWeight: '600' },
  url: { color: '#6b7280', fontSize: 12, marginTop: 4 }
});
