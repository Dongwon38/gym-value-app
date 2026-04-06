# GYM_SEARCH_PLACES_API_IMPLEMENTATION_PLAN_v0.1

## 문서 목적

이 문서는 **사용자 위치 기반 gym 검색 기능**을 Google Places API (New) 기준으로 구현하기 위한 실행 계획서다.

목표는 아래 한 문장으로 요약된다.

> 사용자가 `goodlife` 같은 브랜드 또는 키워드를 검색하면, **현재 사용자 위치를 기준으로 가까운 순서에 가깝게**, 그리고 동시에 **검색어와의 관련성도 유지한 gym 결과 리스트**를 안정적으로 보여준다.

이 문서는 다음을 포함한다.

- 어떤 API를 어떤 역할로 쓸지
- 검색 UX를 어떤 흐름으로 설계할지
- 결과 정렬 품질을 어떻게 보정할지
- 클라이언트/서버 구조를 어떻게 나눌지
- 캐싱, 오류 처리, 테스트, 롤아웃 전략을 어떻게 가져갈지

---

## 1. 최종 결정 요약

### 1.1 권장 API 조합

이 기능은 아래 조합으로 구현한다.

1. **Autocomplete (New)**  
   - 사용자가 입력 중일 때 suggestion 제공
   - 예: `goo`, `goodl`, `goodlife`

2. **Text Search (New)**  
   - 사용자가 검색을 확정했을 때 실제 결과 목록 조회
   - 예: `goodlife gym`

3. **Place Details (New)**  
   - 사용자가 특정 gym을 선택했을 때 상세 정보 보강

4. **Nearby Search (New)**  
   - 검색어가 없을 때 “내 주변 gym 보기” 기본 탐색용

### 1.2 핵심 원칙

- **브랜드/키워드 검색의 주력은 Text Search**
- **빈 검색 상태의 주변 탐색은 Nearby Search**
- **입력 UX 개선은 Autocomplete**
- **최종 정렬 품질은 앱이 직접 보정**
- **Google은 후보를 잘 모으는 역할, 앱은 최종 순위를 책임지는 역할**

---

## 2. 왜 이 구조가 맞는가

### 2.1 Text Search를 메인 검색 API로 쓰는 이유

Text Search (New)는 자유 텍스트 검색용 API다.  
즉 `"pizza in New York"` 같은 자연어형 검색뿐 아니라, `"goodlife gym"` 같은 브랜드 + 카테고리 검색에도 맞다.

반면 Nearby Search (New)는 위치 중심 검색에는 강하지만, 브랜드 문자열 검색을 메인으로 쓰기에는 덜 적합하다.

따라서 `"goodlife"`처럼 **브랜드명 또는 키워드가 있는 검색**은 Text Search 중심으로 가는 것이 맞다.

### 2.2 Nearby Search를 별도로 유지하는 이유

검색어가 없는 상태에서 사용자는 보통 아래 중 하나를 기대한다.

- 내 주변 gym 전체 보기
- 가까운 gym 추천 보기

이 경우에는 Nearby Search가 더 자연스럽다.  
특히 `locationRestriction`과 `rankPreference: DISTANCE`를 활용한 “주변 장소 목록” 패턴이 명확하다.

### 2.3 Autocomplete를 붙이는 이유

Autocomplete (New)는 입력 중 suggestion을 제공하고, `locationBias`/`locationRestriction`, `origin`, `includedPrimaryTypes`, `sessionToken`을 지원한다.

즉:

- 사용자가 빠르게 의도한 브랜드를 찾게 해주고
- 모바일 입력 UX를 크게 개선하며
- 최종 검색 전에 후보를 좁히는 역할을 한다

---

## 3. 목표 UX 정의

### 3.1 시나리오 A — 브랜드 검색

사용자 입력:
- `goodlife`

사용자 기대:
- 내 주변 GoodLife 계열 gym들이
- 가까운 순서에 가깝게
- 의미 없는 비슷한 결과는 최대한 적게

권장 결과 예시:
1. GoodLife Fitness Burnaby
2. GoodLife Fitness Metrotown
3. GoodLife Fitness Downtown
4. 기타 관련 체육관

### 3.2 시나리오 B — 일반 카테고리 검색

사용자 입력:
- `gym`
- `fitness`
- `pilates`
- `boxing gym`

사용자 기대:
- 주변 관련 시설이 잘 나와야 함
- 거리와 관련성이 둘 다 중요함

### 3.3 시나리오 C — 입력 전 상태

사용자 입력 없음

