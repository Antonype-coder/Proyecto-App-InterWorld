import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography, shadows } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface TooltipProps {
  text: string;
  title?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  placement?: 'auto' | 'top' | 'bottom';
}

interface TriggerRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const BUBBLE_MAX_WIDTH = 300;
const ARROW_SIZE = 10;
const EDGE_PADDING = 16;

export default function Tooltip({
  text,
  title,
  icon = 'help-circle-outline',
  placement = 'auto',
}: TooltipProps): React.ReactElement {
  const colors = useColors();
  const triggerRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [triggerRect, setTriggerRect] = useState<TriggerRect | null>(null);
  const [bubbleHeight, setBubbleHeight] = useState(0);

  const screen = Dimensions.get('window');
  const bubbleWidth = Math.min(
    BUBBLE_MAX_WIDTH,
    screen.width - EDGE_PADDING * 2,
  );

  const open = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerRect({ x, y, width, height });
      setBubbleHeight(0);
      setVisible(true);
    });
  };

  const close = () => setVisible(false);

  const onBubbleLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h !== bubbleHeight) setBubbleHeight(h);
  };

  // Cálculo de posición
  let bubbleTop = 0;
  let arrowSide: 'top' | 'bottom' = 'bottom';

  if (triggerRect && bubbleHeight > 0) {
    const spaceAbove = triggerRect.y;
    const spaceBelow = screen.height - (triggerRect.y + triggerRect.height);
    const neededHeight = bubbleHeight + ARROW_SIZE + 8;

    const preferAbove =
      placement === 'top' ||
      (placement === 'auto' &&
        spaceAbove >= neededHeight &&
        spaceAbove > spaceBelow);

    if (preferAbove) {
      arrowSide = 'bottom';
      bubbleTop = triggerRect.y - bubbleHeight - ARROW_SIZE - 4;
    } else {
      arrowSide = 'top';
      bubbleTop = triggerRect.y + triggerRect.height + ARROW_SIZE + 4;
    }
  }

  const bubbleLeft = triggerRect
    ? Math.max(
        EDGE_PADDING,
        Math.min(
          screen.width - bubbleWidth - EDGE_PADDING,
          triggerRect.x + triggerRect.width / 2 - bubbleWidth / 2,
        ),
      )
    : EDGE_PADDING;

  // Posición horizontal de la flecha relativa al bubble
  const arrowLeft = triggerRect
    ? Math.max(
        ARROW_SIZE * 2,
        Math.min(
          bubbleWidth - ARROW_SIZE * 2,
          triggerRect.x +
            triggerRect.width / 2 -
            bubbleLeft -
            ARROW_SIZE / 2,
        ),
      )
    : bubbleWidth / 2 - ARROW_SIZE / 2;

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={open}
        hitSlop={10}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel="Mostrar ayuda"
      >
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={colors.textMuted}
        />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        <Pressable style={styles.overlay} onPress={close}>
          {triggerRect && bubbleHeight > 0 ? (
            <View
              style={[
                styles.bubble,
                {
                  top: bubbleTop,
                  left: bubbleLeft,
                  width: bubbleWidth,
                  backgroundColor: colors.textPrimary,
                },
                shadows.lg,
              ]}
              pointerEvents="none"
            >
              {title ? (
                <Text
                  style={[styles.title, { color: colors.textInverse }]}
                  numberOfLines={2}
                >
                  {title}
                </Text>
              ) : null}
              <Text style={[styles.text, { color: colors.textInverse }]}>
                {text}
              </Text>

              {/* Flecha */}
              <View
                style={[
                  styles.arrow,
                  {
                    backgroundColor: colors.textPrimary,
                    left: arrowLeft,
                  },
                  arrowSide === 'bottom'
                    ? { bottom: -ARROW_SIZE / 2 }
                    : { top: -ARROW_SIZE / 2 },
                ]}
              />
            </View>
          ) : null}

          {/* Sizer invisible para medir la altura antes de posicionar */}
          <View
            style={[
              styles.sizer,
              {
                width: bubbleWidth,
                top: -9999,
              },
            ]}
            onLayout={onBubbleLayout}
            pointerEvents="none"
          >
            {title ? (
              <Text style={[styles.title, { color: colors.textInverse }]}>
                {title}
              </Text>
            ) : null}
            <Text style={[styles.text, { color: colors.textInverse }]}>
              {text}
            </Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: 2,
    marginLeft: spacing.xs,
  },
  overlay: {
    flex: 1,
  },
  bubble: {
    position: 'absolute',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.bodyBold,
    marginBottom: 4,
  },
  text: {
    ...typography.caption,
    lineHeight: 18,
  },
  arrow: {
    position: 'absolute',
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    transform: [{ rotate: '45deg' }],
  },
  sizer: {
    position: 'absolute',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});