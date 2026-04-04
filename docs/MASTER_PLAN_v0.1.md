# Gym Value App — Master Plan v0.1

## 문서 정보
- 문서명: Gym Value App Master Plan
- 버전: v0.1
- 상태: Draft / Direction Approved
- 목적: 제품 의도, MVP 범위, UX 방향, 데이터 구조, 기술 선택, 개발 단계, 하위 문서 체계를 한 문서에서 정리하는 기준 문서

---

## 1. 제품 한 줄 정의

**Gym에 간 횟수와 머문 시간을 누적하고, 내가 실제로 지불한 비용을 방문당 / 시간당 기준으로 보여줘서 운동의 체감 가치를 높이는 로컬 우선 크로스플랫폼 앱**

이 앱은 단순한 운동 기록 앱이 아니라, 사용자가 자신의 gym membership을 **얼마나 잘 활용하고 있는지 수치로 체감하게 만드는 동기부여 앱**이다.

---

## 2. 제품 의도와 방향성

### 2.1 왜 이 앱을 만드는가
많은 사람들은 헬스장 회비를 내지만, 실제로 그 비용을 얼마나 잘 회수하고 있는지 체감하지 못한다. 이 앱은 다음 질문에 답하게 한다.

- 나는 올해 gym에 몇 번 갔는가?
- 총 몇 시간을 보냈는가?
- 지금까지 낸 돈을 기준으로 보면 방문당 비용은 얼마인가?
- 시간당 비용은 얼마인가?
- 더 자주 가면 내 membership의 체감 단가가 얼마나 내려가는가?

### 2.2 핵심 가치
이 앱의 핵심 가치는 아래 세 가지다.

1. **체크인을 쉽게 만든다**
   - gym 근처에 도착하면 알림을 주고, 한 번의 탭으로 방문을 기록할 수 있게 한다.

2. **자동/반자동으로 기록 부담을 줄인다**
   - 위치 기반 제안, 체크인 후보, 체크아웃 제안 등을 제공한다.
   - 그러나 오탐과 누락이 생길 수 있으므로, 사용자는 언제든 수정/삭제/수동 추가가 가능해야 한다.

3. **비용 대비 가치를 명확하게 보여준다**
   - 방문당 비용, 시간당 비용, 총 방문 수, 총 체류시간을 통해 운동의 경제적 가치를 시각화한다.

### 2.3 제품 철학
- **심플함 우선**: 기능보다 사용 흐름이 단순해야 한다.
- **로컬 우선**: 앱의 핵심 기능은 인터넷 없이도 동작해야 한다.
- **사후 보정 가능성**: 위치 기능은 완벽할 수 없기 때문에, 유저가 나중에 수정하거나 수동으로 보완할 수 있어야 한다.
- **정확성보다 실용성**: 체류시간은 대략 10~15분 오차까지 허용한다.
- **MVP는 단일 gym 기준**으로 시작하되, 데이터 구조는 다중 gym 확장을 고려한다.

---

## 3. 목표 사용자

### 3.1 1차 타깃
- gym membership을 꾸준히 내고 있는 개인 사용자
- 운동을 자주 가야 한다는 동기부여가 필요한 사용자
- 회비가 아깝다고 느끼는 사용자
- Apple Health / Google Fit 같은 고급 운동 분석보다, **실제 이용 가치와 습관 추적**에 더 관심이 있는 사용자

### 3.2 사용자의 대표 니즈
- gym에 간 기록을 간단히 남기고 싶다
- 깜빡했을 때 나중에 고칠 수 있어야 한다
- 자동 기능이 있으면 좋지만, 틀렸을 때 내가 직접 바로잡고 싶다
- 결과는 복잡한 차트보다 **한눈에 동기부여가 되는 숫자**로 보고 싶다

---

## 4. 성공 기준

### 4.1 제품 KPI
MVP에서 가장 중요한 대표 지표는 다음과 같다.

- **방문당 비용 (Cost per Visit)**

예시:
- `$5.75 / visit`

이 값이 홈 화면의 최상단 메인 KPI가 된다.

### 4.2 보조 KPI
- 시간당 비용 (Cost per Hour)
- 올해 총 방문 수
- 올해 총 체류시간
- 평균 방문 길이
- 이번 달 방문 수
- 활동일 수 기준 비용

