import { createSignal, type Component } from 'solid-js'
import styles from './App.module.css'
import CountUp from 'src'

const App: Component = () => {
  const [value, setValue] = createSignal(99999)
  let ref

  return (
    <div class={styles.App}>
      {/* <p id='test'></p> */}
      <p>
        <CountUp
          class="countup"
          // useGrouping={true}
          // separator="A"
          // decimal="B"
          // locale="en-IN"
          // decimalPlaces={3}
          // duration={10}
          endVal={value()}
          ref={ref}
          // useEasing={false}
          onComplete={() => console.log('done')}
        />
        <br></br>
        <button onClick={() => ref.start()}>Start</button>
        <button onClick={() => ref.pause()}>Pause</button>
        <button onClick={() => ref.resume()}>Resume</button>
        <button onClick={() => ref.toggle()}>Toggle</button>
        <button onClick={() => ref.reset()}>Reset</button>
        <button onClick={() => ref.update(-1000)}>Set to 9</button>
        <button onClick={() => setValue(-100)}>Set to -100</button>
      </p>
    </div>
  )
}

export default App
