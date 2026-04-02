# Gym Value App — Delivery Plan v0.1

## 문서 정보
- 문서명: Delivery Plan
- 버전: v0.1
- 상태: Draft
- 상위 문서: Master Plan v0.1, Product Spec v0.1, Tech Architecture v0.1, Data Model and Calculation v0.1
- 목적: MVP 구현 순서, 단계별 범위, 체크리스트, QA 포인트, 릴리즈 준비 항목을 실행 문서로 정리
- 목적 보완: milestone 수준 실행 계획과 exit criteria를 유지하고, 세부 PR-sized task 추적은 `IMPLEMENTATION_CHECKLIST_v0.1.md`로 위임

---

## 1. 문서 목적

이 문서는 Gym Value App의 **실행 계획 문서**다.

이 문서의 목적은 다음과 같다.
- 무엇을 어떤 순서로 구현할지 정리한다.
- MVP 범위를 작은 단위로 나눠 개발 리스크를 줄인다.
- 기능별 완료 기준을 명확히 한다.
- QA와 릴리즈 직전 점검 기준을 정의한다.
- 이후 실제 개발 중 milestone 기준 문서로 활용한다.

이 문서는 기술 설계 자체보다, **"어떤 순서로 안전하게 제품을 만들어 갈 것인가"** 에 집중한다.

세부 작업 단위, live status, acceptance/verification 체크는 별도 companion 문서인 **`IMPLEMENTATION_CHECKLIST_v0.1.md`** 를 기준으로 관리한다.

---

## 2. 전체 실행 전략 요약

### 2.1 한 줄 전략

**먼저 로컬 데이터와 수동 입력 기반 MVP를 완성한 뒤, 그 위에 위치/알림 자동화를 얹는 방식으로 진행한다.**

### 2.2 이 순서를 선택하는 이유
위치/백그라운드/알림은 불확실성이 크다. 반면 이 앱의 본질은 다음이다.
- 방문을 남길 수 있어야 한다.
- 비용을 입력할 수 있어야 한다.
- 방문당 비용과 시간당 비용이 계산되어야 한다.

즉, 앱의 본질은 **위치 기술 그 자체가 아니라 방문 기록 + 비용 계산 + 동기부여 숫자**다.

따라서 구현 순서는 아래처럼 가야 한다.
1. 데이터 모델 확정
2. 수동 기록/수동 비용 입력 완성
3. 홈 KPI 완성
4. 그 다음 위치/알림 자동화 추가

이 순서가 가장 실패 확률이 낮다.

---

## 3. 개발 원칙

### 3.1 MVP 단순성 유지
다음은 MVP에서 반드시 단순하게 유지한다.
- 단일 사용자
- 단일 기기
- 단일 primary gym
- local-first only
- 로그인 없음
- sync 없음
- widget 없음
- multi-gym UI 없음

### 3.2 자동화보다 수동 fallback 우선
다음 기능은 항상 가능해야 한다.
- 수동 방문 추가
- 방문 수정
- 방문 삭제
- 비용 수동 입력

위치 자동화가 실패하더라도 앱은 usable해야 한다.

### 3.3 기능보다 계산 신뢰성 우선
- Home KPI는 반드시 일관되게 계산되어야 한다.
- 숫자 계산이 불확실하면 화려한 UX보다 단순하고 검증 가능한 방식이 우선이다.

### 3.4 화면보다 데이터 우선
- 화면은 나중에 다듬을 수 있다.
- 하지만 visit / fee item / date range / tax calculation 규칙은 초기에 고정해야 한다.

---

## 4. 마일스톤 개요

MVP는 아래 5개 마일스톤으로 나눈다.

1. Foundation
2. Core Data & Manual Tracking
3. Dashboard & KPI Completion
4. Assisted Check-In / Check-Out
5. QA, Polish, Release Readiness

### 4.1 Milestone과 Phase 매핑