### 4.3 MVP 성공 조건
- 사용자가 gym을 1개 등록할 수 있다
- 비용 항목을 추가/수정/삭제할 수 있다
- gym 근처에서 체크인 제안을 받을 수 있다
- 한 번 탭으로 체크인할 수 있다
- 수동으로 새 방문 이벤트를 추가할 수 있다
- 기존 기록을 수정/삭제할 수 있다
- 총 비용 대비 방문당 / 시간당 단가가 계산된다

---

## 5. MVP 범위 정의

### 5.1 포함 범위
#### A. Gym 설정
- gym 이름
- 위치 좌표
- 반경(meters)
- timezone
- 단일 gym을 primary로 설정

#### B. 비용 관리
- 월 회비
- 연회비
- 등록비
- 락커비
- PT 비용
- 기타 비용 (사용자 정의 항목 추가 가능)
- 항목별 시작일/종료일 또는 주기 설정
- 항목별 세금 규칙 지원

#### C. 방문 기록
- 알림 + 탭 1회 체크인
- 수동 체크아웃 또는 체크아웃 제안
- 사용자가 직접 새 방문 이벤트 추가 가능
- 과거 기록 수정 가능
- 과거 기록 삭제 가능
- 누락된 방문을 복구하거나 재구성 가능

#### D. 통계
- 방문당 비용
- 시간당 비용
- 총 방문 횟수
- 총 체류시간
- 평균 체류시간
- 최근 방문 기록

#### E. 로컬 우선 동작
- 네트워크 연결 없이도 핵심 기능 사용 가능
- 로컬 DB 기반 계산 및 조회

### 5.2 제외 범위
아래 항목은 MVP에서 제외한다.

- 로그인/회원가입
- 클라우드 동기화
- 여러 기기 동기화
- 소셜 기능
- 친구 비교
- 웨어러블/헬스 앱 연동
- 여러 gym 동시 운영 UI
- 자동 세율 탐지
- 국가/지역 자동 인식 기반 세금 계산
- 고급 리포트 export

---

## 6. UX 방향

### 6.1 홈 화면
홈 화면은 **한눈에 동기부여가 되는 대시보드**여야 한다.

#### 상단 핵심 카드
- 큰 숫자: `$X.XX / visit`
- 보조 텍스트:
  - This year: N visits
  - Total time: XXh XXm
  - Total paid: $XXX.XX

#### 액션 영역
- Check In
- End Visit
- Add Visit Manually

#### 하단 상세 카드 / grid
- 시간당 비용
- 이번 달 방문 수
- 올해 총 체류시간
- 평균 방문 길이
- 가장 최근 방문
- 이번 달 비용 추정

### 6.2 기록 화면
- 방문 기록 리스트
- 날짜/시간/체류시간 표시
- 개별 기록 수정
- 삭제
- 수동 방문 추가
- 누락 복구 후보 제안

### 6.3 Costs 탭 (비용 입력·관리)
초기 구상에서는 “비용 전용 화면 vs 설정 안 비용 섹션”을 열어 둔 적이 있으나, **v0.1 MVP 기준으로는 `Home / Visits / Costs / Settings` 4탭 구조를 확정**했고, **비용 항목의 입력·관리는 전용 `Costs` 탭**에서만 한다.

- 기본 비용 항목 리스트
- 사용자 정의 비용 **라인** 추가(예: `Other` 또는 표시용 label — `fee_items.cadence = custom`과는 다른 개념, Data Model 참고)
- 세금 포함 여부/세율 override
- 현재 활성 비용만 계산 반영

### 6.4 Settings 화면
- gym 위치 및 반경
- 알림 on/off
- 체크아웃 제안 on/off
- 기본 세금 프리셋
- currency / locale
- (비용 항목 CRUD는 Costs 탭 담당 — Settings에서는 전역 기본값·권한·tracking 등만 다룬다)

### 6.5 UX 원칙
- 한 화면에 너무 많은 숫자를 넣지 않는다
- 사용자가 위치 자동화 기능을 신뢰하지 못해도 앱을 사용할 수 있어야 한다
- 자동화는 “기록 제안” 역할을 하고, 최종 진실은 사용자가 수정할 수 있어야 한다

---

## 7. 핵심 사용자 플로우

