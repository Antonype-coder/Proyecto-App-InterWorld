import { useTheme } from './useTheme';

export function useChartColors() {
  const { theme } = useTheme();

  return {
    // Tonos principales
    primary: theme.chartPrimary,
    wine: theme.chartWine,
    plum: theme.chartPlum,
    berry: theme.chartBerry,
    mauve: theme.chartMauve,
    smoke: theme.chartSmoke,
    cocoa: theme.chartCocoa,

    // Aliases para no romper código existente
    emerald: theme.chartWine,
    amber: theme.chartPlum,
    rose: theme.chartBerry,
    sky: theme.chartMauve,
    violet: theme.chartPlum,
    teal: theme.chartWine,

    // Subtle backgrounds
    primarySubtle: theme.chartPrimarySubtle,
    wineSubtle: theme.chartWineSubtle,
    plumSubtle: theme.chartPlumSubtle,
    berrySubtle: theme.chartBerrySubtle,
    mauveSubtle: theme.chartMauveSubtle,
    smokeSubtle: theme.chartSmokeSubtle,
    cocoaSubtle: theme.chartCocoaSubtle,

    // Aliases subtle
    emeraldSubtle: theme.chartWineSubtle,
    amberSubtle: theme.chartPlumSubtle,
    roseSubtle: theme.chartBerrySubtle,
    skySubtle: theme.chartMauveSubtle,
    violetSubtle: theme.chartPlumSubtle,
    tealSubtle: theme.chartWineSubtle,

    // Serie para donuts y rankings (5 colores)
    series: [
      theme.chartPrimary,
      theme.chartWine,
      theme.chartPlum,
      theme.chartBerry,
      theme.chartMauve,
    ],
  };
}