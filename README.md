# Claude Mod: context-bar

Claude Code mod: context window fill, token count, rate limits, model and git branch at the right of the prompt footer.

```
[████40%░░░░░░] 80k/200k | 5h 24% · 7d 61% | opus-5-5 | main
```

- Bar and each rate limit: dim below 50%, the theme's warning color from 50%, error color from 80%
- Rate limits show on a subscription only
- Narrow terminal: branch drops first, then model, then rate limits

- **Limitation**: after `/compact` or a model switch, the bar updates only with the next reply

## Install

At a Claude Code prompt (answer `y` to add the marketplace, then pick a scope):

```
/plugin install context-bar --marketplace OWNER/REPO
```

- Shell: `claude plugin install context-bar --marketplace OWNER/REPO`
- Update: `claude plugin update context-bar`, then restart Claude Code

## Run from a working copy

1. Clone:

   ```sh
   git clone REPO_URL claude-context-bar
   ```

2. Add to `~/.claude/settings.json` (merge into an existing `env`; separate several folders with `:`):

   ```json
   { "env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/proj/claude-context-bar" } }
   ```

3. Restart Claude Code.

One session only: `claude --plugin-dir ~/proj/claude-context-bar`

## Develop

```sh
claude plugin validate .
claude plugin test .
npx tsc -p .   # after Claude Code loaded the mod once (it writes .claude-plugin/types/)
```
