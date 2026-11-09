# AI 결과 카드 · 추현지 B ③

`POST /api/result-card`가 체험한 학과와 점수·숫자 기록을 받아 한국어 결과 카드 문구를 반환한다.
OpenAI Responses API를 서버에서만 호출하고, 키가 없거나 호출에 실패하면 점수 구간별 기본 카드를 반환한다.
새 패키지는 설치하지 않았다. 기존 식중독균 게임 결과 화면에서 카드 API를 바로 확인할 수 있다.

## 요청

```json
{
  "gameDept": "food-biotech",
  "gameId": "microscope",
  "score": 80,
  "detail": { "correct": 8, "total": 10, "mistakes": 0 }
}
```

- `Content-Type: application/json`이 필요하다.
- `gameDept`는 현재 열린 학과 id이며, `gameId`는 해당 학과와 일치해야 한다.
- `score`는 0~100 정수다.
- `detail`은 생략할 수 있다. 숫자 필드 `correct`, `total`, `answered`, `mistakes`, `bestStreak`,
  `aiPhishingCaught`, `aiPhishingTotal`, `timeLeft`, `elapsedMs`만 선택해서 사용한다.
- 자유 문장·닉네임·문제 원문·발견 id 등 나머지 값은 AI 프롬프트에 넣지 않는다.

## 응답

```json
{
  "card": {
    "title": "121분의 1, 정밀 관찰형 인간",
    "description": "작은 단서까지 놓치지 않는 오늘의 연구원! 다음 관찰에서도 이 집중력을 발휘해봐요.",
    "keywords": ["관찰력", "집중력", "꼼꼼함"]
  },
  "source": "fallback",
  "gameDept": "food-biotech",
  "score": 80
}
```

| 상태 | 의미                                                           |
| ---- | -------------------------------------------------------------- |
| 200  | 카드 반환. `source`가 `ai`면 AI 생성, `fallback`이면 기본 문구 |
| 400  | 학과·게임·점수·세부기록 또는 JSON 형식 오류                    |
| 413  | 요청 크기가 8,192바이트를 초과함                               |
| 415  | JSON Content-Type이 아님                                       |

정상 입력은 AI의 인증 오류·호출 제한·네트워크 실패·8초 초과·거절·미완료·잘못된 출력에도 200 기본 카드로 복구한다.
기본 문구는 두 게임에 대해 0~49점 / 50~79점 / 80~100점으로 나뉜다.
점수와 학과 id는 모델이 만든 값으로 바꾸지 않는다. 응답은 `Cache-Control: no-store`다.

## 설정

`.env.example`을 `.env.local`로 복사하고 **서버 환경에만** 아래 값을 설정한다.

```dotenv
LLM_API_KEY=
LLM_MODEL=gpt-5.4-mini
```

`LLM_API_KEY`에는 OpenAI API 키를 넣는다. `NEXT_PUBLIC_` 접두사를 붙이지 않는다.
`LLM_MODEL`을 생략하면 위 모델을 사용한다. 바꿀 때는 Responses API와 Structured Outputs 지원 모델을 선택한다.
환경변수 변경 후 서버를 다시 실행한다. Vercel에서는 프로젝트 환경변수에 설정하고 새로 배포한다.
실제 키는 저장소에 넣지 않는다. 키가 없는 로컬 환경에서도 기본 카드 미리보기는 동작한다.

## C 담당 결과 화면 연결

기존 `onFinish(score, detail)` 결과에 학과 id와 게임 id를 붙여 이 API로 보낸다.
`card.title`, `card.description`, `card.keywords`를 화면에 표시하고 `source`로 AI/기본 카드를 구분할 수 있다.
`ResultCardResponse` 타입은 `service.ts`에서 **type-only import**로 사용한다.
카드가 로딩 중이거나 서버 접속에 실패해도 게임 재시작·종료를 막지 않는다.
식중독균 게임의 `ResultCardPreview.tsx`는 공통 결과 화면 완성 전 확인용 연결이며,
C 담당 `src/app/result/page.tsx`와 저장·공유·랭킹 페이지는 변경하지 않았다.

## 검사

`node --test src/app/api/result-card/service.test.mjs`로 실제 과금 없이 정상 생성·출력 검증·오류 복구·타임아웃·입력 제한을 검사한다.
모의 OpenAI 응답을 사용하므로, 실제 키를 설정한 후의 라이브 생성 여부는 별도로 확인해야 한다.
전체 프로젝트 검사는 기존 lint/typecheck/build 명령을 사용한다.

참고: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs),
[GPT-5.4 Mini 지원 기능](https://developers.openai.com/api/docs/models/gpt-5.4-mini).