### 7.1 최초 설정
1. 앱 실행
2. gym 이름/위치/반경 입력
3. 비용 항목 입력
4. 위치 권한 및 알림 권한 허용
5. 홈 화면 진입

### 7.2 정상 체크인 플로우
1. 사용자가 gym 근처에 도착
2. 앱이 geofence 진입 감지
3. 로컬 알림 발송
4. 사용자가 알림 또는 앱에서 `Check In` 탭
5. active visit 시작
6. 나중에 수동 종료 또는 gym 이탈 시 종료 제안
7. 완료된 방문 기록 저장

### 7.3 체크인을 놓친 경우
1. 사용자가 gym에 갔지만 탭하지 않음
2. 사용자는 나중에 기록 화면에서 `Add Visit` 실행
3. 날짜/시작/종료 시간 수동 입력
4. 저장 후 통계에 반영

### 7.4 오탐/오류 수정 플로우
1. 잘못 생성된 방문 기록 확인
2. 수정 또는 삭제
3. 필요시 source/confidence 값 유지

---

## 8. 기술 방향

### 8.1 기본 스택
- React Native CLI
- TypeScript
- React Navigation
- Zustand
- SQLite (`react-native-nitro-sqlite` 우선 검토)
- Notifee
- Background Geolocation 라이브러리
- dayjs

### 8.2 플랫폼 전략
- Android 우선 개발
- iOS 동시 대응 가능하도록 설계
- 권한 흐름은 두 플랫폼의 차이를 고려해 추상화

### 8.3 저장소 전략
#### 로컬 우선
앱의 주 데이터 저장소는 SQLite이다.

이유:
- 방문 기록과 비용 항목은 관계형 구조가 자연스럽다
- 연도/월 기준 합계 계산이 필요하다
- 오프라인 동작이 중요하다
- 방문당 비용, 시간당 비용, 기간별 집계를 DB 쿼리로 계산하기 좋다

#### 클라우드 전략
MVP에서는 클라우드 저장소를 사용하지 않으며, **데이터의 source of truth는 항상 로컬 SQLite**다.

향후 필요하다면 Neon 등 외부 backend를 **백업 / 동기화 / 웹 대시보드 후보**로 검토할 수 있으나, 그 경우에도 MVP와 동일하게 **로컬 DB가 우선**이라는 전제를 유지한다. MVP 비목표(클라우드 동기화·로그인)와 충돌하지 않도록, 클라우드는 **선택적 보조**로만 문서에 언급한다.

### 8.4 상태 관리 전략
- UI 상태 + 현재 active session + 설정 캐시: Zustand
- 정식 기록/비용/통계 원천 데이터: SQLite

### 8.5 알림 및 위치 전략
- 완전 자동 체크인보다 **알림 + 탭 1회**를 기본 UX로 채택
- gym 진입 시 체크인 제안
- gym 이탈 시 체크아웃 제안
- 정확도가 떨어질 수 있으므로 수동 보정 허용

---

## 9. 데이터 모델 방향

### 9.1 주요 엔티티
- `gyms`
- `visits`
- `location_prompts`
- `fee_items`
- `app_settings`

### 9.2 설계 원칙
- 현재는 단일 gym 중심이지만, schema는 multi-gym 가능하게 설계
- 감지 이벤트와 확정 방문 기록을 분리
- 비용 항목은 고정 필드가 아니라 추가 가능한 row 구조 사용
- 통계는 raw data 기반으로 재계산 가능해야 함

### 9.3 방문 기록 정책
방문 기록은 다음 source를 가질 수 있다.
- manual
- prompted
- recovered

confidence는 아래 정도로 관리할 수 있다.
- high
- medium
- low

이 값은 사용자에게 직접 크게 노출하지 않아도 되지만, 내부 보정/디버깅/향후 기능 확장에 유용하다.

---

## 10. 세금 모델 방향

### 10.1 MVP 원칙
MVP에서는 세금을 단순 고정값으로 하드코딩하지 않는다.

대신 아래 구조를 사용한다.
- 앱 기본 tax preset
- 비용 항목별 상속
- 필요시 항목별 custom override

### 10.2 이유
- 회비, PT, 락커비, 기타 비용이 동일한 세율을 따르지 않을 수 있다
- 지역별/국가별 확장성을 위한 기반이 필요하다
- v0.1 초기 기본 preset은 §10.3의 BC/CAD 예시를 쓸 수 있으나, 구조는 일반화해야 한다

