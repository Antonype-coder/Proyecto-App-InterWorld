export const spacing = {
  xxs:  2,
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  huge: 40,
  giant: 56,
} as const;

export const radius = {
  xs:   4,
  sm:   6,
  md:   8,
  lg:   12,
  xl:   16,
  xxl:  20,
  pill: 999,
} as const;

export const sizes = {
  controlHeightSm: 32,
  controlHeightMd: 40,
  controlHeightLg: 48,

  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 32,

  maxContentWidth: 720,
  tabBarHeight: 64,
} as const;

export type AppSpacing = typeof spacing;
export type AppRadius  = typeof radius;
export type AppSizes   = typeof sizes;