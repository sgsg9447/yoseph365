import { describe, it, expect } from "vitest";
import {
  toEnrollmentView,
  toInquiryView,
  inquiryStatusLabel,
  countPending,
  countNewInquiries,
  extractNoteField,
  type EnrollmentView,
  type InquiryView,
} from "./admin";
import { filterInquiries } from "@/lib/admin/inquiry";
import { filterEnrollments, paginate } from "@/lib/admin/enroll";

const appRow = {
  id: 1, name: "김지희", phone: "01012345678",
  selected_courses: ["목공 기초 종합반", "집수리 실무반"],
  status: "신규" as const, created_at: "2026-06-15T02:00:00Z",
  admin_memo: "전화 연결 안 됨",
  additional_note: "생년월일: 1980.05.01\n성별: 남\n주소: 수원시\n관련 경력: 목공 2년\n지원동기: 취업",
};

describe("toEnrollmentView", () => {
  it("관리자용 — 이름·연락처를 마스킹하지 않고 그대로 노출한다", () => {
    const v = toEnrollmentView(appRow);
    expect(v.name).toBe("김지희");
    expect(v.phone).toBe("01012345678");
    expect(v.date).toBe("2026.06.15");
    expect(v.status).toBe("신규");
  });

  it("선택 과정 전체(courses)와 메모를 노출한다", () => {
    const v = toEnrollmentView(appRow);
    expect(v.courses).toEqual(["목공 기초 종합반", "집수리 실무반"]);
    expect(v.course).toBe("목공 기초 종합반");
    expect(v.memo).toBe("전화 연결 안 됨");
  });

  it("생년월일·성별을 additional_note에서 파싱해 노출한다", () => {
    const v = toEnrollmentView(appRow);
    expect(v.birth).toBe("1980.05.01");
    expect(v.gender).toBe("남");
  });

  it("주소·관련경력·지원동기를 additional_note에서 파싱해 노출한다", () => {
    const v = toEnrollmentView(appRow);
    expect(v.address).toBe("수원시");
    expect(v.career).toBe("목공 2년");
    expect(v.motivation).toBe("취업");
  });

  it("항목이 없으면 빈 문자열", () => {
    const v = toEnrollmentView({ ...appRow, additional_note: "주소: 수원시" });
    expect(v.birth).toBe("");
    expect(v.gender).toBe("");
    expect(v.address).toBe("수원시");
    expect(v.career).toBe("");
    expect(v.motivation).toBe("");
  });

  it("메모·추가정보가 null이면 빈 문자열", () => {
    const v = toEnrollmentView({ ...appRow, admin_memo: null, additional_note: null });
    expect(v.memo).toBe("");
    expect(v.address).toBe("");
  });
});

describe("extractNoteField", () => {
  const note = "생년월일: 1980.05.01\n성별: 남\n주소: 수원시 장안구";

  it("라벨에 해당하는 값을 반환", () => {
    expect(extractNoteField(note, "성별")).toBe("남");
    expect(extractNoteField(note, "주소")).toBe("수원시 장안구");
  });

  it("없는 라벨이면 빈 문자열", () => {
    expect(extractNoteField(note, "이메일")).toBe("");
  });

  it("빈 노트면 빈 문자열", () => {
    expect(extractNoteField("", "성별")).toBe("");
  });
});

