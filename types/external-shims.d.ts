// Minimal shims to satisfy TypeScript in environments without UI deps installed.
// These provide 'any' types and should be replaced by real packages in production.

declare module 'next-themes' {
  export type ThemeProviderProps = any
  export const ThemeProvider: any
  export const useTheme: any
}

declare module 'class-variance-authority' {
  export function cva(...args: any[]): any
  export type VariantProps<T> = any
}

declare module '@radix-ui/react-accordion' { const mod: any; export = mod }
declare module '@radix-ui/react-alert-dialog' { const mod: any; export = mod }
declare module '@radix-ui/react-aspect-ratio' { const mod: any; export = mod }
declare module '@radix-ui/react-avatar' { const mod: any; export = mod }
declare module '@radix-ui/react-checkbox' { const mod: any; export = mod }
declare module '@radix-ui/react-collapsible' { const mod: any; export = mod }
declare module '@radix-ui/react-context-menu' { const mod: any; export = mod }
declare module '@radix-ui/react-dialog' { const mod: any; export = mod }
declare module '@radix-ui/react-dropdown-menu' { const mod: any; export = mod }
declare module '@radix-ui/react-hover-card' { const mod: any; export = mod }
declare module '@radix-ui/react-label' { const mod: any; export = mod }
declare module '@radix-ui/react-menubar' { const mod: any; export = mod }
declare module '@radix-ui/react-navigation-menu' { const mod: any; export = mod }
declare module '@radix-ui/react-popover' { const mod: any; export = mod }
declare module '@radix-ui/react-progress' { const mod: any; export = mod }
declare module '@radix-ui/react-radio-group' { const mod: any; export = mod }
declare module '@radix-ui/react-scroll-area' { const mod: any; export = mod }
declare module '@radix-ui/react-select' { const mod: any; export = mod }
declare module '@radix-ui/react-separator' { const mod: any; export = mod }
declare module '@radix-ui/react-slider' { const mod: any; export = mod }
declare module '@radix-ui/react-slot' {
  export const Slot: any
  const _default: any
  export default _default
}
declare module '@radix-ui/react-switch' { const mod: any; export = mod }
declare module '@radix-ui/react-tabs' { const mod: any; export = mod }
declare module '@radix-ui/react-toast' { const mod: any; export = mod }
declare module '@radix-ui/react-toggle' { const mod: any; export = mod }
declare module '@radix-ui/react-toggle-group' { const mod: any; export = mod }
declare module '@radix-ui/react-tooltip' { const mod: any; export = mod }

declare module 'react-day-picker' {
  export const DayPicker: any
  export const DayButton: any
  export function getDefaultClassNames(): any
}

declare module 'embla-carousel-react' {
  export type UseEmblaCarouselType = any
  const useEmblaCarousel: any
  export default useEmblaCarousel
}
declare module 'recharts' {
  export const Tooltip: any
  export const Legend: any
  export const ResponsiveContainer: any
  export type LegendProps = any
  const mod: any
  export = mod
}
declare module 'cmdk' {
  export const Command: any
  const _default: any
  export default _default
}
declare module 'vaul' {
  export const Drawer: any
  const _default: any
  export default _default
}
declare module 'react-hook-form' {
  export type ControllerProps = any
  export type FieldPath<T = any> = any
  export type FieldValues = any
  export const Controller: any
  export const FormProvider: any
  export const useFormContext: any
  export const useFormState: any
}
declare module 'react-resizable-panels' { const mod: any; export = mod }
declare module 'input-otp' {
  export const OTPInput: any
  export const OTPInputContext: any
}
declare module 'sonner' {
  export const Toaster: any
  export type ToasterProps = any
  const _default: any
  export default _default
}
