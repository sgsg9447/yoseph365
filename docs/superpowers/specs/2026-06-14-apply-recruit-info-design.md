# 과정별 모집안내 DB화 + 모집상태 신청버튼 게이팅 — 설계서

| 항목 | 내용 |
| --- | --- |
| 작성일 | 2026-06-14 |
| 슬라이스 | 신청(apply) 1차 — 모집안내 표시 + 모집상태 게이팅 (폼 제출은 다음) |
| 정본 | 운영자 제공 이미지(2026-06-14): 모집안내/훈련상세 |

## 1. 결정 사항 (운영자 확정)
- **평일 집수리 = 국비지원(B)** — 이미지4(훈련비용 1,950,480원·내일배움카드·고용24 등록). funding_type을 `경기도무료`→`국비지원`으로 변경. 이미지1(경기도 숙련건설/방문접수)은 현재 미사용.
- **자격증 과정**: 건축목공기능사·건축도장기능사 **둘 다 마감**(신청 버튼 비활성화), 단 **트랙별 별도 수강신청**. → `course_track`에 `recruit_status` 추가, 트랙별 신청 버튼.
- **모집안내 = DB 관리** → `course_apply_info` 테이블 신설.
- **모집기간(recruit_period)은 빈값**(추후 운영자 입력).

## 2. 범위
**포함**: 모집안내 DB 모델/시드, apply 페이지 과정별 모집안내 DB 읽기, 모집상태(`recruit_status`) 기반 수강신청 버튼 활성/비활성, 자격증 트랙별 신청 버튼.
**제외(다음 슬라이스)**: 실제 폼 제출(Server Action + zod + `application` INSERT), 상담문의 게시판, S3.

## 3. 스키마 변경 (init 마이그레이션 수정 + reset)
- `course` 시드: `course_weekday_repair` funding_type `경기도무료`→`국비지원`.
- `course_track`: **`recruit_status recruit_status not null default '모집중'`** 추가. 두 트랙 시드값 `마감`.
- 신규 **`course_apply_info`** (1:1 with course):
  | 컬럼 | 타입 |
  | --- | --- |
  | course_id | text PK, FK→course(on delete cascade) |
  | qualifications | text[] (신청자격) |
  | recruit_period | text (모집기간, 빈 가능) |
  | training_period | text (훈련기간) |
  | training_time | text[] (훈련시간 여러 줄) |
  | capacity | text (모집인원, nullable) |
  | cost | text (훈련비용) |
  | cost_notes | text[] (내배카 자비부담 등) |
  | steps | text[] (진행순서/등록방법) |
  | exclusions | text[] (신청제외대상) |
  | updated_at | timestamptz |
- RLS: `course_apply_info` 공개 SELECT + 관리자 ALL. GRANT select to anon.

## 4. 시드 — course_apply_info (이미지 정본)
공통 `steps`(고용24 등록방법, 이미지4): 학원 전화 등록여부 확인 / 방문·전화 가등록 신청 / 고용24 수강신청 후 자비부담금 결제 / 등록 완료.
공통 `exclusions`(7항목, 국비 표준): 기존 APPLY_INFO와 동일.

| course | training_period | training_time | capacity | cost | cost_notes |
| --- | --- | --- | --- | --- | --- |
| 평일 집수리 | 26.08.24~26.10.13 (월~금, 총 33일) | 09:00~17:40 (1일 8시간, 총 264시간) | 16명 | 1,950,480원 | 내배카 보유시 최대자비부담금 780,170원 / 훈련생별 상이→고용24 확인 |
| 주말 건축목공 | 26.07.11~26.09.13 (총 18일) | 토 09:00~17:40(8시간) / 일 09:00~15:40(6시간) / 총 128시간, 마지막날 8시간 | — | 1,022,960원 | 내배카 보유시 최대자비부담금 455,540원 / 유형별 상이→고용24 확인 |
| 주말 인테리어필름 | 26.07.25~26.10.04 (총 18일) | 토 09:00~17:40(8시간) / 일 09:00~15:40(6시간) / 마지막날 09:00~17:40(8시간) | — | 922,960원 | 내배카 사용시 최대자비부담금 355,540원 / 훈련별 상이→고용24 확인 |

`qualifications`(공통): 내일배움카드(국민내일배움카드) 보유자.
`recruit_period`: 빈값.

**가정/공백 (운영자 검토 요망)**:
- 신청자격 문구는 "내일배움카드 보유자"로 통일(이미지2 기준). 면접 등본 확인 등은 미포함.
- 진행순서(steps)는 이미지4 등록방법(고용24 4단계)을 모든 국비 과정 공통 적용.
- **평일 건축목공과정**은 모집안내 이미지가 없어 시드 없음 → apply 페이지에서 "상담 안내" 대체 표시.
- 자격증 과정/트랙은 둘 다 마감이라 모집안내(course_apply_info) 시드 없음.

## 5. 읽기·매핑·UI
- 뷰 타입: `ApplyInfoView`(위 필드 camelCase), `CatalogCourse.recruitStatus` 추가, `TrackView.recruitStatus` 추가.
- 쿼리: `getApplyCourses()` → `{ name, recruitStatus, applyInfo: ApplyInfoView | null }[]` (picker + 게이팅 + 모집안내). catalog 쿼리에 recruit_status·트랙 recruit_status 포함.
- UI:
  - **apply 페이지**: 서버에서 위 데이터 fetch → ApplyClient/ApplyFlow에 props. 모집안내 단계가 DB 값 렌더(훈련기간·훈련시간·모집인원·훈련비용+notes·진행순서·제외대상). 모집안내 없으면 "상담 안내 + 전화" 대체.
  - **수강신청 버튼 게이팅**: `recruitStatus !== '모집중'`이면 버튼 비활성(회색·클릭불가) + "현재 모집중이 아닙니다" 표기.
  - **자격증 상세(CourseCatalog)**: 단일 버튼 제거 → **트랙별 수강신청 버튼**(트랙 recruitStatus로 활성/비활성). 둘 다 마감이라 현재 비활성.

## 6. 검증
1. db:reset → course_apply_info 3행, 트랙 recruit_status='마감' 2행, 평일집수리 funding='국비지원'
2. gen:types, 매핑 테스트(TDD) green, tsc/lint
3. /apply?course=주말 건축목공과정 → 훈련기간·비용·진행순서 DB값 표시
4. 자격증 상세 → 트랙별 버튼 2개 모두 비활성
5. build 성공
