// Email-safe equivalents of the application's semantic palette.
const palette = {
  background: '#ffffff',
  foreground: '#1b102c',
  primary: '#7938cc',
  primaryForeground: '#ffffff',
  mutedForeground: '#55575d',
  footer: '#77717f',
}

export const main = { backgroundColor: palette.background, fontFamily: 'Manrope, Arial, sans-serif' }
export const container = { padding: '32px 25px', maxWidth: '560px' }
export const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: palette.foreground, margin: '0 0 20px' }
export const text = { fontSize: '14px', color: palette.mutedForeground, lineHeight: '1.5', margin: '0 0 25px' }
export const link = { color: palette.primary, textDecoration: 'underline' }
export const button = {
  backgroundColor: palette.primary,
  color: palette.primaryForeground,
  fontSize: '14px',
  border: `1px solid ${palette.primary}`,
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
export const footer = { fontSize: '12px', color: palette.footer, margin: '30px 0 0' }
export const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '22px', fontWeight: 'bold' as const, color: palette.primary, margin: '0 0 30px' }
export const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: ${palette.primary} !important; color: ${palette.primaryForeground} !important; }
  }
  [data-ogsc] .dm-btn { background-color: ${palette.primary} !important; color: ${palette.primaryForeground} !important; }
  [data-ogsb] .dm-btn { background-color: ${palette.primary} !important; color: ${palette.primaryForeground} !important; }
`