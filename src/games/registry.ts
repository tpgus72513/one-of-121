import type { GameDefinition } from "./types";
import PhishingGame from "./phishing";
import { DURATION_SEC as PHISHING_SEC } from "./phishing/deck";
import MicroscopeGame from "./microscope";

// 게임 id → 게임 정보. 새 게임을 만들면 여기에 한 줄 추가한다.
// id는 data/departments.json 의 gameId 와 같아야 한다.
// durationSec 은 게임 폴더의 숫자를 가져온다 → 게임 쪽에서 시간을 바꾸면 여기도 저절로 맞는다.
export const games: Record<string, GameDefinition> = {
  phishing: {
    id: "phishing",
    title: "피싱 문자 판별",
    durationSec: PHISHING_SEC,
    component: PhishingGame,
  },
  microscope: {
    id: "microscope",
    title: "식중독균 찾기",
    durationSec: 45, // TODO(B): 게임 만들면 microscope 쪽 숫자를 가져오게 바꾸기
    component: MicroscopeGame,
  },
};
