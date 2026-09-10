import styles from './App.module.css'
import { useCounterStore } from './store/useCounterStore'

function App() {
  const count = useCounterStore((state) => state.count)
  const increment = useCounterStore((state) => state.increment)

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>StudyBuddy — Frontend nuevo funcionando</h1>
      <div className={styles.counter}>
        <span>{count}</span>
        <button className={styles.button} onClick={increment}>
          +1
        </button>
      </div>
    </div>
  )
}

export default App
