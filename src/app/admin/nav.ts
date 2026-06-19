// src/app/admin/nav.ts
export interface AdminTab {
  key: string;
  href: string;
  label: string;
  title: string;
  desc: string;
  countKey?: "pending" | "newInquiries";
}

export const ADMIN_TABS: AdminTab[] = [
  { key: "overview", href: "/admin", label: "대시보드", title: "대시보드", desc: "학원 운영 현황 요약" },
  { key: "clicks", href: "/admin/clicks", label: "과정별 클릭률", title: "과정별 클릭률", desc: "과정 상세 페이지 클릭·전환" },
  { key: "enroll", href: "/admin/enroll", label: "수강신청 현황", title: "수강신청 현황", desc: "수강신청·가등록 접수 내역", countKey: "pending" },
  { key: "consult", href: "/admin/consult", label: "상담문의", title: "상담문의 현황", desc: "상담 문의 접수 내역", countKey: "newInquiries" },
  { key: "course", href: "/admin/courses", label: "과정 수정", title: "과정 수정", desc: "과정 정보·모집상태 관리" },
  // 배너 관리 — 추후 사용 예정. 코드(app/admin/(dashboard)/banner)는 유지하고 사이드바에서만 숨김.
  // { key: "banner", href: "/admin/banner", label: "배너 관리", title: "배너 관리", desc: "홈 히어로 배너 슬라이드 관리" },
  { key: "photo", href: "/admin/photos", label: "훈련 사진", title: "훈련 사진 업로드", desc: "훈련 현장 사진 관리" },
  { key: "notice", href: "/admin/notice", label: "공지사항", title: "공지사항 게시판", desc: "공지 작성·관리" },
];
