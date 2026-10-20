# Claude Mod: context-bar

Claude Code mod: context window fill, token count, session cost, model and git branch at the right of the prompt footer.

```
[████40%░░░░░░] 80k/200k | $1.23 | opus-5-5 | main
```

- Bar: dim below 50%, the theme's warning color from 50%, error color from 80%
- Cost: the session total, as `/cost` shows it
- Narrow terminal: branch drops first, then model, then cost

- **Limitation**: after `/compact` or a model switch, the bar updates only with the next reply

## Install

At a Claude Code prompt (answer `y` to add the marketplace, then pick a scope):

```
/plugin install context-bar --marketplace OWNER/REPO
```

- Shell: `claude plugin install context-bar --marketplace OWNER/REPO`

## Update

After the repo gets new commits, then restart Claude Code:

```sh
# re-fetch the marketplace catalog to be aware about new version
claude plugin marketplace update context-bar
# pull new plugin files
claude plugin update context-bar
```

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
