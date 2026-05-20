import { Maze } from './components/Maze';
import { DEFAULT_THEME } from './logic/constants';
import styles from './App.module.css';

export default function App() {
  return (
    <main className={styles.app}>
      <h1 className={styles.title}>Pac-Man</h1>
      <div className={styles.boardWrap}>
        <Maze theme={DEFAULT_THEME} />
      </div>
    </main>
  );
}