사용자 기대:
- 주변 gym 목록
- 가까운 순 또는 인기순
- 빠르게 탐색 가능

---

## 4. 검색 흐름 설계

## 4.1 입력 중 단계

사용자가 검색창에 타이핑할 때:

- debounce 250~350ms
- Autocomplete (New) 호출
- `sessionToken` 유지
- 현재 사용자 위치가 있으면 `origin` 전달
- 기본적으로 `locationBias` 사용
- 너무 강하게 제한하고 싶을 때만 `locationRestriction` 사용

### 입력 중 반환 정보
UI에 필요한 최소 정보:

- suggestion text
- placeId
- structured main text
- secondary text
- distanceMeters (가능하면)

### 입력 중 목표
- 좋은 제안 제공
- 잘못된 API 과다 호출 방지
- 사용자가 빠르게 원하는 결과를 고르도록 유도

---

## 4.2 검색 확정 단계

사용자가 엔터를 누르거나 suggestion을 선택하면:

### 경우 1: suggestion 선택
- placeId가 있으면 바로 Place Details 또는 Text Search 보완 흐름으로 진입 가능

### 경우 2: 자유 검색 실행
- Text Search (New) 호출
- `textQuery`는 앱에서 정규화 후 생성
- 예:  
  - `"goodlife"` → `"goodlife gym"`
  - `"fit4less"` → `"fit4less gym"`
  - `"gym"` → `"gym"`

### 권장 request 원칙
- 브랜드성 키워드는 카테고리 보정 단어를 붙인다
- 너무 공격적이지 않게 `includedType` 또는 `strictTypeFiltering`을 사용한다
- 최종 리스트는 앱에서 다시 정렬한다

---

## 4.3 상세 진입 단계

사용자가 특정 결과를 탭하면:

- Place Details (New) 호출
- 필요한 최소 필드만 요청
- 상세 화면 또는 등록 화면으로 전달

이 단계에서 사용할 수 있는 정보 예:
- displayName
- formattedAddress
- location
- types / primaryType
- business status
- viewport 또는 map 표시 관련 정보

---

## 5. API별 역할 정의

## 5.1 Autocomplete (New)

### 역할
- 입력 중 suggestion 제공
- 사용자의 검색 의도를 빠르게 포착
- placeId 기반 선택 흐름 제공

### 요청 전략
- `input`
- `sessionToken`
- `origin`
- `locationBias` 또는 `locationRestriction`
- `includedPrimaryTypes`는 필요 시 사용

### 사용할 때 주의할 점
- `sessionToken`은 한 검색 세션 동안 재사용
- 입력이 비었거나 너무 짧을 때는 호출 제한
- suggestion 선택과 자유 검색을 구분

---

## 5.2 Text Search (New)

### 역할
- 브랜드/키워드 기반 실제 결과 목록 조회
- 검색 결과 메인 소스

### 요청 전략
- `textQuery`
- `pageSize`
- `locationBias`
- 필요 시 `includedType`
- 필요 시 `strictTypeFiltering`

### 이 API가 적합한 경우
- `"goodlife"`
- `"goodlife gym"`
- `"boxing gym"`
- `"cheap gym near me"` 같은 자유 검색

---

## 5.3 Nearby Search (New)

### 역할
- 검색어 없는 기본 탐색
- 현재 위치 기준 주변 gym 목록

### 요청 전략
- `locationRestriction.circle`
- `includedTypes`
- `rankPreference: DISTANCE`
- `maxResultCount`

### 사용하는 화면
- 검색 전 초기 화면
- “Near me” 탭
- 지도 기반 주변 탐색 화면

---

## 5.4 Place Details (New)

### 역할
- 선택된 place의 상세 정보 보강
- gym 등록/확정 화면에 필요한 정보 채움

### 원칙
- 상세 화면 진입 시에만 호출
- 결과 목록 단계에서는 호출하지 않음
- FieldMask 최소화

---

## 6. 추천 아키텍처

## 6.1 클라이언트 단

React Native 앱에서 담당:

- 검색 입력 상태
- debounce
- location permission / current location 확보
- suggestion list 렌더
- search results 렌더
- 로컬 재정렬
- 최근 검색어 / 최근 선택 캐시

## 6.2 서버 단(권장)

가능하면 Places API 호출은 서버 또는 edge function에서 중계한다.

이유:
- API key 보호
- request normalization 통일
- ranking logic 일부 서버화 가능
- 모니터링/로깅 용이
- 향후 공급자 교체 또는 fallback 추가 용이

