# BuildCorp

> AI-Powered Virtual Office — Gamified Multi-Agent Workspace with Pixel Art

도트 아트 가상 사무실에서 AI 직원들이 당신의 실제 업무를 수행하는 데스크톱 앱.

![Electron](https://img.shields.io/badge/Electron-41-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6)

## Features

### AI Agent System
- **Multi-LLM Support** — Claude, OpenAI, Ollama (local models)
- **Tool Use** — Agents can read/write files, search code, run terminal commands
- **Parallel Execution** — All agents work simultaneously and independently
- **Streaming Responses** — Real-time chat with AI employees

### Workflow Editor
- **Visual Node Editor** — Drag-and-drop employee cards to build pipelines
- **Transition Conditions** — Auto / Approval Required / Conditional per connection
- **Templates** — Save and reuse workflow configurations
- **Live Editing** — Modify running workflows (unstarted steps only)

### Inventory System (RPG-style)
- **Equip/Unequip Tools** — Per-agent tool permissions
- **MCP Store** — Search and install external tools
- **Drag Management** — Visual tool management with pixel icons

### Pixel Art Office
- **PixiJS Rendering** — Procedural pixel sprites (no external assets)
- **Status Animations** — Working (typing), idle, break, meeting
- **Team Rooms** — Auto-layout with colored borders
- **Interactive** — Click characters to open chat

### Task Board
- **Kanban** — Todo → In Progress → Review → Done
- **Drag & Drop** — Move tasks between columns
- **Team Assignment** — Assign tasks to specific teams

### Company Management
- **Multiple Companies** — Run several projects simultaneously
- **Quick Switching** — Dropdown company switcher
- **Free Industry** — Set any business type you want

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Electron + Vite |
| Frontend | React + TypeScript |
| Pixel Rendering | PixiJS 8 |
| UI | Tailwind CSS 4 |
| State | Zustand |
| Database | SQLite (better-sqlite3) |
| AI | Claude API, OpenAI API, Ollama |

## Getting Started

```bash
# Install dependencies
npm install

# Development mode (Vite + Electron)
npm run dev

# Production build
npm run build

# Type check
npm run typecheck
```

### API Keys

Launch the app → Click **Settings** (top right) → Enter your API keys:
- **Claude**: Get from [console.anthropic.com](https://console.anthropic.com)
- **OpenAI**: Get from [platform.openai.com](https://platform.openai.com)
- **Ollama**: Just install [Ollama](https://ollama.com) and run locally

## Project Structure

```
BuildCorp/
├── electron/              # Electron main process
│   ├── main.ts           # App entry
│   ├── preload.ts        # IPC bridge
│   ├── ipc/              # IPC handlers (company, team, agent, task, chat, settings)
│   └── services/
│       ├── llm/          # LLM providers (Claude, OpenAI, Ollama)
│       ├── agent/        # Agent engine, tools, workflow engine
│       └── database/     # SQLite schema & init
├── src/                   # React renderer
│   ├── components/
│   │   ├── office/       # PixiJS pixel office view
│   │   ├── dashboard/    # Stats & overview
│   │   ├── task/         # Kanban board
│   │   ├── workflow/     # Visual node editor
│   │   ├── chat/         # Agent chat panel
│   │   ├── agent/        # Inventory panel
│   │   ├── settings/     # API key management
│   │   └── layout/       # TitleBar, Sidebar, StatusBar
│   └── stores/           # Zustand state (company, ui, task, workflow, inventory)
├── shared/                # Shared types
└── docs/                  # Planning documents
```

## Documentation

Detailed planning documents in [docs/](docs/):

- [Project Overview](docs/overview.md)
- [AI Agent System](docs/agent-system.md)
- [Workflow System](docs/workflow.md)
- [Inventory System](docs/inventory.md)
- [MCP Integration](docs/mcp.md)
- [Collaboration](docs/collaboration.md)
- [UI Design](docs/ui-design.md)

## Roadmap

- [x] Phase 1: Foundation (Electron + React + SQLite)
- [x] Phase 2: AI Agent Core (LLM providers + tools + engine)
- [x] Phase 3: Task Board & Workflow Editor
- [x] Phase 4: Pixel Art Office (PixiJS)
- [x] Phase 5: Inventory System
- [x] Phase 6: Company Switching
- [ ] Phase 7: MCP Store (search & install)
- [ ] Phase 8: Multiplayer Collaboration (WebSocket)
- [ ] Phase 9: External Service Integration (Slack, GitHub, Notion)
- [ ] Future: Selenium ChatGPT Provider

## License

MIT