이 문서는 **제품·실행 관점에서 Milestone** 이름을 쓰고, **Phase 0 / Phase 1 Implementation Kickoff** 문서는 **엔지니어링 구현 관점에서 Phase** 이름을 쓴다. 아래는 같은 구현 구간을 가리키는 대응 관계다.

| Phase (Kickoff) | Milestone (Delivery) | 한 줄 |
|-----------------|----------------------|--------|
| Phase 0 — Foundation | Milestone 1 — Foundation | RN·탭·DB·스토어 골격 |
| Phase 1 — Core Data & Manual Tracking | Milestone 2 — Core Data & Manual Tracking | gym/fee/visit 수동 CRUD·로컬 영속 |

이후 Milestone 3~5는 Kickoff 문서의 Phase 0/1 범위 밖 단계와 대응한다(대시보드·자동 체크인·QA 등).

### 4.2 세부 실행 추적 문서

Milestone 내부의 실제 구현 순서와 PR-sized task는 **`IMPLEMENTATION_CHECKLIST_v0.1.md`** 에서 관리한다.

역할 분리는 아래와 같다.
- `DELIVERY_PLAN_v0.1.md`: milestone, exit criteria, QA, release readiness
- `IMPLEMENTATION_CHECKLIST_v0.1.md`: task ID, status, acceptance, verification, dependency

---

## 5. Milestone 1 — Foundation

## 5.1 목표
앱의 기본 실행 환경과 구조를 만든다.

## 5.2 범위
- React Native CLI 프로젝트 생성
- TypeScript 설정
- 기본 navigation 구조 생성
- theme / design token 최소 세팅
- SQLite 연결
- migration infrastructure 생성
- 기본 폴더 구조 정리
- Zustand store 기본 골격 생성

## 5.3 산출물
- 앱이 실행된다.
- 4개 탭(Home, Visits, Costs, Settings)이 빈 화면으로라도 뜬다.
- DB 초기화가 동작한다.
- 첫 migration이 정상 수행된다.
- 기본 repository 인터페이스 골격이 만들어진다.

## 5.4 완료 기준
- Android simulator/device에서 앱 실행 가능
- iOS simulator에서도 기본 실행 가능
- DB open/migration 로그 확인 가능
- 앱 재시작 시 DB 초기화 에러 없음

## 5.5 체크리스트
- [ ] RN CLI bootstrap 완료
- [ ] TypeScript strict mode 또는 그에 준하는 기준 설정
- [ ] RootNavigator + TabNavigator 구성
- [ ] AppProviders 구성
- [ ] SQLite client 연결
- [ ] schema versioning 기반 마련
- [ ] base stores 생성
- [ ] 기본 theme/colors/spacing 정의

## 5.6 리스크
- RN native dependency linking 문제
- SQLite 라이브러리 세팅 이슈
- iOS/Android 빌드 환경 차이

## 5.7 대응
- 이 단계에서는 기능 욕심 없이 빌드 안정성 확보 우선
- 위치/알림 라이브러리는 아직 실제 연결하지 않아도 됨

---

## 6. Milestone 2 — Core Data & Manual Tracking

## 6.1 목표
위치 기능 없이도 앱의 핵심 가치가 성립하도록 만든다.

## 6.2 범위
- Gym setup
- Fee item CRUD
- Visit CRUD
- 수동 방문 추가
- 방문 수정/삭제
- Settings 기본값 저장
- validation 로직
- repository 구현
- calculation utility 기초 구현

## 6.3 이 단계에서 반드시 가능한 것
- gym 1개 등록
- 비용 항목 추가
- 방문 수동 추가
- 방문 수정
- 방문 삭제
- 기록 리스트 확인

## 6.4 산출물
- Home을 제외한 데이터 입력/수정 흐름이 실질적으로 동작
- SQLite에 실제 데이터 저장
- 앱 재실행 후 데이터 유지

## 6.5 완료 기준
- 사용자가 location permission 없이도 앱을 의미 있게 쓸 수 있음
- 수동 기록만으로도 향후 KPI 계산에 필요한 데이터가 다 채워짐
- validation 오류 메시지가 최소 수준으로 동작