describe("filterEnrollments", () => {
  const rows: EnrollmentView[] = [
    { id: 1, name: "A", course: "목공", courses: ["목공"], phone: "p", date: "d", status: "신규", birth: "", gender: "", address: "", career: "", motivation: "", memo: "" },
    { id: 2, name: "B", course: "집수리", courses: ["집수리", "목공"], phone: "p", date: "d", status: "등록확인", birth: "", gender: "", address: "", career: "", motivation: "", memo: "" },
    { id: 3, name: "C", course: "인테리어", courses: ["인테리어"], phone: "p", date: "d", status: "신규", birth: "", gender: "", address: "", career: "", motivation: "", memo: "" },
  ];

  it("전체/전체면 모두 통과", () => {
    expect(filterEnrollments(rows, { status: "전체", course: "전체" })).toHaveLength(3);
  });

  it("상태로 필터링", () => {
    const r = filterEnrollments(rows, { status: "신규", course: "전체" });
    expect(r.map((x) => x.id)).toEqual([1, 3]);
  });

  it("과정으로 필터링 — 선택 과정에 포함되면 통과", () => {
    const r = filterEnrollments(rows, { status: "전체", course: "목공" });
    expect(r.map((x) => x.id)).toEqual([1, 2]);
  });

  it("상태+과정 동시 필터링", () => {
    const r = filterEnrollments(rows, { status: "신규", course: "목공" });
    expect(r.map((x) => x.id)).toEqual([1]);
  });

  it("이름 검색(query)으로 필터링 — 대소문자 무시", () => {
    const named: EnrollmentView[] = [
      { id: 1, name: "김철수", course: "x", courses: ["x"], phone: "p", date: "d", status: "신규", birth: "", gender: "", address: "", career: "", motivation: "", memo: "" },
      { id: 2, name: "이영희", course: "x", courses: ["x"], phone: "p", date: "d", status: "신규", birth: "", gender: "", address: "", career: "", motivation: "", memo: "" },
    ];
    const r = filterEnrollments(named, { status: "전체", course: "전체", query: "영희" });
    expect(r.map((x) => x.id)).toEqual([2]);
  });

  it("query가 공백이면 무시", () => {
    expect(filterEnrollments(rows, { status: "전체", course: "전체", query: "   " })).toHaveLength(3);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("페이지당 10개, 1페이지", () => {
    const r = paginate(items, 1, 10);
    expect(r.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(r.total).toBe(25);
    expect(r.totalPages).toBe(3);
    expect(r.page).toBe(1);
  });

  it("2페이지는 다음 10개", () => {
    expect(paginate(items, 2, 10).items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });

  it("범위를 넘는 페이지는 마지막 페이지로 클램프", () => {
    const r = paginate(items, 99, 10);
    expect(r.page).toBe(3);
    expect(r.items).toEqual([21, 22, 23, 24, 25]);
  });

  it("빈 목록은 totalPages 1, items 빈 배열", () => {
    const r = paginate([], 1, 10);
    expect(r.totalPages).toBe(1);
    expect(r.items).toEqual([]);
    expect(r.page).toBe(1);
  });
});

describe("inquiryStatusLabel", () => {
  it("답변대기→신규, 답변완료→완료", () => {
    expect(inquiryStatusLabel("답변대기")).toBe("신규");
    expect(inquiryStatusLabel("답변완료")).toBe("완료");
  });
});

describe("toInquiryView", () => {
  const baseRow = {
    id: 9, name: "박민수", phone: "01055556666",
    category: "국비지원" as const,
    content: "문의합니다", status: "답변대기" as const,
    created_at: "2026-06-17T05:00:00Z",
  };

  it("관리자용 — 이름·연락처를 마스킹하지 않고 그대로 노출", () => {
    const v = toInquiryView(baseRow);
    expect(v.name).toBe("박민수");
    expect(v.phone).toBe("01055556666");
    expect(v.interest).toBe("국비지원");
    expect(v.status).toBe("신규");
    expect(v.message).toBe("문의합니다");
  });

  it("과정명 전달 시 interest=과정명", () => {
    const v = toInquiryView(baseRow, "목공 기초 종합반");
    expect(v.interest).toBe("목공 기초 종합반");
  });
});

describe("filterInquiries", () => {
  const rows: InquiryView[] = [
    { id: 1, name: "A", phone: "p", interest: "x", message: "m", date: "d", status: "신규" },
    { id: 2, name: "B", phone: "p", interest: "x", message: "m", date: "d", status: "완료" },
    { id: 3, name: "C", phone: "p", interest: "x", message: "m", date: "d", status: "신규" },
  ];
  it("전체는 모두", () => {
    expect(filterInquiries(rows, "전체")).toHaveLength(3);
  });
  it("신규/완료 필터", () => {
    expect(filterInquiries(rows, "신규").map((r) => r.id)).toEqual([1, 3]);
    expect(filterInquiries(rows, "완료").map((r) => r.id)).toEqual([2]);
  });
});

describe("카운트 도출", () => {
  it("countPending = status '신규' 개수", () => {
    expect(countPending([{ status: "신규" }, { status: "상담중" }, { status: "신규" }])).toBe(2);
  });
  it("countNewInquiries = '답변대기' 개수", () => {
    expect(countNewInquiries([{ status: "답변대기" }, { status: "답변완료" }])).toBe(1);
  });
});
