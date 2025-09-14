## Reference Design

![](/public/design-reference.png)

<br>

## Tech Stack

```
⚒️ Bundler: Vite 7
🌏 Language: Typescript
📚 Library: React 19
🎨 UI: tailwind4 + shadcn + lucide icons
💻 Backend: Supabase
```

## Component Library

### Shadcn

#### Installation

https://ui.shadcn.com/docs/installation/vite

#### Sidebar - main frame

https://ui.shadcn.com/blocks/sidebar

#### Calendar

https://ui.shadcn.com/blocks/calendar

<br>

### Big Calendar

repo: https://github.com/lramos33/big-calendar  
demo: https://calendar.jeraidi.tech/calendar

<br><br>

## MCP

### Shadcn MCP

https://www.shadcn.io/mcp/claude-code

```bash
claude mcp add --transport http shadcn https://www.shadcn.io/api/mcp
```

### Supabase MCP

https://supabase.com/docs/guides/getting-started/mcp#claude-code

```bash
claude mcp add supabase -s local -e SUPABASE_ACCESS_TOKEN=your_token_here -- npx -y @supabase/mcp-server-supabase@latest
```
