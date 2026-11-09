# 식중독균 찾기 · 추현지 B ①

`npm run dev` 후 `/play/food-biotech`에서 실행한다.
캠퍼스 화면의 **식품생명공학과 체험하기** 링크로도 들어갈 수 있다.

- 시작 버튼을 누르면 두 시료를 합쳐 45초 동안 진행한다.
- 초점 슬라이더를 맞추고, 표본과 같은 모양의 균을 클릭·터치한다.
- 각 시료에서 5마리를 모두 찾으면 다음 시료로 넘어간다. 총 10마리를 찾으면 조기 종료한다.
- 정답 +10점, 오답 -3점이며 최종 점수는 0~100점이다. 초점이 안 맞거나 이미 찾은 균을 누르면 감점하지 않는다.
- 키보드로 슬라이더를 조절하고, Tab으로 입자를 선택한 뒤 Enter 또는 Space로 검사할 수 있다.
- 결과 화면에서 다시 시작하거나 체험을 마칠 수 있다.

## 파일 구성

| 파일                    | 역할                                                 |
| ----------------------- | ---------------------------------------------------- |
| `index.tsx`             | 시작·플레이·결과 화면, 타이머 정리, 완료 콜백        |
| `Scope.tsx`             | SVG 시료, blur 효과, 화면 좌표를 0~100 좌표로 변환   |
| `samples.json`          | 시료별 초점, 균과 배경 입자 위치·모양                |
| `rules.ts`              | 초점·좌표 판정, 중복 방지, 점수, 제한시간, 단계 전환 |
| `microscope.module.css` | 게임 전용 스타일과 모바일 배치                       |
| `Preview.tsx`           | 공통 실행기 완성 전 체험 페이지 연결                 |
| `rules.test.mjs`        | 진행·점수·시간 경계 검사                             |

## C 담당 실행기와 연결

기존 `GameProps`와 registry 등록을 그대로 사용한다. 결과 화면에서 **체험 마치기**를 누르면
`onFinish(score, detail)`을 한 번 호출한다. `detail`에는 다음 값이 들어간다.

`correct`, `total`, `mistakes`, `foundIds`, `elapsedMs`, `timeLeft`, `endReason`, `completedSamples`

공통 실행기가 아직 준비 중이어서 `/play/[dept]/page.tsx`에 microscope 전용 분기만 추가했다.
현재 `Preview.tsx`는 체험 완료 시 캠퍼스로 돌아간다. 점수 DB 저장·AI 결과 카드·랭킹은 연결하지 않는다.
완료 시 게임의 회차 키를 바꿔 초기화하므로, 뒤로 가기나 캠퍼스 링크로 다시 들어와도 시작 버튼을 사용할 수 있다.
공통 실행기가 완성되면 이 분기를 공통 실행기로 바꾸고, registry의 컴포넌트에 `onFinish`를 전달하면 된다.
타이머는 게임 내부에 있으므로 공통 실행기에서 별도로 진행 시간을 중복 제어하지 않는다.

`next.config.ts`의 CSS 로더에서 `as: "*.css"`를 제거했다. 이 설정이 `.module.css`도 일반 CSS로
바꾸어 클래스 매핑을 없애기 때문에, 원래 확장자를 유지하도록 한 것이다. Tailwind 로더는 유지한다.

## 검사

Node.js 24에서 `node --test src/games/microscope/rules.test.mjs`로 게임 규칙을 검사한다.
전체 프로젝트 검사는 기존 `npm run lint`, `npm run typecheck`, `npm run build`를 사용한다.
