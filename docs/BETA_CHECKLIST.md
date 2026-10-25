# Nova Browser — Beta Launch Checklist (100 Users)

## Desktop Browser
- [ ] `npm run dev` — window opens without errors
- [ ] New tab → search → results appear
- [ ] Click search result → website loads (not blank)
- [ ] Back button → returns to search
- [ ] Incognito window opens (`Ctrl+Shift+N`)
- [ ] Bookmarks add/remove works
- [ ] Password save prompt appears on login forms
- [ ] Ad blocker blocks ads on test sites
- [ ] Nova AI sidebar responds (Gemini API key set)
- [ ] Nova AI Pro: Summarize, Research, Explain work
- [ ] Screenshot tool captures page
- [ ] PDF toolbar on .pdf URLs
- [ ] `npm run build:win` — installer builds successfully
- [ ] Installer runs on clean Windows machine

## Nova Cloud
- [ ] PostgreSQL running (`npm run cloud:docker`)
- [ ] `npm run cloud:migrate` succeeds
- [ ] `npm run cloud:seed` — extensions in store
- [ ] Register new account works
- [ ] Login + JWT token received
- [ ] Email verification (SMTP or dev console)
- [ ] Password reset flow
- [ ] Cloud Sync push — data uploads
- [ ] Cloud Sync pull — data restores on second device
- [ ] WebSocket sync notifies other device
- [ ] Admin dashboard: http://localhost:3847/admin
- [ ] Crash reports appear in analytics
- [ ] Feedback submissions saved

## Nova Store
- [ ] Catalog loads in Nova Hub
- [ ] Install extension → appears in Extensions tab
- [ ] Extension content script runs on pages
- [ ] Enable/disable toggle works

## Nova Mobile
- [ ] App builds on Android
- [ ] Sign in to Nova Cloud
- [ ] Search returns results
- [ ] Bookmarks sync from cloud
- [ ] Browser screen loads websites

## Security
- [ ] JWT secrets changed from defaults in production
- [ ] HTTPS on API server
- [ ] No API keys in git
- [ ] Passwords encrypted in SQLite + cloud

## Performance
- [ ] 10+ tabs open without crash
- [ ] Search cache hits (second same query faster)
- [ ] Cloud sync < 5 seconds for typical user

## Legal
- [ ] Privacy Policy accessible (Settings → Advanced)
- [ ] Terms of Service accessible
- [ ] Release notes v2.0 shown

## Sign-off

| Tester | Date | Pass/Fail | Notes |
|--------|------|-----------|-------|
| Member 1 | | | |
| Member 2 | | | |
| Member 3 | | | |
| Member 4 | | | |
| Member 5 | | | |
| Member 6 | | | |
| Member 7 | | | |
