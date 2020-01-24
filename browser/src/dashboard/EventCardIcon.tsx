import React from 'react'

import SVG from 'react-inlinesvg'

interface CardIconProps {
  icon: string
}
export const CardIcon = (props: CardIconProps) => (
  <div style={{ marginRight: 10 }}>
    <SVG src={props.icon} width={35} height={35} />
  </div>
)

interface CardImageProps {
  image: string
}
export const CardImage = (props: CardImageProps) => (
  <div style={{ marginRight: 10, paddingBottom: 5 }}>
    <img src={props.image} style={{ width: 35, height: 35, display: 'block', borderRadius: 3 }} />
  </div>
)