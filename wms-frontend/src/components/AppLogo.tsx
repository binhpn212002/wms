import { Flex, theme, Typography } from 'antd'
import type { CSSProperties } from 'react'
import appLogoUrl from '../assets/app-logo.svg'
import { config } from '../config'

const { Text } = Typography

type AppLogoProps = {
  size?: number
  showName?: boolean
  layout?: 'horizontal' | 'vertical'
  onClick?: () => void
  style?: CSSProperties
}

export function AppLogo({
  size = 36,
  showName = true,
  layout = 'horizontal',
  onClick,
  style,
}: AppLogoProps) {
  const { token } = theme.useToken()
  const clickable = Boolean(onClick)

  return (
    <Flex
      align="center"
      gap={layout === 'horizontal' ? 10 : 6}
      vertical={layout === 'vertical'}
      justify={layout === 'vertical' ? 'center' : undefined}
      onClick={onClick}
      style={{
        ...style,
        cursor: clickable ? 'pointer' : undefined,
        userSelect: 'none',
      }}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `${config.appName} — về trang chủ` : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
    >
      <img src={appLogoUrl} alt="" width={size} height={size} style={{ display: 'block', flexShrink: 0 }} />
      {showName && (
        <Text
          strong
          style={{
            fontSize: layout === 'vertical' ? token.fontSizeHeading4 : token.fontSizeLG,
            color: token.colorText,
            lineHeight: 1.25,
            textAlign: layout === 'vertical' ? 'center' : undefined,
          }}
        >
          {config.appName}
        </Text>
      )}
    </Flex>
  )
}
