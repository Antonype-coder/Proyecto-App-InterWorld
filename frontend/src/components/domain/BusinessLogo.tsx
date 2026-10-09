import React from 'react';
import { Image } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';
import { useConfiguracionStore } from '@store/configuracionStore';
import { getImageUrl } from '@utils/image';

interface BusinessLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export default function BusinessLogo({
  size = 32,
  style,
}: BusinessLogoProps): React.ReactElement | null {
  const logoPath = useConfiguracionStore((state) => {
    const data = state.data as any;
    const general = data?.general ?? {};
    const negocio = data?.negocio ?? {};

    const value =
      general.logo_url ??
      negocio.logo_url ??
      general.negocio_logo ??
      negocio.negocio_logo ??
      general.logo ??
      negocio.logo;

    return typeof value === 'string' && value.trim() ? value : null;
  });

  const uri = getImageUrl(logoPath);

  if (!uri) return null;

  return (
    <Image
      source={{ uri }}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      cachePolicy="disk"
      accessibilityLabel="Logo del negocio"
    />
  );
}