## 6.6 체크리스트
- [ ] Gym Setup modal/screen 구현
- [ ] gym 저장/수정 기능 구현
- [ ] Fee item list 구현
- [ ] Add/Edit Cost Item 구현
- [ ] Cost item validation 구현
- [ ] Visits list 구현
- [ ] Add/Edit Visit 구현
- [ ] Visit delete 흐름 구현
- [ ] started_at / ended_at validation 구현
- [ ] duration 자동 계산 구현
- [ ] settings 저장 구현
- [ ] DB repositories 실제 CRUD 연결

## 6.7 QA 포인트
- visit 저장 후 리스트 즉시 갱신되는지
- edit 후 duration 재계산이 맞는지
- delete 후 데이터/리스트 반영이 맞는지
- fee item inactive 또는 date range 처리 기초가 맞는지

---

## 7. Milestone 3 — Dashboard & KPI Completion

## 7.1 목표
제품의 핵심 가치인 **방문당 비용**과 보조 지표를 완성한다.

## 7.2 범위
- current year 기준 dashboard stats 계산
- cost per visit 계산
- cost per hour 계산
- total paid 계산
- total visits / total duration / average visit length 계산
- Home KPI UI 구현
- empty state 구현
- active visit 카드 UI 기본 골격

## 7.3 이 단계에서 중요한 점
이 마일스톤이 끝나면 위치 기능이 없어도 사용자는 앱의 핵심 가치를 체감할 수 있어야 한다.

즉, 여기까지 끝나면 내부적으로는 이미 “usable MVP” 상태여야 한다.

## 7.4 산출물
- Home 상단에 `$X.XX / visit` 표시
- 하단 summary cards 표시
- 비용이 없거나 방문이 없을 때 적절한 안내 문구 표시

## 7.5 완료 기준
- 수동 입력된 데이터만으로 Home KPI가 신뢰 가능하게 나온다.
- null / 0 / empty state가 올바르게 구분된다.
- current year 기준 계산이 일관된다.

## 7.6 체크리스트
- [ ] dashboard query/selectors 구현
- [ ] cost per visit 계산 함수 구현
- [ ] cost per hour 계산 함수 구현
- [ ] total paid occurrence expansion 구현
- [ ] unique visit days 계산 구현
- [ ] average visit length 계산 구현
- [ ] Home KPI card 구현
- [ ] Home summary cards 구현
- [ ] empty states 구현
- [ ] latest visit 표시 구현

## 7.7 QA 포인트
- 비용만 있고 방문이 없을 때 null 처리 맞는지
- 방문은 있고 비용이 없을 때 안내 문구가 맞는지
- monthly / annual / one-time 비용 반영이 맞는지
- current year 경계 날짜 계산이 맞는지

---

## 8. Milestone 4 — Assisted Check-In / Check-Out

## 8.1 목표
위치/알림을 활용해 기록 마찰을 줄인다.

## 8.2 범위
- permission service 구현
- notification service 구현
- location service 구현
- gym geofence 등록/업데이트
- geofence enter event 처리
- check-in suggestion 알림
- 알림 액션 기반 check-in
- active visit 생성
- exit event 기반 check-out suggestion
- active visit 종료 처리
- location prompt 저장

## 8.3 이 단계의 원칙
- 자동 생성보다 **제안형 UX** 유지
- visit 생성은 user action을 우선으로 함
- 실패 시 manual fallback이 항상 있어야 함

## 8.4 산출물
- gym 진입 시 check-in suggestion 알림
- 알림 탭으로 active visit 시작 가능
- gym 이탈 시 종료 제안 가능
- Home에 active visit 상태 표시

## 8.5 완료 기준
- 권한이 허용된 상황에서 geofence → 알림 → check-in 흐름이 실제 기기에서 동작
- active visit 중 중복 check-in이 차단됨
- 종료 후 dashboard가 갱신됨

