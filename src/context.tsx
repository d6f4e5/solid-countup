import { createContext, mergeProps, useContext } from "solid-js";

const CountUpConfigContext = createContext({})

const CountUpDefaults = props => {
    const parent = useContext(CountUpConfigContext)
    const merged = mergeProps(parent, props.value)

    return (
        <CountUpConfigContext.Provider value={merged}>
            {props.children}
        </CountUpConfigContext.Provider>
    )
}

export { CountUpConfigContext, CountUpDefaults }