import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import StickyNote from '../../components/notes/StickyNote';
import {
  BROWN,
  PAPER_BEIGE,
  TERRACOTTA,
  WARM_BG,
} from '../../constants/colors';
import { getPrioritySize } from '../../utils/priorityHelpers';
import { useNotes } from '../../hooks/useNotes';
import { useUserStore } from '../../store/userStore';

const DOT_SIZE = 2;
const DOT_SPACING = 22;
const JITTER = 8;
const GUTTER = 16;

const buildPositions = (notes, maxWidth, jitterMap) => {
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  const positions = {};

  notes.forEach((note) => {
    const size = getPrioritySize(note.priority);
    if (x + size.width > maxWidth) {
      x = 0;
      y += rowHeight + GUTTER;
      rowHeight = 0;
    }
    const jitter = jitterMap[note.id] ?? { dx: 0, dy: 0 };
    positions[note.id] = {
      left: x + jitter.dx,
      top: y + jitter.dy,
      width: size.width,
      height: size.height,
    };
    x += size.width + GUTTER;
    rowHeight = Math.max(rowHeight, size.height);
  });

  const height = y + rowHeight + GUTTER;
  return { positions, height: Math.max(height, 360) };
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useUserStore();
  const { filteredNotes, loading, fetchNotes, removeNote, activeFilter, setFilter } = useNotes();
  const [boardSize, setBoardSize] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  const jitterMap = useMemo(() => {
    const map = {};
    filteredNotes.forEach((note) => {
      map[note.id] = {
        dx: Math.round(Math.random() * (JITTER * 2) - JITTER),
        dy: Math.round(Math.random() * (JITTER * 2) - JITTER),
      };
    });
    return map;
  }, [filteredNotes]);

  const layout = useMemo(() => {
    const maxWidth = Math.max(240, boardSize.width - GUTTER * 2);
    return buildPositions(filteredNotes, maxWidth, jitterMap);
  }, [filteredNotes, boardSize.width, jitterMap]);

  const dots = useMemo(() => {
    const cols = Math.ceil(boardSize.width / DOT_SPACING) + 2;
    const rows = Math.ceil(boardSize.height / DOT_SPACING) + 6;
    const items = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        items.push({
          key: `${r}-${c}`,
          left: c * DOT_SPACING,
          top: r * DOT_SPACING,
        });
      }
    }
    return items;
  }, [boardSize]);

  const onRefresh = useCallback(() => {
    if (user?.id) fetchNotes(user.id);
  }, [fetchNotes, user?.id]);

  const onBoardLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    if (width && height) setBoardSize({ width, height });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>PinNest</Text>
        <Pressable
          onPress={() => navigation.navigate('CreateNoteScreen')}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {['all', 'active', 'completed'].map((tab) => {
          const active = activeFilter === tab;
          const label = tab[0].toUpperCase() + tab.slice(1);
          return (
            <Pressable
              key={tab}
              onPress={() => setFilter(tab)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      >
        <Pressable onLayout={onBoardLayout} style={styles.board}>
          <View style={styles.dotLayer} pointerEvents="none">
            {dots.map((dot) => (
              <View
                key={dot.key}
                style={[styles.dot, { left: dot.left, top: dot.top }]}
              />
            ))}
          </View>

          {filteredNotes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🗂️</Text>
              <Text style={styles.emptyText}>Pin your first goal</Text>
            </View>
          ) : (
            filteredNotes.map((note) => {
              const pos = layout.positions[note.id];
              // Guard: skip notes that don't have a layout position yet (e.g. temp optimistic notes).
              if (!pos) return null;
              return (
                <StickyNote
                  key={note.id}
                  note={note}
                  style={{ left: pos.left, top: pos.top }}
                  onPress={() =>
                    navigation.navigate('EditNoteScreen', { note })
                  }
                  onLongPress={() => {
                    Alert.alert(
                      'Delete Note',
                      `Delete "${note.title}"? This cannot be undone.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => removeNote(note.id),
                        },
                      ]
                    );
                  }}
                />
              );
            })
          )}
          <View style={{ height: layout.height }} />
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARM_BG,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: TERRACOTTA,
    letterSpacing: 0.5,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: TERRACOTTA,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BROWN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: PAPER_BEIGE,
    fontSize: 22,
    lineHeight: 22,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: PAPER_BEIGE,
  },
  tabActive: {
    backgroundColor: TERRACOTTA,
  },
  tabText: {
    color: BROWN,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: PAPER_BEIGE,
  },
  scrollContent: {
    paddingHorizontal: GUTTER,
    paddingBottom: 32,
  },
  board: {
    position: 'relative',
    minHeight: 400,
    borderRadius: 18,
    backgroundColor: WARM_BG,
  },
  dotLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: BROWN,
    opacity: 0.18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    color: BROWN,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
