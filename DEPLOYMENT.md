# Vercel 배포/운영 가이드

이 문서는 Vercel + Vercel Postgres 기준으로 배포, 스케줄링, 실행 방법을 정리합니다.

## 1) Vercel 프로젝트 구성

모노레포에서 **프로젝트를 2개**로 분리하여 연결합니다.

- 프로젝트 A: `apps/web` (관리자 UI)
- 프로젝트 B: `apps/api` (API + 크론)

각 프로젝트의 **Root Directory**를 각각 `apps/web`, `apps/api`로 지정합니다.

## 2) Vercel Postgres 연결

- Vercel 대시보드에서 Postgres 생성
- `apps/api` 프로젝트에 연결
- 환경변수 `DATABASE_URL` 자동 주입 확인

## 3) 환경변수 설정

`apps/api` 프로젝트 기준으로 아래를 설정합니다.

필수
- `ADMIN_PASSWORD`: 키워드 관리 UI 접근 토큰
- `DATABASE_URL`: Vercel Postgres
- `CRON_SECRET`: 크론 호출용 Bearer 토큰
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`: 네이버 뉴스 API
- `NAVER_PAGE_SIZE`: 네이버 요청 1회당 건수 (기본 100)
- `NAVER_MAX_FETCH_PER_KEYWORD`: 키워드당 최대 수집량 (기본 300, 최대 1000)
- `RESEND_API_KEY`, `REPORT_EMAIL_FROM`, `REPORT_EMAIL_TO`: 이메일 발송

선택
- `GOOGLE_NEWS_HL=ko`
- `GOOGLE_NEWS_GL=KR`
- `GOOGLE_NEWS_CEID=KR:ko`
- `REPORT_WINDOW_HOURS=24`
- `REPORT_MAX_ARTICLES=200`
- `REPORT_RISK_TERMS=리콜,불매,논란,소송,저작권,유출`
- `DEDUPE_TITLE_THRESHOLD=0.82`
- `LARK_WEBHOOK_URL`: Lark 봇 웹훅 URL (설정 시 이메일과 함께 발송)
- `LARK_MAX_TEXT_LENGTH=3500`: Lark 메시지 텍스트 최대 길이

`apps/web` 프로젝트에는 아래를 설정합니다.
- `NEXT_PUBLIC_API_BASE_URL`: `https://<api-project>.vercel.app`

## 4) DB 초기화 (Prisma)

로컬에서 1회 실행:

```bash
npm install
npm run prisma:generate -w packages/db
npm run prisma:push -w packages/db
```

Vercel에서도 `DATABASE_URL`이 세팅되어 있어야 합니다.

## 5) 스케줄러 설정

Vercel Scheduler에서 `apps/api`의 크론 엔드포인트를 매일 호출합니다.

- URL: `https://<api-project>.vercel.app/api/cron`
- Method: `GET`
- Header: `Authorization: Bearer <CRON_SECRET>`

## 6) 로컬 실행

```bash
npm install
npm run dev:web
npm run dev:api
```

- UI: `http://localhost:3000`
- API: `http://localhost:3001` (Next 기본 포트가 충돌 없을 때)

## 7) 동작 흐름 요약

1. 키워드 관리 UI에서 키워드 저장
2. 크론이 `/api/cron` 호출
3. 네이버 API + 구글 RSS 수집
4. 중복 제거 및 DB 저장
5. 최근 기사 이메일 리포트 발송

## 8) Lark 봇 생성 및 연동 (상세)

### A. Lark에서 봇 만들기

1. Lark 개발자 콘솔로 이동
2. `Create App` 생성
3. 앱 유형에서 Bot 사용 가능 상태 확인
4. Bot 설정에서 `Enable bot` 또는 봇 기능 활성화

### B. Incoming Webhook 발급

1. 봇 설정에서 `Webhook` 또는 `Bot Webhook` 항목 이동
2. 웹훅 URL 생성
3. 필요 시 보안 옵션(서명 검증, 키워드 제한, IP 제한) 설정

### C. Vercel 환경변수 연결

`apps/api` 프로젝트 환경변수에 추가:

- `LARK_WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/...`
- `LARK_MAX_TEXT_LENGTH=3500` (선택)

변경 후 `Redeploy` 실행

### D. 동작 확인

1. 관리자 UI에서 `지금 메일 발송` 버튼 클릭
2. API 응답에서 `report.larkSent: true` 확인
3. Lark 채널에 리포트 메시지 수신 확인

### E. 문제 발생 시 체크

1. `LARK_WEBHOOK_URL` 오타/공백 확인
2. Lark 봇이 채널에 실제로 초대되어 있는지 확인
3. Lark 웹훅 보안 설정(키워드/서명/IP)이 현재 요청과 맞는지 확인
4. API 응답의 `report.larkReason` 값 확인