## 8.6 체크리스트
- [ ] location permission 흐름 구현
- [ ] notification permission 흐름 구현
- [ ] geofence register/remove 구현
- [ ] prompt insert 로직 구현
- [ ] check-in suggestion notification 구현
- [ ] notification action handler 구현
- [ ] active visit create use case 연결
- [ ] checkout suggestion notification 구현
- [ ] complete visit use case 연결
- [ ] app restart 후 active visit 복구 구현

## 8.7 QA 포인트
- 권한 거부 상태에서 앱이 깨지지 않는지
- 권한 없이 manual-only 모드가 자연스러운지
- enter/exit 오탐이 있어도 잘못된 visit가 자동 생성되지 않는지
- active visit timer UI가 정상 복구되는지

## 8.8 리스크
- Android / iOS geofence 동작 차이
- background event 신뢰성 차이
- notification action 처리 플랫폼 차이

## 8.9 대응
- Android 우선 검증
- iOS는 동일 구조 유지하되 실제 동작 QA를 별도로 충분히 수행
- 문제가 있으면 완전자동 대신 앱 열기 기반 check-in fallback 유지

---

## 9. Milestone 5 — QA, Polish, Release Readiness

## 9.1 목표
출시 가능한 수준으로 UX/안정성을 정리한다.

## 9.2 범위
- empty state polish
- error message polish
- edge case handling 강화
- loading state 정리
- settings 문구 다듬기
- icons / spacing / layout polish
- app lifecycle 점검
- smoke test 수행
- release config 정리

## 9.3 산출물
- 사용자가 길을 잃지 않는 empty state
- 에러 발생 시 fallback 행동 제안
- 빌드/릴리즈 준비 완료

## 9.4 완료 기준
- 주요 핵심 플로우 manual QA 통과
- crash-free 기본 시나리오 확보
- Android release build 가능
- iOS archive/build 가능

## 9.5 체크리스트
- [ ] empty state 카피 정리
- [ ] validation message 정리
- [ ] loading / disabled state 정리
- [ ] lifecycle 복구 QA
- [ ] duplicate active visit 방지 QA
- [ ] weird duration 경고 QA
- [ ] first-run onboarding QA
- [ ] Android release signing 준비
- [ ] iOS release/archive 설정 점검
- [ ] app icon / app name / basic metadata 점검

---

## 10. 추천 개발 순서 (실무형)

실제로는 아래 순서가 가장 효율적이다.

### Week/Block 1
- Foundation
- DB + navigation + skeleton

### Week/Block 2
- Gym / Costs / Visits CRUD
- 수동 입력 완성

### Week/Block 3
- Home KPI / dashboard calculations
- empty states / validations

### Week/Block 4
- permissions / notifications / location integration
- assisted check-in / active visit

### Week/Block 5
- checkout suggestion
- recovery / polish / QA / release prep

이 순서는 실제 일정이 아니라 **개발 블록 순서** 개념이다.

---

## 11. 기능 우선순위

## 11.1 Must Have
- gym 등록
- 비용 항목 CRUD
- 방문 수동 추가
- 방문 수정/삭제
- Home 방문당 비용 표시
- 시간당 비용 표시
- local persistence
- manual-only fallback

## 11.2 Should Have
- check-in suggestion 알림
- active visit 표시
- check-out suggestion
- permission 상태 UX

## 11.3 Nice to Have
- missed visit recovery UI
- advanced filters
- cost trend cards
- more insight cards

---

## 12. Definition of Done (MVP)

아래 조건을 만족하면 v0.1 MVP를 완료로 본다.

### 제품 기준
- 사용자는 gym 1개를 등록할 수 있다.
- 사용자는 비용 항목을 자유롭게 추가/수정/삭제할 수 있다.
- 사용자는 방문을 수동으로 추가/수정/삭제할 수 있다.
- Home에서 current year 기준 `cost per visit`를 볼 수 있다.
- Home에서 current year 기준 `cost per hour`를 볼 수 있다.
- active visit가 있을 경우 상태를 확인할 수 있다.
- 위치 권한이 없어도 앱 사용이 가능하다.

