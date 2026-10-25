import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { novaCloud } from '../api/novaCloud';

export default function BookmarksScreen({ navigation }: any) {
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => {
    novaCloud.syncPull().then((r) => setBookmarks(r.data?.bookmarks || []));
  }, []);

  return (
    <View style={styles.container}>
      <FlatList data={bookmarks} keyExtractor={(item) => item.id} renderItem={({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Browser', { url: item.url })}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.url}>{item.url}</Text>
        </TouchableOpacity>
      )} ListEmptyComponent={<Text style={styles.empty}>Sign in and sync to see bookmarks</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  title: { color: '#fff', fontWeight: '600' },
  url: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 48 }
});
