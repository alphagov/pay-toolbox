import React from 'react'

import { useSpring, animated, useTransition, config } from 'react-spring'

// this top level method has to be any type right now as of
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20356
export const OpacitySpring: any = (divProps: any) => {
  const itemIds = [ 1 ]
  const transitions = useTransition(itemIds, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 1 }
  })

  return transitions((style, item) => (
    <animated.div key={item} style={style}>
      {divProps.children}
    </animated.div>
  ))
}

interface ValueSpringProps {
  value: number,
  formatter: Intl.NumberFormat
}

// Use configuration preset 'slow' to slow down the £value animations
// https://react-spring.dev/docs/advanced/config#presets
export const ValueSpring = (props: ValueSpringProps) => {
  const springProps = useSpring({
    value: props.value,
    config: config.slow
  })

  return (
    <animated.span>
      {springProps.value.to((x) => props.formatter.format(x))}
    </animated.span>
  )
}