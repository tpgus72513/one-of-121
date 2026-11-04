# 121분의 1 — 오늘 하루, 다른 과로 살아보기

3D 세종캠퍼스를 돌아다니다가 건물에 들어가, 그 과의 하루를 3분 만에 체험하는 웹 게임.

> UDR(언더독 레볼루션) 2026-2학기 미니 프로젝트 · 세종캠 학생이 만든 비공식 프로젝트

- 기획 문서: [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) (폴더 구조 이유는 7-2장, 역할 분담은 9장)
- 스택: Next.js 16 (App Router) + TypeScript + Tailwind · React Three Fiber + drei · Supabase · Vercel

## 처음 한 번 세팅

필요한 것: [Node.js 24](https://nodejs.org) · Git · VS Code (열면 추천 확장 설치 안내가 뜬다 → 설치)

```bash
git clone https://github.com/tpgus72513/one-of-121.git
cd one-of-121
npm install
cp .env.example .env.local   # 값은 팀 단톡방에서 받아서 채운다
npm run dev                   # http://localhost:3000
```

> Windows라면 OneDrive 폴더(바탕 화면·문서) **밖**에 clone 한다 (예: `C:\dev`). `node_modules` 동기화 때문에 느려진다.

## 작업 흐름

`main`에는 직접 push 할 수 없다. 항상 브랜치 → PR → 리뷰 1명 → 합치기.

```bash
git switch main && git pull           # 1. 최신으로
git switch -c feat/phishing-swipe     # 2. 브랜치 만들기 (feat/·fix/·docs/ + 짧은 설명)
# ... 작업 ...
git add . && git commit -m "feat: 피싱 카드 스와이프"
git push -u origin feat/phishing-swipe
gh pr create --fill                   # 3. PR 열기 (또는 GitHub 웹에서)
```

- **리뷰는 돌아가며:** 양동규(A) → 추현지(B) 코드, 추현지(B) → 권세현(C) 코드, 권세현(C) → 양동규(A) 코드. PR을 열면 `CODEOWNERS`가 리뷰어를 자동으로 지정한다.
- PR을 열면 CI(lint · typecheck · build)가 자동으로 돈다. 빨간 X면 합칠 수 없다.
- 합치기는 **Squash and merge** 하나만 켜져 있다. 합치면 브랜치는 자동 삭제.
- **새 npm 패키지가 필요하면** 단톡방에 먼저 말하고, 그 PR에서만 설치한다 (`package-lock.json` 충돌 방지).
- 남의 폴더를 고쳐야 하면 그 폴더 담당에게 먼저 말한다.

## 명령어

| 명령                | 하는 일                                   |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | 개발 서버                                 |
| `npm run lint`      | 코드 문제 검사                            |
| `npm run typecheck` | 타입 검사                                 |
| `npm run build`     | 배포용 빌드 (PR 전에 한 번)               |
| `npm run format`    | 전체 코드 정리 (VS Code는 저장할 때 자동) |

## 폴더 = 담당

| 폴더                                                                                                 | 담당                       |
| ---------------------------------------------------------------------------------------------------- | -------------------------- |
| `src/games/phishing/` · `src/campus/Player.tsx` · `src/app/api/plays/`                               | A 양동규                   |
| `src/games/microscope/` · `src/campus/Building.tsx`, `layout.json` · `src/app/api/result-card/`      | B 추현지                   |
| `src/app/` 페이지들 · `src/games/registry.ts` · `src/campus/Scene.tsx` · `src/data/departments.json` | C 권세현                   |
| `src/games/types.ts`                                                                                 | 셋이 같이 (게임 공통 규칙) |

## AI 코딩 도구를 쓸 때

Next.js 16은 AI가 학습한 옛날 버전과 다른 점이 많다. `AGENTS.md`가 AI에게 `node_modules/next/dist/docs/`의 최신 문서를 먼저 읽으라고 알려준다. 지우지 말 것.
