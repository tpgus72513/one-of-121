import { Black_Han_Sans } from "next/font/google";

// 이 게임에서만 쓰는 굵은 제목 글꼴. 한글 글꼴이라 latin 미리받기는 끈다.
export const display = Black_Han_Sans({ weight: "400", subsets: ["latin"], preload: false });

// 자주 쓰는 스티커 느낌 테두리 + 그림자. 버튼·카드·칩이 다 이 모양이다.
export const sticker = "border-[2.5px] border-black shadow-[4px_4px_0_#111]";
export const pressable =
  "transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_#111]";
