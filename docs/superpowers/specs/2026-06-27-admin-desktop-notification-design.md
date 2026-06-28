# admin 데스크탑 알림 (폴링 기반) — 설계서

- 작성일: 2026-06-27
- 상태: 설계 확정 (구현 대기)

## 1. 목적 / 배경

공개 사이트에서 **수강신청(`application`)** 또는 **상담문의(`inquiry`)** 가 새로 접수되면,
admin 페이지를 열어둔 운영자가 **OS 데스크탑 알림(Web Notifications API) + 소리**로 즉시 인지한다.

- Resend 등 외부 이메일 연동은 이번 범위 밖(추후).
- 탭이 닫혀 있어도 오는 푸시(서비스워커/Web Push)도 이번 범위 밖(추후).
- 즉, 이번 작업은 **"admin 탭이 열려 있는 동안" 운영자에게 새 접수를 알리는 것**으로 한정한다.

## 2. 핵심 결정 (확정)

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| 감지 방식 | **폴링 (~30초)** | 단순·안정. 실패가 HTTP 에러로 눈에 보임(침묵 실패 방지). 마이그레이션·realtime RLS 불필요. |
| 제출 에러(방문자 제출 실패) 개발자 알림 | **이번 제외** | DB에 행이 없으면 폴링·realtime 모두 감지 불가. 별도 기능(에러 로깅/Sentry/이메일)으로 추후. |
| 알림 문구 | **과정·구분까지** (이름·연락처 등 PII 제외) | 옆 사람에게 배너가 보여도 안전하면서 어떤 건인지 즉시 파악. |
| 소리 | **포함** (뮤트 토글) | 운영자가 자리를 비워도 인지. |
| 백로그 재생 | **안 함** — 탭 열 때부터 들어온 건만 알림 | 닫혀 있던 동안의 건은 사이드바 뱃지 카운트가 이미 표시. 중복 안내 방지. |
| 대상 | `application`, `inquiry`만 | 사용자가 명시한 "수강신청·상담문의". `waitlist`는 범위 밖. |

## 3. 데이터 / 인증 전제 (확인됨)

- RLS: 제출 테이블은 anon은 INSERT만, **authenticated(관리자)만 SELECT** 가능
  → 폴링은 반드시 **Next 서버(authenticated 세션)** 를 거친다. 브라우저(anon) 직접 조회 불가.
- 미들웨어(`src/proxy.ts`) matcher는 `/admin/:path*` 뿐 → `/api/admin/*`는 가로채지 않음
  → **라우트 핸들러가 자체적으로 `auth.getUser()` 인증 체크** 필요(미인증 401). RLS가 이중 방어.
- `application`: 단일 `course_id`가 아니라 `selected_courses text[]`(과정 ID 배열). `status` 기본 `'신규'`.
- `inquiry`: `category`(국비지원/과정문의/기타) + 선택적 `course_id`. `status` 기본 `'답변대기'`.
  → 알림 라벨용 과정명은 **서버에서 과정 ID → `course.title`** 로 변환해 만든다.

## 4. 구성요소 (신규 파일 3개, DB 변경 없음, 신규 의존성 없음)

### 4.1 라우트 핸들러 — `src/app/api/admin/notifications/route.ts`

- `GET /api/admin/notifications?since=<ISO8601>`
- 동작:
  1. `auth.getUser()` → 미인증이면 `401`.
  2. `since` 없으면(첫 폴링) `items` 빈 배열 + 현재 `serverTime`만 반환(= 기준선 설정, 백로그 미재생).
  3. `application` 조회: `created_at > since`, 컬럼 `id, created_at, selected_courses`.
  4. `inquiry` 조회: `created_at > since`, 컬럼 `id, created_at, category, course_id`.
  5. 참조된 과정 ID 전체에 대해 `course`에서 `id, title` 한 번에 조회 → 맵 구성.
  6. 순수 함수로 알림 아이템 생성(§4.2).
- **PII(name·phone·content 등)는 일절 조회·반환하지 않는다.**
- 응답 예:
  ```jsonc
  {
    "serverTime": "2026-06-27T05:12:00.000Z",
    "items": [
      { "type": "application", "id": 12, "label": "주중 목공 기초반" },
      { "type": "inquiry",     "id": 34, "label": "과정문의" }
    ]
  }
  ```
- 클라이언트는 응답의 `serverTime`을 다음 요청의 `since`로 사용(클라이언트 시계 오차 방지).

### 4.2 순수 로직 — `src/lib/admin/notifications.ts` (+ `notifications.test.ts`)

