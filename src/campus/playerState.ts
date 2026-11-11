import { Vector3 } from "three";

// 담당: A · 캐릭터와 다른 파일이 같이 쓰는 값들.
//
// 3D 안(Canvas)과 밖(조이스틱 같은 화면 버튼)은 React 트리가 달라서 props 로 주고받기 어렵다.
// 그래서 매 프레임 바뀌는 값은 그냥 이 파일의 객체 하나에 넣어 두고 같이 읽는다.
// (state 로 두면 1초에 60번 다시 그려져서 느려진다)

/** 캐릭터 현재 위치. Player 만 쓰고, Building(입구 판정) 같은 곳은 읽기만 한다. */
export const playerPosition = new Vector3(0, 0, 20);

/** 조이스틱 입력. -1 ~ 1. x: 오른쪽 +, y: 위(앞) +. Joystick 이 쓰고 Player 가 읽는다. */
export const joystick = { x: 0, y: 0 };

/** 부딪히는 상자 (건물 등). 가운데 좌표 + 가로(x)·세로(z) 길이 */
export interface Obstacle {
  x: number;
  z: number;
  width: number;
  depth: number;
}
