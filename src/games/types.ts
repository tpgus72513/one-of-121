import type { ComponentType } from "react";

// 모든 게임 공통 규칙 (기획서 6장). ⚠️ 초안 — 회의에서 셋이 같이 확정한다.
// 게임은 이 규칙만 지키면 되고, 3D 캠퍼스·DB 코드는 몰라도 된다.
//
// 시간은 누가 재나 (11/4 제안)
//   - 제한시간: 게임이 직접 잰다. 게임마다 시작 화면·해설 화면이 달라서 게임이 제일 잘 안다.
//   - 플레이 시간(playMs): 게임 실행기가 잰다. 게임이 화면에 뜬 순간 ~ onFinish 까지. /api/plays 로 보낸다.

export type GameDetail = Record<string, unknown>;

export interface GameProps {
  /** 게임이 끝나면 딱 한 번 호출한다. score는 0~100 정수. */
  onFinish: (score: number, detail?: GameDetail) => void;
}

export interface GameDefinition {
  id: string;
  title: string;
  /** 제한시간(초), 30~60. 게임 안의 숫자를 가져다 쓴다 (안내 문구용, 실제로 재는 건 게임) */
  durationSec: number;
  component: ComponentType<GameProps>;
}