### 10.3 v0.1 초기 기본값과 확장성
앱 구조·데이터 모델·세금 필드는 **지역 중립적으로 확장 가능**하게 둔다. 다만 **초기 seed / 기본 프리셋**은 개발·검증 편의를 위해 아래를 기본으로 한다.

- currency: `CAD`
- locale: `en-CA`
- region preset: `BC_CA`
- default GST / PST: BC / Canada 예시 수준(제품·Data Model과 동일)

특정 국가 전용 앱으로 고정하는 것이 아니라, **“기본값은 BC/CAD이며 사용자·설정으로 바꿀 수 있다”**는 톤을 유지한다.

각 비용 항목에 대해:
- inherit default
- custom tax (항목별 GST/PST override)

사용자는 필요시 GST/PST 값을 수정할 수 있다.

---

## 11. 아키텍처 개요

### 11.1 계층 구조
1. **Presentation Layer**
   - screens
   - components
   - navigation

2. **Application Layer**
   - use cases
   - visit management
   - cost calculation
   - geofence handling

3. **Data Layer**
   - SQLite repositories
   - local queries
   - settings persistence

4. **Platform Services**
   - location
   - notifications
   - permissions

### 11.2 핵심 설계 포인트
- 위치 서비스와 알림 서비스를 UI와 분리
- 계산 로직을 화면 컴포넌트 안에 넣지 않고 별도 모듈화
- DB schema와 계산 유틸은 테스트 가능하게 설계

---

## 12. 개발 단계 제안

### Phase 0 — Foundation
- RN CLI 프로젝트 생성
- TypeScript 세팅
- navigation 기본 구조
- SQLite 연결
- schema 생성
- 기본 design tokens

### Phase 1 — Core Data
- gym 설정 저장
- fee item CRUD
- visit CRUD
- 수동 방문 추가
- 통계 계산 엔진

### Phase 2 — Assisted Check-In
- 위치 권한 요청
- geofence 진입 감지
- 체크인 알림
- 탭 체크인
- active visit 상태 표시

### Phase 3 — Assisted Check-Out & Recovery
- 이탈 감지
- 체크아웃 제안
- 누락 복구 제안
- 오탐 수정/삭제 플로우

### Phase 4 — Polish
- 홈 KPI 정교화
- 빈 상태 UX
- 엣지케이스 보정
- 월/연 단위 필터
- 간단한 차트 또는 summary cards

---

## 13. 주요 리스크와 대응

### 13.1 위치 오차
리스크:
- 실내 위치 오차
- 인근 건물에서 오탐

대응:
- 반경 기본값을 너무 작게 두지 않음
- 자동 확정 대신 제안형 UX 사용
- 사후 수정 가능하게 함

### 13.2 체크인/체크아웃 누락
리스크:
- 알림을 못 봄
- 핸드폰을 두고 감

대응:
- 수동 추가 지원
- 과거 방문 수정 가능
- 누락 복구 UX 제공

### 13.3 세금 계산 혼란
리스크:
- 모든 비용에 동일 세율 적용 시 오계산 가능성

대응:
- 항목별 tax rule
- 기본 preset + override 구조

### 13.4 앱 복잡도 증가
리스크:
- 기능 욕심으로 MVP가 무거워짐

대응:
- 홈 KPI 중심
- 단일 gym 우선
- 로그인/동기화/소셜 제거

---

## 14. 향후 확장 방향

- multi-gym 지원
- 계정 기반 backup / sync
- 웹 대시보드
- Apple Health / Google Fit 연동
- 세율 자동 추천
- 월별 목표 달성 / streak
- “이번 달 2번 더 가면 방문당 비용이 얼마로 내려갑니다” 같은 동기부여 카드
- 위젯

---

## 15. 문서 체계 제안
문서 수가 너무 많아지지 않도록, 성격이 비슷한 문서는 묶어서 관리한다.

### 15.1 문서 목록 (계층)

#### Core foundation docs (v0.1 제품·기술 기준 세트)
아래 5개는 방향·스펙·실행 순서의 **공식 코어**다.

