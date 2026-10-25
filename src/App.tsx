import { ArcadeShell } from './arcade';
import { PacmanGame } from './PacmanGame';

export default function App() {
  return (
    <ArcadeShell gameId="pacman">
      <PacmanGame />
    </ArcadeShell>
  );
}
