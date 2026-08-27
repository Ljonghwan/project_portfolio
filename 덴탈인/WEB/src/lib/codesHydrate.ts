// Sprint p2-6 — 서버 /api/codes 응답으로 lib의 가변 라벨맵/옵션/키배열을 채운다.
// codeStore.init()이 1회 호출. 소비처는 기존 export(JOB_TYPE_LABELS 등)를 그대로 읽으므로 무수정.
// (값이 비어있던 객체/배열의 "내용"만 채우므로 import 참조가 그대로 유효)
import type { Code } from "@/stores/codeStore";
import * as jobs from "./jobs";
import * as reviews from "./reviews";
import * as talks from "./talks";
import * as urgents from "./urgents";
import * as reports from "./reports";
import * as qna from "./qna";
import * as postBookmarks from "./postBookmarks";
import * as home from "./home";

type Bundle = Record<string, Code[]>;

// label map(객체) 내용 교체
function fillMap(target: Record<string, string>, codes: Code[] | undefined) {
  if (!codes) return;
  for (const k of Object.keys(target)) delete target[k];
  for (const c of codes) target[c.key] = c.label;
}
// 키 배열 내용 교체
function fillKeys<T extends string>(target: T[], codes: Code[] | undefined) {
  if (!codes) return;
  target.length = 0;
  for (const c of codes) target.push(c.key as T);
}
// {value,label}[] 옵션 배열 내용 교체
function fillOptions<T extends string>(target: { value: T; label: string }[], codes: Code[] | undefined) {
  if (!codes) return;
  target.length = 0;
  for (const c of codes) target.push({ value: c.key as T, label: c.label });
}

let done = false;

export function hydrateCodes(b: Bundle) {
  // jobs
  fillMap(jobs.WORK_TYPE_LABELS, b.workType);
  fillKeys(jobs.WORK_TYPES, b.workType);
  fillMap(jobs.SALARY_TYPE_LABELS, b.salaryType);
  fillKeys(jobs.SALARY_TYPES, b.salaryType);
  fillMap(jobs.CAREER_TYPE_LABELS, b.careerType);
  fillKeys(jobs.CAREER_TYPES, b.careerType);
  fillMap(jobs.JOB_TYPE_LABELS, b.jobType);
  fillKeys(jobs.JOB_TYPES, b.jobType);
  fillMap(jobs.APPLY_METHOD_LABELS, b.applyMethod);
  fillMap(jobs.BENEFIT_LABELS, b.benefit);
  fillKeys(jobs.BENEFIT_CODES, b.benefit);
  fillMap(jobs.AVAILABILITY_LABELS, b.availability);
  // p2-7: 채용 담당업무(urgentJobType 9셋 재사용) + 시안 신규 도메인
  fillKeys(jobs.JOB_DUTY_TYPES, b.urgentJobType);
  fillMap(jobs.JOB_DUTY_TYPE_LABELS, b.urgentJobType);
  fillKeys(jobs.BUSINESS_TYPES, b.businessType);
  fillMap(jobs.BUSINESS_TYPE_LABELS, b.businessType);
  fillKeys(jobs.REQUIRED_CERT_TYPES, b.requiredCertType);
  fillMap(jobs.REQUIRED_CERT_TYPE_LABELS, b.requiredCertType);
  fillKeys(jobs.WORK_ENV_TAGS, b.workEnvTag);
  fillMap(jobs.WORK_ENV_TAG_LABELS, b.workEnvTag);
  fillKeys(jobs.TREATMENT_FIELDS, b.treatmentField);
  fillMap(jobs.TREATMENT_FIELD_LABELS, b.treatmentField);
  fillKeys(jobs.SUBMIT_DOCS, b.submitDoc);
  fillMap(jobs.SUBMIT_DOC_LABELS, b.submitDoc);
  fillKeys(jobs.JOB_EDUCATIONS, b.jobEducation);
  fillMap(jobs.JOB_EDUCATION_LABELS, b.jobEducation);
  fillKeys(jobs.JOB_POSITION_LEVELS, b.jobPositionLevel);
  fillMap(jobs.JOB_POSITION_LEVEL_LABELS, b.jobPositionLevel);
  fillKeys(jobs.JOB_SALARY_TYPES, b.jobSalaryType);
  fillMap(jobs.JOB_SALARY_TYPE_LABELS, b.jobSalaryType);

  // reviews
  fillMap(reviews.REVIEW_CAREER_TYPE_LABELS, b.reviewCareerType);
  fillKeys(reviews.REVIEW_CAREER_TYPES, b.reviewCareerType);
  fillMap(reviews.REVIEW_SALARY_TYPE_LABELS, b.reviewSalaryType);
  fillKeys(reviews.REVIEW_SALARY_TYPES, b.reviewSalaryType);
  fillMap(reviews.REVIEW_JOB_LABEL_OVERRIDE, b.reviewJobLabelOverride);
  fillOptions(reviews.REVIEW_JOB_TYPE_OPTIONS, b.reviewJobType);
  fillOptions(reviews.REVIEW_SORT_OPTIONS, b.reviewSort);

  // talks
  fillKeys(talks.TALK_CATEGORIES, b.talkCategory);
  fillMap(talks.TALK_CATEGORY_LABELS, b.talkCategory);
  fillOptions(talks.TALK_SORT_OPTIONS, b.talkSort);

  // urgents
  fillKeys(urgents.URGENT_JOB_TYPES, b.urgentJobType);
  fillMap(urgents.URGENT_JOB_TYPE_LABELS, b.urgentJobType);
  fillKeys(urgents.URGENT_WORK_TYPES, b.urgentWorkType);
  fillMap(urgents.URGENT_WORK_TYPE_LABELS, b.urgentWorkType);
  fillKeys(urgents.URGENT_SALARY_TYPES, b.urgentSalaryType);
  fillMap(urgents.URGENT_SALARY_TYPE_LABELS, b.urgentSalaryType);
  fillOptions(urgents.URGENT_SORT_OPTIONS, b.urgentSort);

  // reports / qna / board
  fillKeys(reports.REPORT_REASONS, b.reportReason);
  fillMap(reports.REPORT_REASON_LABELS, b.reportReason);
  fillKeys(qna.QNA_STATUSES, b.qnaStatus);
  fillMap(qna.QNA_STATUS_LABELS, b.qnaStatus);
  fillMap(postBookmarks.POST_BOARD_LABELS, b.postBoard);

  // home (BUG-4)
  fillMap(home.HOME_CATEGORY_LABELS, b.homeCategory);

  done = true;
}

export function codesHydrated() {
  return done;
}