- `buildNotificationItems(apps, inquiries, courseTitleMap)` → `items[]` 생성.
- 라벨 규칙:
  - 수강신청: `selected_courses`의 과정명. 1개면 그대로, 여러 개면 `"OO 외 N건"`, 빈 배열/미상이면 `"신청 과정 미선택"`.
  - 상담문의: `course_id`가 있으면 과정명, 없으면 `category`(예: `"과정문의"`).
- **이 함수만 TDD(red→green→refactor)** 로 작성. 기존 `src/lib/admin/*.test.ts`(vitest) 패턴을 따른다.

### 4.3 클라이언트 컴포넌트 — `src/components/admin/DesktopNotifier.tsx` (`"use client"`)

- topbar에 **종 버튼** + 작은 팝오버:
  - 토글 1: 데스크탑 알림 on/off
  - 토글 2: 소리 on/off
  - 상태 표시: 정상(초록 점) / **연결 오류**(빨강 점) / 권한 차단(안내 문구)
  - 설정은 `localStorage`에 저장(재방문 시 유지).
- 동작:
  - 켤 때(클릭 = 사용자 제스처) `Notification.requestPermission()` 호출 + `AudioContext` 준비.
  - `setInterval(30s)`로 `/api/admin/notifications?since=...` 폴링.
  - 새 `items`마다 `new Notification(타이틀, { body, icon, tag })` 발생:
    - 수강신청: 타이틀 `"새 수강신청"`, body = `label`
    - 상담문의: 타이틀 `"새 상담문의"`, body = `label`
  - 소리 on이면 짧은 Web Audio 비프 재생(에셋 파일 없음).
  - 알림 클릭 시 `window.focus()` + 해당 페이지로 이동
    (`application` → `/admin/enroll`, `inquiry` → `/admin/consult`).
  - 폴링 실패(네트워크/5xx/401) 시 상태를 "연결 오류"로 표시하고 다음 주기에 재시도.

### 4.4 연결 — `src/app/admin/(dashboard)/AdminShell.tsx`

- topbar 우측(날짜 옆)에 `<DesktopNotifier/>` 마운트. (`AdminShell`은 이미 `"use client"`.)

## 5. 동작이 실제로 보이기 위한 전제 (운영 안내용)

1. 브라우저가 켜져 있고 admin 탭이 열려 있어야 함(완전히 닫으면 알림 없음).
2. 사이트 알림 권한 = 허용.
3. macOS 등 OS 레벨에서 해당 브라우저 앱의 알림 허용 + 집중/방해금지 해제.
   (OS 설정이라 코드로 제어 불가 → 컴포넌트에서 안내 문구로만 처리.)
4. 아이콘·발신자 표기는 브라우저가 사이트 정보(favicon/도메인)로 채움. 완전 커스텀 앱 아이덴티티는 불가.
5. dev는 `localhost`, prod는 HTTPS(Vercel)에서 동작.

## 6. 의도적 스코프 / 비목표 (단순함 우선)

- 백로그 미재생(탭 열기 전 건은 뱃지로만 표시).
- 탭 숨김 시 브라우저가 타이머를 ~60초로 throttle — 허용.
- 여러 admin 탭 동시 오픈 시 알림 중복 가능 — 운영자 1명 기준 무시(중복제거 미구현).
- waitlist(대기신청) 미포함.
- 제출 에러의 개발자 알림 미포함.
- Web Push(닫힌 탭 푸시)·이메일 알림 미포함.

## 7. 검증 계획

- **단위 테스트(TDD)**: `buildNotificationItems`
  - 새 수강신청 1건 → 과정명 라벨.
  - 여러 과정 선택 → `"OO 외 N건"`.
  - 선택 과정 없음 → `"신청 과정 미선택"`.
  - 상담문의 course_id 있음 → 과정명, 없음 → category.
  - 빈 입력 → 빈 배열.
- **수동/preview 검증**: dev 서버 + 공개 폼으로 테스트 제출 → admin에서 알림 배너·소리·클릭 이동 확인, 폴링 실패 시 "연결 오류" 표시 확인.

## 8. 영향 범위 / 리스크

- DB 마이그레이션·RLS 변경 없음, 신규 패키지 없음 → 배포 리스크 낮음.
- 추가 요청: admin 1명 × ~30초 폴링 = 무료 티어 내 무시 가능 수준(설계 검토 시 확인).
- PII는 폴링 응답에 포함되지 않음(도메인 보안 규칙 준수).
