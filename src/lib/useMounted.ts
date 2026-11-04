import { useSyncExternalStore } from "react";

// 브라우저에서 화면이 붙은 뒤에만 true.
// localStorage 는 서버에 없어서, 서버 화면과 브라우저 화면이 달라지는 걸(hydration 오류) 막으려고 쓴다.
const subscribe = () => () => {};

export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true, // 브라우저
    () => false, // 서버
  );
}
