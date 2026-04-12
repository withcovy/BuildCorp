# BuildCorp

도트 아트 가상 사무실에서 AI 직원들이 사용자의 실제 업무를 수행하는 데스크톱 앱.
게임이 아닌 **실용적 AI 멀티 에이전트 워크스페이스**이며, 게임적 요소로 시각화.

## 기술 스택

Electron + Vite + React + TypeScript, PixiJS (도트), Tailwind (HD UI), SQLite, Zustand, Multi-LLM (Claude/OpenAI/Ollama)

## 현재 진행 상태

- Phase 1 완료: 프로젝트 셋업, 기본 레이아웃, DB, CRUD
- Phase 2~7: 미착수

## 기획 문서 (상세 내용은 아래 참조)

| 문서 | 내용 |
|------|------|
| [docs/overview.md](docs/overview.md) | 프로젝트 비전, 정체성, 핵심 원칙, 회사 구조 |
| [docs/agent-system.md](docs/agent-system.md) | AI 동작 원리, 도구 시스템, 파일 탐색 전략, LLM 프로바이더 |
| [docs/workflow.md](docs/workflow.md) | 워크플로우 에디터, 직원 카드 UI, 연결 조건, 템플릿 |
| [docs/inventory.md](docs/inventory.md) | 인벤토리 시스템, UI 목업, 도구 권한 관리 |
| [docs/mcp.md](docs/mcp.md) | MCP 클라이언트/서버, 스토어, 외부 도구 연동 |
| [docs/collaboration.md](docs/collaboration.md) | 멀티플레이어, 회사 간 협업, 외부 서비스 |
| [docs/ui-design.md](docs/ui-design.md) | 4개 뷰, 레이아웃, 도트 스타일, 디자인 방향 |
| [PLANNING.md](PLANNING.md) | 전체 구현 Phase 및 기술 상세 |

## 개발 규칙

- 기획 변경 시 해당 docs 문서 + 이 파일 업데이트
- PLANNING.md에 구현 Phase 정리
