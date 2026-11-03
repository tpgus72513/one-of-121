import type { GameDefinition } from "./types";
import PhishingGame from "./phishing";
import MicroscopeGame from "./microscope";

// 게임 id → 게임 정보. 새 게임을 만들면 여기에 한 줄 추가한다.
// id는 data/departments.json 의 gameId 와 같아야 한다.
export const games: Record<string, GameDefinition> = {
  phishing: { id: "phishing", title: "피싱 문자 판별", durationSec: 45, component: PhishingGame },
  microscope: {
    id: "microscope",
    title: "식중독균 찾기",
    durationSec: 45,
    component: MicroscopeGame,
  },
};
