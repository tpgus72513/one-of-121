import type { ComponentType } from "react";

// 모든 게임 공통 규칙 (기획서 6장). ⚠️ 초안 — 첫 회의에서 셋이 같이 확정한다.
// 게임은 이 규칙만 지키면 되고, 3D 캠퍼스·DB 코드는 몰라도 된다.

export type GameDetail = Record<string, unknown>;

export interface GameProps {
  /** 게임이 끝나면 딱 한 번 호출한다. score는 0~100 정수. */
  onFinish: (score: number, detail?: GameDetail) => void;
}

export interface GameDefinition {
  id: string;
  title: string;
  /** 제한시간(초), 30~60 */
  durationSec: number;
  component: ComponentType<GameProps>;
}
