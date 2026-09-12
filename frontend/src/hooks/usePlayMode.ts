import { useCallback, useState } from 'react';
import { PlayMode, loadPlayMode, savePlayMode } from '../utils/playMode';

/** 選択中のプレイモードを読み書きする。選択は localStorage に残る。 */
export function usePlayMode(): [PlayMode, (mode: PlayMode) => void] {
  const [mode, setMode] = useState<PlayMode>(() => loadPlayMode());

  const changeMode = useCallback((next: PlayMode) => {
    setMode(next);
    savePlayMode(next);
  }, []);

  return [mode, changeMode];
}
