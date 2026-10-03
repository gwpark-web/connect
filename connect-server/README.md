# 커넥트 백엔드 (connect-server)

Node 내장 모듈만 쓰므로 `npm install`이 필요 없습니다. (Node 18 이상)

## 시작하기
```bash
cd connect-server
cp .env.example .env     # 이미 .env 가 있으면 건너뜁니다 (git 에는 올라가지 않음)
# .env 를 열어 계정 비밀번호와 YOUTUBE_API_KEY 를 채웁니다
node server.js           # http://localhost:4000
```
프런트(`connect/`)는 localhost 에서 열면 자동으로 이 서버를 찾습니다. 서버가 꺼져 있으면 기존 데모 동작으로 넘어갑니다.

## .env 항목
| 키 | 설명 |
|---|---|
| `PORT` | 기본 4000 |
| `ALLOWED_ORIGINS` | 요청을 허용할 화면 주소(쉼표 구분). 배포 주소가 생기면 추가 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 관리자 계정 |
| `ZEAL_ADMIN_BASE` / `ZEAL_ADMIN_COOKIE` | (선택) 짤 어드민 주소와 로그인 쿠키. 넣으면 자동 조회가 CID로 짤 회원 정보를 어드민에서 직접 가져옵니다. 쿠키는 로그인이 만료되면 새로 복사해 넣어야 하며, 비워 두면 저장된 회원 목록으로만 조회합니다 |
| `ADVERTISERS` | `이메일\|비밀번호\|브랜드명 ; ...` — 브랜드명이 캠페인의 광고주와 같은 캠페인만 보임 |
| `TOKEN_SECRET` | 로그인 토큰 서명값(비우면 `data/secret.key` 자동 생성) |
| `YOUTUBE_API_KEY` | YouTube Data API v3 키 — **이 파일에만** 넣고 대화·코드·깃에는 올리지 마세요 |
| `LOGIN_RATE_LIMIT` | IP당 1분 로그인 시도 횟수(기본 10) |

## API
모든 응답은 JSON. 로그인 후 받은 토큰을 `Authorization: Bearer <token>` 으로 보냅니다.

| 메서드 · 경로 | 권한 | 설명 |
|---|---|---|
| `GET /api/health` | 누구나 | 서버·계정·YouTube 키 설정 여부 |
| `POST /api/login` | 누구나 | `{email, password}` → `{token, user}` |
| `GET /api/me` | 로그인 | 현재 사용자 |
| `GET /api/campaigns` | 로그인 | 관리자는 전체, 광고주는 자기 브랜드만 |
| `POST /api/campaigns` · `PATCH/DELETE /api/campaigns/:id` | 관리자 | 캠페인 등록·수정·삭제 |
| `GET /api/videos?campaign=` | 로그인 | 참여 영상 리포트 조회 |
| `POST /api/videos?campaign=` | 관리자 | 리포트 업로드(올린 파일에 있는 플랫폼의 기존 행만 지우고 교체, 다른 플랫폼·다른 campaign 은 유지). `영상 URL` 열이 있으면 갱신에 사용 |
| `POST /api/report/lookup` | 관리자 | `{campaign, urls:[...]}` **자동 조회** — URL로 YouTube 영상·채널 정보를 가져오고, 채널 ID(CID)로 짤 회원까지 조회해 리포트에 저장(같은 채널명은 한 줄) |
| `GET /api/zeal/members` · `POST /api/zeal/import` | 관리자 | 짤 회원 목록 조회 / 수집 도구(`data-zeal.json`) 형식으로 가져오기 |
| `POST /api/refresh` | 관리자 | `{campaign, platform}` 조회수 갱신. 캠페인×플랫폼 하루 1회(한국시간 자정 초기화) |
| `POST /api/youtube/channels` | 관리자 | `{cids:[UC...]}` 채널명·구독자·평균 쇼츠 조회수 |
| `GET/POST /api/zeal-memos` | 관리자 | 짤 회원 메모 |

## 저장소
`data/db.json`(JSON 파일). 파일은 임시 파일에 쓴 뒤 교체해서 중간에 꺼져도 깨지지 않습니다.
사용자가 늘면 DB(SQLite/Postgres)로 바꾸는 자리입니다.

## 아직 연결되지 않은 것
- 인스타그램/틱톡 조회수 갱신(비즈니스 계정·API 승인 필요) → 서버가 "미지원"으로 안내
- 프리미엄(채널 선정) 화면의 조회수 갱신은 아직 시뮬레이션
- 캠페인별 상세·리포트 화면(지금 새 캠페인의 상세는 빈 화면)
- 짤 어드민 직접 조회는 로그인 쿠키(`ZEAL_ADMIN_COOKIE`)를 .env 에 넣어야 하고 만료되면 갱신이 필요합니다(어드민에 서버용 API 키/계정이 생기면 교체)
- 비밀번호는 `.env`에 평문 → 계정이 늘면 해시 저장 + 계정 관리 화면 필요

## 짤 회원 조회 순서
1. 서버에 저장된 회원 정보(수집 도구로 가져온 `data-zeal.json` 또는 이전에 조회한 결과)
2. 없으면 짤 어드민 직접 조회(위 두 값이 설정된 경우): `채널(CID) → user_uid → 회원 상세(연락처·메모)`
3. 어드민 로그인이 만료되면 YouTube 정보는 그대로 반영하고 "짤 어드민 로그인 만료" 경고만 표시합니다.

연락처 같은 개인정보는 관리자 로그인에서만 내려가고, 로그에는 남기지 않으며, 리포트 저장 데이터에는 섞이지 않습니다.