### 기술 기준
- DB migration이 안정적으로 동작한다.
- 앱 재시작 후 데이터가 유지된다.
- duplicate active visit가 방지된다.
- calculation null/0 edge case 처리가 일관된다.

### UX 기준
- 빈 상태에서 사용자가 다음 행동을 이해할 수 있다.
- 첫 설정 후 수동 방문 추가까지의 흐름이 어렵지 않다.
- 위치 자동화 실패가 앱 전체 신뢰를 깨지 않는다.

---

## 13. 개발 체크리스트 (통합)

### App Setup
- [ ] 프로젝트 부트스트랩
- [ ] TypeScript 설정
- [ ] navigation 구성
- [ ] theme 구성
- [ ] providers 구성

### Data Layer
- [ ] SQLite client
- [ ] migrations
- [ ] repositories
- [ ] query helpers
- [ ] mapper 구현

### Domain / Calculations
- [ ] duration utils
- [ ] tax calculator
- [ ] fee occurrence expansion
- [ ] total paid calculator
- [ ] cost per visit
- [ ] cost per hour
- [ ] average visit length

### Features
- [ ] gym setup
- [ ] costs CRUD
- [ ] visits CRUD
- [ ] Home dashboard
- [ ] active visit card

### Platform Services
- [ ] permission service
- [ ] notification service
- [ ] location service
- [ ] lifecycle service

### Quality
- [ ] validation
- [ ] empty states
- [ ] error states
- [ ] logging
- [ ] smoke testing

---

## 14. QA 체크리스트

## 14.1 Setup QA
- [ ] 첫 실행 시 onboarding 흐름이 자연스러운가
- [ ] gym 없이 Home 진입 시 안내가 적절한가
- [ ] 비용 없이 KPI를 보려 할 때 안내가 적절한가

## 14.2 Visit QA
- [ ] 수동 방문 추가가 정상 동작하는가
- [ ] edit 후 duration이 재계산되는가
- [ ] delete 후 통계가 즉시 갱신되는가
- [ ] active visit 중 중복 생성이 차단되는가
- [ ] active visit 복구가 동작하는가

## 14.3 Cost QA
- [ ] monthly 비용이 예상대로 반복 계산되는가
- [ ] annual 비용이 anniversary 기준으로 반영되는가
- [ ] one-time 비용이 기간 안에서 1회 반영되는가
- [ ] custom tax override가 반영되는가

## 14.4 Dashboard QA
- [ ] total visits 계산이 맞는가
- [ ] total duration 계산이 맞는가
- [ ] cost per visit null 처리 기준이 맞는가
- [ ] cost per hour null 처리 기준이 맞는가
- [ ] current year 기준 계산이 맞는가

## 14.5 Location / Notification QA
- [ ] notification permission이 없는 상태에서 깨지지 않는가
- [ ] location permission이 없는 상태에서 manual mode로 정상 동작하는가
- [ ] geofence enter 시 check-in suggestion이 뜨는가
- [ ] 알림 액션으로 visit가 시작되는가
- [ ] exit 시 종료 제안이 뜨는가

## 14.6 Lifecycle QA
- [ ] 앱 종료 후 재실행 시 active visit가 복구되는가
- [ ] background → foreground 복귀 시 timer UI가 자연스러운가
- [ ] 비정상 장기 active visit가 검토 대상으로 표시되는가

---

## 15. 테스트 전략

## 15.1 자동 테스트 우선 대상
- tax calculator
- fee occurrence expansion
- total paid calculator
- cost per visit
- cost per hour
- average visit length
- visit validation
- active visit 중복 방지

## 15.2 수동 테스트 우선 대상
- geofence event
- notification action
- lifecycle 복구
- permission flow
- onboarding UX

## 15.3 테스트 원칙
- 계산 로직은 가능한 순수 함수로 만들어 unit test를 쉽게 한다.
- 플랫폼 의존 기능은 실제 기기 QA를 포함한다.
- Android를 우선 검증하고, iOS는 구조 동일 + 플랫폼별 QA 보완 방식으로 간다.

