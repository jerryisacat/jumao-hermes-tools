# Jumao Hermes Tools

Personal public toolbox for Hermes Agent utilities maintained by jerryisacat.

This repository collects small scripts, helper tools, examples, and notes used to customize or operate Hermes Agent in a repeatable way.

## Repository layout

```text
scripts/   Runnable helper scripts.
tools/     Reusable utility modules or small CLIs.
docs/      Notes, setup guides, and design records.
examples/  Example configs, prompts, or usage snippets.
```

## Conventions

- Keep tools small, inspectable, and easy to run locally.
- Document each tool with purpose, dependencies, usage, and side effects.
- Do not commit secrets, tokens, private config files, session logs, or machine-specific credentials.
- Prefer explicit installation instructions over hidden global mutations.
- If a tool modifies Hermes config, skills, plugins, cron jobs, or memory, document the exact paths and rollback steps.

## Hermes references

Common local Hermes paths:

```text
~/.hermes/config.yaml
~/.hermes/.env
~/.hermes/skills/
~/.hermes/plugins/
~/.hermes/cron/
~/.hermes/logs/
```

Hermes documentation: https://hermes-agent.nousresearch.com/docs

## License

MIT
