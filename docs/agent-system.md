# AI 에이전트 시스템

## 동작 원리

에이전트(LLM)가 파일을 직접 읽거나 쓰는 게 아님. BuildCorp 앱이 중간 다리 역할:

```
LLM (두뇌) ←── 텍스트로 소통 ──→ BuildCorp 앱 (손발) ←── 실제 작업 ──→ 사용자 컴퓨터
```

### 실행 흐름

1. BuildCorp이 LLM에게 메시지 + 사용 가능한 도구 목록 전달
2. LLM이 `readFile('src/app.ts')` 실행 **요청** (텍스트 응답일 뿐)
3. **BuildCorp 앱이 실제로 파일을 읽음**
4. 읽은 내용을 다시 LLM에 전달
5. LLM이 분석하고 다음 행동 결정
6. 반복...

Claude Code와 동일한 원리. **어떤 LLM이든 Tool Use(function calling) 지원하면 동작.**
ChatGPT API도 가능 - ChatGPT가 직접 로컬을 읽는 게 아니라, 우리 앱이 읽어서 전달하는 것.

## 두 가지 동작 방식

### 방식 1: Claude CLI (추천)
Claude Code Max 구독 사용자용. API 키 불필요, 무료.
BuildCorp이 `claude` CLI를 실행하여 응답을 받는 구조.

```
BuildCorp 에이전트가 AI 응답 필요
    ↓
앱이 claude CLI 프로세스 실행
    ↓
Claude Code가 Max 구독 인증으로 동작
    ↓
파일 읽기/쓰기, 터미널 실행 등 Claude Code가 자체 처리
    ↓
결과를 BuildCorp이 받아서 표시
```

장점:
- API 키 불필요, Max 구독 그대로 사용
- Claude Code의 모든 기능 활용 (파일 작업, 터미널, 세션 등)
- 에이전트 하나하나가 **미니 Claude Code**처럼 동작

제한:
- Electron 앱에서만 가능 (브라우저 모드 불가)
- Claude 전용 (GPT/Ollama는 API 방식 사용)

### 방식 2: API 직접 호출
API 키로 LLM에 직접 요청. BuildCorp이 도구를 정의하고 실행하는 구조.

```
BuildCorp이 LLM에 메시지 + 도구 목록 전달
    ↓
LLM이 "readFile 실행해줘" 요청
    ↓
BuildCorp이 실제로 파일 읽기
    ↓
결과를 LLM에 전달 → 반복
```

## 다중 LLM 지원

| 프로바이더 | 비용 | API 키 | 방식 | 비고 |
|-----------|------|--------|------|------|
| **Claude Code (CLI)** | **무료** | **불필요** | CLI | Max 구독 사용, Electron 전용 |
| Claude API | 유료 | 필요 | API | Tool Use 지원 |
| OpenAI API | 유료 | 필요 | API | function calling 지원 |
| Ollama | 무료 | 불필요 | API | 로컬 모델, 사양에 따라 성능 차이 |
| *추후 추가* | | | | *셀레니움 ChatGPT, GPT CLI 등* |

에이전트마다 LLM 프로바이더/모델/API 키를 **개별 선택** 가능.

## 에이전트 커스터마이징

각 에이전트별로 설정 가능:
- 이름, 도트 아바타
- 전문 분야, 성격/톤 설정
- System Prompt 커스터마이징
- LLM 프로바이더/모델 선택
- 도구 권한 (인벤토리 시스템, [inventory.md](inventory.md) 참조)

## 기본 도구 (API 방식에서 사용)

| 도구 | 설명 |
|------|------|
| `readFile` | 특정 파일 읽기 |
| `writeFile` | 파일 생성/수정 |
| `listDir` | 폴더 구조 보기 |
| `search` | 파일 내 텍스트 검색 |
| `runCommand` | 터미널 명령 실행 (빌드, 테스트 등) |

**참고**: Claude CLI 방식에서는 이 도구들이 필요 없음. Claude Code가 자체적으로 파일 읽기/쓰기/터미널 실행을 처리.

추가 도구는 MCP를 통해 확장 ([mcp.md](mcp.md) 참조).

## 파일 탐색 전략 (대규모 프로젝트 대응)

파일이 많으면 LLM 컨텍스트 한계에 부딪힘. 단계적 읽기로 해결:

```
1단계: 폴더 구조(트리)만 전달
   "src/
    ├── app.ts
    ├── utils/
    │   ├── auth.ts
    │   └── db.ts
    └── components/ (12개 파일)"

2단계: LLM이 필요한 파일 선택
   "auth.ts랑 db.ts 읽어줘"

3단계: 해당 파일만 전달

4단계: 추가로 필요한 파일 요청 → 반복

5단계: 최종 결과 산출
```

사람이 코드 리뷰하는 것과 동일한 방식. BuildCorp 앱이 자동 관리하므로 사용자가 신경 쓸 필요 없음.

## 병렬 실행

- **모든 에이전트가 동시에 독립적으로 작업 가능**
- 각 에이전트는 자신의 async 컨텍스트에서 실행
- 에이전트 간 연계가 필요하면 워크플로우 사용 ([workflow.md](workflow.md) 참조)

## 에이전트 통계 (가벼운 수준)

- 업무 완료 횟수/시간 트래킹
- 분야별 작업 횟수 기록
- 본격 RPG 성장 시스템은 아님, 통계 수준

## 셀레니움 ChatGPT 연동 (추후 추가)

사용자가 만든 셀레니움 기반 ChatGPT 웹 자동화를 프로바이더로 추가 예정.
- 로컬 서버로 감싸서 API처럼 호출
- 단, Tool Use 루프가 어려워 **단순 작업**(번역, 요약, 검토)에 적합
- 복잡한 파일 탐색/수정은 API 기반 에이전트 사용 권장