---

## 16. 릴리즈 준비 항목

## 16.1 Android
- app id 확정
- signing config 준비
- app icon / app name 확인
- versioning 규칙 확정
- release build 테스트
- 권한 설명 문구 점검

## 16.2 iOS
- bundle id 확정
- signing / team 설정
- permission usage description 점검
- archive/build 점검
- icon/name 점검

## 16.3 공통
- onboarding 문구 점검
- empty state 문구 점검
- privacy-sensitive wording 점검
- crash scenario smoke test

---

## 17. 출시 직전 Go / No-Go 기준

아래 항목 중 핵심 실패가 있으면 출시를 미룬다.

### No-Go 조건
- DB migration 불안정
- 앱 재실행 시 데이터 유실
- cost per visit 계산 불일치
- 수동 방문 추가/수정/삭제가 불안정
- active visit 중복 생성 가능
- 권한 거부 시 앱 사용 불가
- check-in flow가 앱 crash를 유발

### Go 조건
- manual-only mode가 안정적
- Home KPI가 신뢰 가능
- location automation이 실패해도 앱 전체는 usable
- 주요 edge case에서 데이터 무결성이 유지됨

---

## 18. 출시 후 초기 개선 후보

출시 직후 바로 관찰할 포인트:
- 사용자가 manual add를 얼마나 자주 쓰는지
- check-in suggestion acceptance 비율
- active visit 종료 누락 빈도
- radius default가 적절한지
- 비용 설정 단계에서 이탈하는지

이를 바탕으로 다음 개선 후보를 정리할 수 있다.
- missed visit recovery UX 개선
- radius 추천값 조정
- onboarding 간소화
- Home summary card 우선순위 조정

---

## 19. 구현 시 주의사항 요약

- 위치 자동화보다 수동 플로우를 먼저 완성한다.
- cost per visit 계산 규칙을 바꾸는 일은 신중해야 한다.
- monthly/annual occurrence 규칙은 중간에 흔들지 않는다.
- null과 0을 구분해서 다룬다.
- active visit는 UI 상태와 DB 상태를 일관되게 유지한다.
- location prompt는 보조 데이터이지 진실 데이터가 아니다.

---

## 20. 최종 실행 순서 요약

1. Foundation
2. Gym / Costs / Visits CRUD
3. Home KPI / Dashboard
4. Permission / Notification / Geofence integration
5. Active visit / checkout suggestion
6. QA / polish / release prep

이 순서를 지키면, 위치 기능이 예상보다 오래 걸리더라도 **수동 기반 usable MVP**는 먼저 확보할 수 있다.

---

## 21. 최종 결정 사항 요약

- 구현은 데이터/수동 입력을 먼저 완성한 뒤 자동화를 얹는 순서로 진행한다.
- MVP의 본질은 위치 기술이 아니라 visit + fee + KPI다.
- Must-have는 manual-only mode에서도 가치가 성립해야 한다.
- 위치 기능은 assisted mode로 취급한다.
- QA는 계산 정확성과 데이터 무결성을 최우선으로 본다.
- Android 우선, iOS 동시 고려 원칙을 유지한다.

---

## 22. 문서 세트 구조 (v0.1)

**Core foundation docs** (제품·기술·실행의 공식 기준 5종):
1. Master Plan  
2. Product Spec  
3. Tech Architecture  
4. Data Model and Calculation  
5. Delivery Plan (본 문서)

**Implementation companion docs** (구현 보조 — 코어를 대체하지 않음):
6. Phase 0 / Phase 1 Implementation Kickoff  
7. Initial DB Schema SQL  
8. Implementation Checklist  
9. Manual MVP QA Report  
10. Assisted Check-In QA  
11. (향후) Repository / Use Case Scaffold 등  

다음 단계에서는 **core 5종**을 기준으로 구현하고, 스키마 SQL·킥오프·implementation checklist는 같은 결정을 실행 단위로 풀어 쓴 companion으로 활용한다.
