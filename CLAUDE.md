# BuildCorp

도트 아트 가상 사무실에서 AI 직원들이 사용자의 실제 업무를 수행하는 데스크톱 앱.
게임이 아닌 **실용적 AI 멀티 에이전트 워크스페이스**이며, 게임적 요소로 시각화.

## 기술 스택

Electron + Vite + React + TypeScript, PixiJS (도트), Tailwind (HD UI), SQLite, Zustand, Multi-LLM (Claude CLI/Claude API/OpenAI/Ollama)

## 현재 진행 상태

- Phase 1~7 완료: 기반, AI 에이전트, 태스크/워크플로우, 도트 사무실, 인벤토리, 회사 전환
- Claude CLI 프로바이더 추가 완료 (Max 구독으로 무료 사용)
- 에이전트별 LLM/API키 개별 설정 가능

## AI 프로바이더 (중요)

| 프로바이더 | 비용 | API 키 | 동작 방식 |
|-----------|------|--------|----------|
| **Claude Code (CLI)** | **무료** | **불필요** | claude CLI 실행, Max 구독 사용 |
| Claude API | 유료 | 필요 | API 직접 호출 |
| OpenAI API | 유료 | 필요 | API 직접 호출 |
| Ollama | 무료 | 불필요 | 로컬 모델 |

Claude CLI 방식은 Electron 앱에서만 동작 (child_process 필요).

## 기획 문서 (상세 내용은 아래 참조)

| 문서 | 내용 |
|------|------|
| [docs/overview.md](docs/overview.md) | 프로젝트 비전, 정체성, 핵심 원칙, 회사 구조 |
| [docs/agent-system.md](docs/agent-system.md) | AI 동작 원리, CLI vs API, 도구 시스템, LLM 프로바이더 |
| [docs/workflow.md](docs/workflow.md) | 워크플로우 에디터, 직원 카드 UI, 연결 조건, 템플릿 |
| [docs/inventory.md](docs/inventory.md) | 인벤토리 시스템, UI 목업, 도구 권한 관리 |
| [docs/mcp.md](docs/mcp.md) | MCP 클라이언트/서버, 스토어, 외부 도구 연동 |
| [docs/collaboration.md](docs/collaboration.md) | 멀티플레이어, 회사 간 협업, 외부 서비스 |
| [docs/ui-design.md](docs/ui-design.md) | 4개 뷰, 레이아웃, 도트 스타일, 디자인 방향 |
| [PLANNING.md](PLANNING.md) | 전체 구현 Phase 및 기술 상세 |

## 개발 규칙

- 기획 변경 시 해당 docs 문서 + 이 파일 업데이트
- PLANNING.md에 구현 Phase 정리
