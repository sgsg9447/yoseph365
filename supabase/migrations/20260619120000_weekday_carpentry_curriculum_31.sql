-- 경기도 평일목공과정(course_weekday_carpentry) 커리큘럼 31회차·회차당 6H로 전면 교체.
-- 신규 db reset(마이그레이션이 seed보다 먼저 실행) 시 course가 아직 없을 수 있으므로,
-- INSERT는 course 존재 시에만 수행하도록 가드(운영 DB엔 course가 있어 정상 반영).

delete from curriculum_item where course_id = 'course_weekday_carpentry';

insert into curriculum_item (course_id, round, unit, contents, hours, place)
select v.course_id, v.round, v.unit, v.contents, v.hours, v.place
from (values
  ('course_weekday_carpentry', 1,  '학습목표숙지, 목공이론', '{"오리엔테이션, 재료의 종류 및 특성 이해"}'::text[], 6, '강의실'),
  ('course_weekday_carpentry', 2,  '목공이론', '{"자재의 종류 및 특성 이해"}'::text[], 6, '강의실'),
  ('course_weekday_carpentry', 3,  '목공이론, 직장예절교육, 중대재해처벌법 및 산업안전보건교육', '{"자재의 종류 및 특성 이해","직장예절교육","중대재해처벌법 및 산업안전보건교육"}'::text[], 6, '강의실'),
  ('course_weekday_carpentry', 4,  '구직스킬, 기초안전보건교육', '{"구직스킬","기초안전보건교육"}'::text[], 6, '강의실/외부교육기관'),
  ('course_weekday_carpentry', 5,  '공구이해하기', '{"전동공구실습"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 6,  '공구이해하기', '{"전동공구실습"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 7,  '공구이해하기', '{"전동공구실습"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 8,  '공구이해하기', '{"전동공구실습"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 9,  '공구이해하기', '{"수공구실습"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 10, '공구이해하기', '{"에어공구실습"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 11, '공구이해하기', '{"에어공구실습"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 12, '공구이해하기', '{"총괄공구실습"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 13, '현장안전 / 벽설치', '{"현장안전교육","구조틀 설치하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 14, '벽설치', '{"구조틀 설치하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 15, '벽설치', '{"구조틀 설치하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 16, '벽설치', '{"보드합판, 합지판 붙이기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 17, '벽설치', '{"보드합판, 합지판 붙이기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 18, '벽설치', '{"몰딩 설치하기, 선반 설치하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 19, '목재창호제작설치', '{"문틀 제작하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 20, '목재창호제작설치', '{"창호 설치하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 21, '목재창호제작설치', '{"창호 설치하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 22, '천장설치', '{"구조틀 제작하기, 커튼박스 설치하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 23, '천장설치', '{"구조틀 제작하기, 커튼박스 설치하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 24, '천장설치', '{"보드합판, 합지판 붙이기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 25, '천장설치', '{"천장 등박스 설치하기, 몰딩 설치하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 26, '천장설치', '{"천장 등박스 설치하기, 몰딩 설치하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 27, '바닥설치', '{"바닥 구조틀 설치하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 28, '바닥설치', '{"마루판, 걸레받이 설치하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 29, '바닥설치', '{"데크 설치하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 30, '보양현장정리', '{"보양하기, 청소하기, 잔여자재 처리하기"}'::text[], 6, '목공실습실'),
  ('course_weekday_carpentry', 31, '평가 및 수료식', '{"평가, 견적산출, 수료식"}'::text[], 6, '목공실습실/강의실')
) as v(course_id, round, unit, contents, hours, place)
where exists (select 1 from course c where c.id = 'course_weekday_carpentry');

update course
set sessions_total = 31, session_hours = '6H', total_hours = 186
where id = 'course_weekday_carpentry';
