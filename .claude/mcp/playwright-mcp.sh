#!/usr/bin/env bash
# Launches the Playwright MCP server (https://github.com/microsoft/playwright-mcp).
# Locally it uses the default browser (Chrome). In Claude Code cloud sessions,
# where Chrome is absent, it switches to the preinstalled headless Chromium.
args=(@playwright/mcp@latest)

if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ] && [ -x /opt/pw-browsers/chromium ]; then
  args+=(--browser chromium --executable-path /opt/pw-browsers/chromium --headless --isolated)
fi

exec npx -y "${args[@]}"
