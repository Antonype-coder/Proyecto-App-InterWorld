import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { getImageUrl } from '@utils/image';

interface ProductoImageCarouselProps {
  images: string[];
  height: number;
  onRemove?: (index: number) => void;
}

export default function ProductoImageCarousel({
  images,
  height,
  onRemove,
}: ProductoImageCarouselProps): React.ReactElement {
  const colors = useColors();
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleIndex = Math.min(activeIndex, Math.max(images.length - 1, 0));

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ): void => {
    if (width > 0) {
      setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
    }
  };

  const goTo = (index: number): void => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  return (
    <View
      style={[
        styles.container,
        { height, backgroundColor: colors.bgSubtle },
      ]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessibilityLabel={
        images.length > 1
          ? `Galería, ${images.length} fotos`
          : 'Foto del producto'
      }
    >
      {images.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons
            name="image-plus-outline"
            size={32}
            color={colors.textMuted}
          />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Foto del producto
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
            Añade una o varias imágenes
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
          >
            {images.map((path, index) => {
              const uri = getImageUrl(path);
              return (
                <View
                  key={`${path}-${index}`}
                  style={[styles.page, { width, height }]}
                >
                  {uri ? (
                    <Image
                      source={{ uri }}
                      style={styles.image}
                      contentFit="contain"
                      cachePolicy="disk"
                      transition={150}
                    />
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          {images.length > 1 ? (
            <View style={styles.counter} pointerEvents="none">
              <Text style={[styles.counterText, { color: '#FFFFFF' }]}>
                {visibleIndex + 1} / {images.length}
              </Text>
            </View>
          ) : null}

          {onRemove ? (
            <Pressable
              onPress={() => onRemove(visibleIndex)}
              style={[
                styles.removeButton,
                { backgroundColor: colors.danger },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Quitar esta foto"
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color="#FFFFFF"
              />
            </Pressable>
          ) : null}

          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((path, index) => (
                <Pressable
                  key={`${path}-dot-${index}`}
                  onPress={() => goTo(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver foto ${index + 1}`}
                  style={[
                    styles.dot,
                    { backgroundColor: colors.bgMuted },
                    index === visibleIndex
                      ? [
                          styles.activeDot,
                          { backgroundColor: colors.primary },
                        ]
                      : null,
                  ]}
                />
              ))}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    alignSelf: 'stretch',
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyTitle: { ...typography.bodyBold },
  emptyHint: { ...typography.small },
  page: { alignItems: 'center', justifyContent: 'center' },
  scrollView: { width: '100%' },
  image: { width: '100%', height: '100%' },
  counter: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(17, 24, 39, 0.72)',
  },
  counterText: { ...typography.small },
  removeButton: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  activeDot: { width: 18 },
});