### 서버에서 담당하면 좋은 것
- query normalization
- request body 생성
- field mask 관리
- 결과 후처리
- cache
- rate limit

---

## 7. 검색 도메인 모델 제안

```ts
export type GymSearchQuery = {
  rawInput: string;
  normalizedInput: string;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
};

export type GymSearchResult = {
  placeId: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  primaryType?: string;
  types?: string[];
  googleDistanceMeters?: number | null;
  computedDistanceMeters?: number | null;
  brandScore: number;
  typeScore: number;
  distanceScore: number;
  finalScore: number;
  source: "text_search" | "nearby_search" | "autocomplete";
};
```

---

## 8. Query normalization 규칙

브랜드 검색 결과 품질을 높이기 위해 검색어를 그대로 쓰지 말고 정규화한다.

### 예시 규칙

#### 원본
- `goodlife`

#### 정규화
- `goodlife gym`

#### 원본
- `fit4less`

#### 정규화
- `fit4less gym`

#### 원본
- `gym`

#### 정규화
- `gym`

### 규칙 원칙
- 입력이 일반 카테고리면 그대로 유지
- 입력이 브랜드성 키워드면 `gym` 보조 토큰 추가
- whitespace trim
- lowercase normalize
- 내부 비교용 normalized text 별도 생성

---

## 9. 정렬 전략

이 기능의 품질은 **Google 결과를 그대로 보여주지 않고, 앱이 후처리 정렬하는 것**에서 크게 갈린다.

## 9.1 기본 생각

Google 결과는 후보 풀(candidate pool)이다.  
최종 UX 품질은 앱이 만든다.

즉, 아래 2단계로 본다.

1. Google API가 관련 장소들을 수집
2. 앱이 브랜드 관련성 + 거리 기준으로 최종 정렬

---

## 9.2 추천 스코어링 규칙

### 1) 브랜드 관련성 점수
- exact normalized name match: +100
- startsWith match: +80
- contains match: +60
- alias match: +50
- 무관: +0

### 2) 타입 점수
- primaryType이 `gym`: +25
- types에 `gym`: +20
- types에 `fitness_center`: +18
- sports/health 계열만 있고 gym이 없으면: +5
- 무관하면: -20

### 3) 거리 점수
- 0~500m: +30
- 500m~1km: +22
- 1km~3km: +15
- 3km~5km: +8
- 5km 초과: +0

### 4) 보정 페널티
- 이름에 query가 전혀 없음: -40
- 타입이 너무 넓고 gym 관련성 낮음: -20
- 너무 먼데 브랜드 점수도 낮음: -20

---

## 9.3 최종 정렬 우선순위

기본 우선순위는 아래처럼 둔다.

1. **브랜드 관련성**
2. **gym 타입 일치**
3. **거리**
4. 보조적으로 Google 순서

즉 `"goodlife"` 검색에서는  
아주 가까운 아무 gym보다, **가까운 GoodLife 계열 gym이 먼저** 나와야 한다.

---

## 10. 거리 계산 전략

### 10.1 왜 앱에서 직접 계산하나

Autocomplete에는 `origin`을 주면 `distanceMeters`가 포함될 수 있지만,  
Text Search / Nearby Search 결과만으로는 앱이 일관되게 직접 계산해 두는 편이 낫다.

### 10.2 권장 방식
- 사용자 좌표와 place 좌표로 haversine 계산
- `computedDistanceMeters` 필드 저장
- UI는 이 값을 기준으로 거리 표시
- Google에서 내려준 거리값이 있어도 앱 계산값을 메인으로 사용 가능

---

## 11. FieldMask 전략

Places API (New)는 FieldMask를 명시적으로 관리해야 한다.

따라서 각 단계별로 최소 필드만 요청한다.

## 11.1 Autocomplete
- suggestion text
- placeId
- structured text
- distanceMeters

## 11.2 Text Search / Nearby Search
- id
- displayName
- formattedAddress
- location
- primaryType
- types

## 11.3 Place Details
- 상세 화면에 꼭 필요한 값만 추가

### 원칙
- 목록에서는 절대 과하게 요청하지 않는다
- 상세는 탭 시점에만
- 비용/응답 속도/로그 가독성을 위해 단계별 필드 최소화

---

## 12. 캐싱 전략

## 12.1 클라이언트 캐시
- 최근 검색어 결과 5~10개
- 최근 선택 gym 5개
- TTL 짧게 (예: 5분)

## 12.2 서버 캐시(권장)
- normalized query + rounded location key 기준
- 예: `goodlife|49.225|-123.001|r5000`
- TTL 1~5분

