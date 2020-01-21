import React from 'react'

import { useSpring, animated, useTransition } from 'react-spring'

// this top level method has to be any type right now as of
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20356
export const OpacitySpring: any = (divProps: any) => {
  const transitions = useTransition(true, null, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 1 }
  })

  return transitions.map(({ item, key, props }) => (
    <animated.div key={key} style={props}>
      {divProps.children}
    </animated.div>
  ))
}

interface ValueSpringProps {
  value: number,
  formatter: Intl.NumberFormat
}

export const ValueSpring = (props: ValueSpringProps) => {
  const springProps = useSpring({
    value: props.value
  })

  return (
    <animated.span>
      {springProps.value.interpolate((x) => props.formatter.format(x))}
    </animated.span>
  )
}