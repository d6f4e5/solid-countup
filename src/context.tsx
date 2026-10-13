import { createContext, mergeProps, useContext, type ParentComponent } from 'solid-js'
import type { CountUpProps } from './index'

const CountUpConfigContext = createContext<Partial<CountUpProps>>({})

const CountUpDefaults: ParentComponent<{ value: Partial<CountUpProps> }> = props => {
  const parent = useContext(CountUpConfigContext)
  const merged = mergeProps(parent, props.value)

  return (
    <CountUpConfigContext.Provider value={merged}>{props.children}</CountUpConfigContext.Provider>
  )
}

export { CountUpConfigContext, CountUpDefaults }
