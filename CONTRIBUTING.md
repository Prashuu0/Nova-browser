# Contributing to Nova Browser

## For the 7-person team

1. Read [TEAM_7_SETUP.md](docs/TEAM_7_SETUP.md) — your role and folder
2. Run `npm run team:setup` once
3. Create branch: `feature/your-name-task`
4. PR to `develop`, not `main`
5. Member 7 runs [BETA_CHECKLIST.md](docs/BETA_CHECKLIST.md) before merge to `main`

## Code style
- Match existing patterns in each folder
- No secrets in git — use `.env`
- Small focused PRs

## Commit format
```
feat(cloud): add email verification
fix(desktop): search link navigation
docs(team): update beta checklist
```

## Modules
| Folder | Owner |
|--------|-------|
| `src/` | Member 1 |
| `nova-cloud/` | Member 2 |
| `nova-mobile/` | Member 3 |
| `nova-ai/` | Member 4 |
| `nova-crawler/` | Member 5 |
| `docker/`, `.github/` | Member 6 |
| `docs/`, `tests/` | Member 7 |
