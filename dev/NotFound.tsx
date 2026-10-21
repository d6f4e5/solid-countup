import { type Component } from 'solid-js'
import CountUp from 'src'
import styles from './NotFound.module.css'

const NotFound: Component = () => (
  <main class={styles.page}>
    <p class={styles.code}>
      <CountUp endVal={404} duration={1.2} autoAnimate />
    </p>
    <h1 class={styles.title}>This page doesn&rsquo;t exist</h1>
    <p class={styles.lede}>
      The number above is <code>solid-countup</code> doing the one thing it does well.
    </p>
    <a class={styles.link} href="/">
      Back to the demo
    </a>
  </main>
)

export default NotFound
