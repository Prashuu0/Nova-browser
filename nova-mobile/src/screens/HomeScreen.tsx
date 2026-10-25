import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  const items = [
    { label: 'Nova Search', screen: 'Search', icon: '🔍' },
    { label: 'Browse Web', screen: 'Browser', icon: '🌐' },
    { label: 'Bookmarks', screen: 'Bookmarks', icon: '⭐' },
    { label: 'Nova AI', screen: 'AI', icon: '✨' },
    { label: 'Account & Sync', screen: 'Account', icon: '☁️' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>N</Text>
      <Text style={styles.title}>Nova Browser</Text>
      <Text style={styles.sub}>Privacy · AI · Cloud Sync</Text>
      {items.map((item) => (
        <TouchableOpacity key={item.screen} style={styles.card} onPress={() => navigation.navigate(item.screen)}>
          <Text style={styles.cardIcon}>{item.icon}</Text>
          <Text style={styles.cardLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 24, paddingTop: 48 },
  logo: { fontSize: 48, fontWeight: '800', color: '#8b5cf6', textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', textAlign: 'center', marginTop: 8 },
  sub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#8b5cf620' },
  cardIcon: { fontSize: 24, marginRight: 16 },
  cardLabel: { fontSize: 16, color: '#e5e7eb', fontWeight: '600' }
});
