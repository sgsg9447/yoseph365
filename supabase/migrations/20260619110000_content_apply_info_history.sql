-- 콘텐츠 수정(운영 반영용 데이터 마이그레이션). 멱등하게 작성.

-- 신청정보(집수리·주말목공·주말필름): 신청자격에 '일반' 추가, 모집기간 선착순, 신청제외 삭제
update course_apply_info
set qualifications = array_append(qualifications, '일반'),
    recruit_period = '개강 전까지 선착순 모집',
    exclusions = '{}'
where course_id in ('course_weekday_repair', 'course_weekend_carpentry', 'course_weekend_interior_film')
  and not ('일반' = any (qualifications));

-- 모집기간/신청제외는 위에서 '일반' 추가된 경우만 반영되므로, 이미 일반이 있는 경우도 강제 동기화
update course_apply_info
set recruit_period = '개강 전까지 선착순 모집',
    exclusions = '{}'
where course_id in ('course_weekday_repair', 'course_weekend_carpentry', 'course_weekend_interior_film');

-- 학원 연혁 2025: 이수자평가 A등급 추가
insert into about_history_item (history_id, content, is_highlighted, display_order)
select ah.id, '이수자평가 A등급 획득', true, 2
from about_history ah
where ah.year = 2025
  and not exists (
    select 1 from about_history_item i
    where i.history_id = ah.id and i.content = '이수자평가 A등급 획득'
  );
