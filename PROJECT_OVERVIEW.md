# Daily News Crawler 구현 요약

이 문서는 지금까지 구현한 구조/실행/핵심 파일을 요약합니다.

## 1) 구현 방식 요약

- **모노레포**로 FE/BE/공용 모듈을 한 레포에서 관리
- **Vercel 배포**를 전제로 FE/BE를 각각 별도 프로젝트로 연결
- **뉴스 수집**
  - 네이버: 공식 Search API 사용
  - 구글: Google News RSS 사용 (비공식)
- **중복 제거**
  - URL 중복 제거 → 제목 유사도 기반 2차 중복 제거
- **리포팅**
  - Resend로 이메일 발송
  - 키워드 그룹 + 리스크 키워드 강조 섹션 포함

## 2) 실행 방법 (로컬)

```bash
npm install
npm run prisma:generate -w packages/db
npm run prisma:push -w packages/db
npm run dev:web
npm run dev:api
```

## 3) 실행 방법 (Vercel)

- `apps/web`, `apps/api`를 각각 별도 프로젝트로 연결
- Vercel Postgres를 `apps/api`에 연결
- Scheduler로 `/api/cron`을 매일 호출
- 상세는 `DEPLOYMENT.md` 참고

## 4) 핵심 파일 정리

### 공용/루트
- `package.json` : 워크스페이스/스크립트
- `.env.example` : 환경변수 템플릿
- `README.md` : 전체 개요
- `DEPLOYMENT.md` : 배포/운영 가이드

### FE (관리 UI)
- `apps/web/src/app/page.tsx`
  - 키워드 CRUD UI (토큰 기반 접근)

### BE (API + 크론)
- `apps/api/src/app/api/keywords/route.ts`
  - 키워드 조회/저장 API
- `apps/api/src/app/api/cron/route.ts`
  - 크론 엔드포인트 (수집 + 리포트)
- `apps/api/src/lib/auth.ts`
  - 관리자 토큰 검증

### 크롤러/리포트 로직
- `packages/core/src/index.ts`
  - 크롤링 실행, 중복 제거, DB 저장
- `packages/core/src/sources/naver.ts`
  - 네이버 API 호출
- `packages/core/src/sources/google.ts`
  - Google News RSS 호출
- `packages/core/src/dedupe.ts`
  - 제목 유사도 중복 제거
- `packages/core/src/report.ts`
  - 리포트 HTML/텍스트 생성
- `packages/core/src/reportRunner.ts`
  - 리포트 실행 (메일 발송)
- `packages/core/src/mailer.ts`
  - Resend 메일 발송
- `packages/core/src/risk.ts`
  - 리스크 키워드 관리

### DB
- `packages/db/prisma/schema.prisma`
  - Keyword/Article 스키마
- `packages/db/src/index.ts`
  - Prisma 클라이언트

## 5) 크론 동작 흐름

1. `/api/cron` 호출
2. 키워드 조회
3. 네이버/구글 뉴스 수집
4. URL + 제목 유사도 중복 제거
5. DB 저장
6. 최근 기사 이메일 리포트 발송