1. **Master Plan** — 제품 의도, MVP 범위, UX 방향, 기술 선택, 개발 단계, 문서 체계
2. **Product Spec** — 플로우, 화면별 요구, 홈/방문/Costs/Settings UX, 상태·엣지 케이스
3. **Tech Architecture** — 레이어, 폴더, 라이브러리, 상태·플랫폼 서비스, 데이터 흐름
4. **Data Model and Calculation** — 엔티티, SQLite·계산·세금 규칙
5. **Delivery Plan** — 마일스톤, 우선순위, 체크리스트, QA·릴리즈

#### Implementation companion docs (구현·확장 보조)
코어를 실행에 옮길 때 함께 두는 문서다. 코어를 대체하지 않는다.

6. **Phase 0 / Phase 1 Implementation Kickoff** — 엔지니어링 관점 Phase 범위·파일 순서·체크리스트
7. **Initial DB Schema SQL** — `001_initial_schema` 수준의 SQL 기준안
8. **Implementation Checklist** — PR-sized task, live status, acceptance/verification 기준
9. **Manual MVP QA Report** — manual-only MVP 기준 automated/workspace QA evidence
10. **Assisted Check-In QA** — assisted flow wiring과 fallback polish QA evidence
11. **Cost Setup QA** — post-MVP cost setup 확장 block의 automated/workspace QA evidence
12. **Future Development Playbook** — v0.1 이후 전체 roadmap과 운영 순서
13. **Post-MVP Local Expansion Plan** — 다음 local UX 확장 블록의 세부 구현 순서
14. **Online Expansion Architecture** — account/backup/sync/web 확장용 아키텍처 기준
15. **Backup and Restore Spec** — 첫 online 기능으로서 backup/restore 범위와 계약
16. (향후) Repository / Use Case Scaffold 등 — 필요 시 추가

### 15.2 문서 수 최소화 원칙
- UX 관련 상세는 `Product Spec`에 묶는다
- DB·계산 규칙은 `Data Model and Calculation`에 묶는다
- 구현 구조·라이브러리는 `Tech Architecture`에 묶는다
- 일정·마일스톤·릴리즈 기준은 `Delivery Plan`에 묶는다
- 세부 PR-sized task 추적과 live status는 `Implementation Checklist`에 묶는다
- **코어 5개 + companion**으로 역할을 나누어, companion은 스키마·킥오프처럼 “같은 결정을 다른 형태로 구체화”하는 용도로만 둔다

---

## 16. 현재 결정된 사항 요약

- 플랫폼: Android 우선, iOS 동시 고려
- 체크인: 알림 + 탭 1회
- 체크인 누락/오탐 대응: 수동 추가/수정/삭제 허용
- gym 수: MVP는 1개, 구조는 multi-gym 확장 가능하게 설계
- 비용 항목: 월회비, 연회비, 등록비, 락커비, PT, 기타 사용자 정의 항목
- 세금: 기본 preset + 항목별 override
- 저장소: 로컬 우선, SQLite 메인
- 메인 KPI: 방문당 비용
- 정확도 기준: 체류시간 10~15분 오차 허용
- 제품 철학: 자동화는 보조, 최종 진실은 사용자가 수정 가능

---

## 17. 권장 읽기 순서 (코어 문서)

코어 5종은 아래 순서가 이해에 가장 자연스럽다(파일명은 저장소 `docs/` 기준).

1. `MASTER_PLAN_v0.1.md`
2. `PRODUCT_SPEC_v0.1.md`
3. `TECH_ARCHITECTURE_v0.1.md`
4. `DATA_MODEL_AND_CALCULATION_v0.1.md`
5. `DELIVERY_PLAN_v0.1.md`

구현·확장 보조 문서(Phase 0/1 Kickoff, Initial DB Schema SQL, Implementation Checklist, QA reports, future/online docs 등)는 §15.1 **Implementation companion**을 본다.

---

## 18. 최종 메모
이 앱은 위치 자동화가 들어가지만, 제품의 본질은 위치 기술 자체가 아니라 **습관 형성과 비용 체감 시각화**에 있다.

따라서 MVP의 성공 기준은 “완벽한 자동 위치 기록”이 아니라,

- 사용자가 gym 방문을 쉽게 남길 수 있고
- 누락/오류를 나중에 보정할 수 있으며
- 그 결과가 동기부여가 되는 숫자로 돌아오는가

에 있다.

이 원칙을 유지한 채, **§15에 정리된 코어·companion 문서**를 기준으로 구현한다.