### 이유
- 같은 장소 검색이 반복될 가능성 높음
- 비용 절감
- 체감 응답 속도 개선

---

## 13. 오류 처리 전략

## 13.1 위치 권한 없음
- 검색 자체는 허용
- 다만 거리순 품질이 낮아질 수 있음을 내부적으로 처리
- fallback:
  - IP bias 또는 no-bias 검색
  - 사용자에게 위치 허용 CTA 노출

## 13.2 Autocomplete 실패
- suggestion 없이 검색 버튼으로 Text Search 실행 가능하게 유지

## 13.3 Text Search 결과 없음
- nearby fallback CTA 제공
- 예:
  - “No strong matches for ‘goodlife’”
  - “Show nearby gyms instead”

## 13.4 네트워크 실패
- cached results 있으면 우선 노출
- retry 버튼 제공

---

## 14. UX 상세 제안

## 14.1 검색창 placeholder
- `Search for a gym`
- `Try "GoodLife" or "boxing gym"`

## 14.2 suggestion UI
각 row에:
- 이름
- 주소 일부
- 거리
- gym 타입 badge(optional)

## 14.3 결과 리스트 UI
각 row에:
- gym 이름
- 주소
- 거리
- 브랜드 일치 강조(optional)
- 선택 버튼 또는 등록 버튼

## 14.4 빈 상태
### 검색 전
- `Nearby gyms`
- `Search by brand or location`

### 결과 없음
- `No matching gyms found`
- `Try a broader search or browse nearby gyms`

---

## 15. 단계별 구현 순서

## Phase 1 — 기본 검색 골격
목표:
- 검색창
- debounce
- Text Search
- 결과 리스트
- 거리 계산

완료 기준:
- `goodlife` 검색 시 최소한 관련 gym 결과가 나온다
- 거리 표시가 된다

## Phase 2 — 입력 UX 개선
목표:
- Autocomplete
- session token
- suggestion list
- suggestion 선택 플로우

완료 기준:
- 입력 중 제안이 뜬다
- suggestion 선택 시 더 빠르게 결과 진입 가능

## Phase 3 — 주변 탐색 모드
목표:
- Nearby Search
- 검색어 없는 기본 상태
- near me 화면

완료 기준:
- 주변 gym 탐색 UX가 생긴다

## Phase 4 — 랭킹 품질 보정
목표:
- query normalization
- brand score
- type score
- final sort 보강

완료 기준:
- `"goodlife"` 검색 결과 품질이 눈에 띄게 좋아진다

## Phase 5 — 상세/선택 최적화
목표:
- Place Details
- 결과 선택 후 상세
- 등록 플로우 연결

완료 기준:
- 사용자가 gym 선택/등록까지 자연스럽게 이어진다

---

## 16. 테스트 계획

## 16.1 기능 테스트
- `goodlife`
- `fit4less`
- `gym`
- `fitness`
- `boxing gym`
- 검색어 없음

## 16.2 위치 테스트
- 도심
- 교외
- 사용자 위치 없음
- 위치 권한 거부

## 16.3 랭킹 테스트
- 브랜드 정확 일치
- 브랜드 부분 일치
- 비슷하지만 다른 브랜드
- 아주 가까운 비브랜드 gym
- 먼 거리의 정확 브랜드 gym

## 16.4 성능 테스트
- debounce 정상 동작
- 연속 입력 시 과도 호출 방지
- 느린 네트워크에서 fallback UX 확인

---

## 17. 성공 기준

이 기능은 아래 조건을 만족하면 1차 성공으로 본다.

1. `"goodlife"` 검색 시, 사용자 위치 근처 GoodLife gym 결과가 상단에 나온다.
2. `"gym"` 검색 시, 주변 gym 탐색 품질이 자연스럽다.
3. 검색어가 없어도 nearby 탐색이 가능하다.
4. 위치 권한이 없어도 검색은 usable하다.
5. suggestion, 결과 목록, 선택 흐름이 모바일에서 빠르게 동작한다.

---

## 18. 최종 권장 구현안

가장 추천하는 최종 구조는 아래와 같다.

- **검색어 없음**  
  → Nearby Search (New) + 거리순

- **검색어 입력 중**  
  → Autocomplete (New)

- **검색 확정**  
  → Text Search (New)

- **결과 선택 후**  
  → Place Details (New)

- **최종 정렬**  
  → 앱에서 브랜드 관련성 + 타입 + 거리 기반 재정렬

이 구조가 가장 유연하고, `"goodlife"` 같은 실제 사용자 검색 의도를 가장 잘 만족시킨다.
