# Tech Stack Notice

## Current Versions

| Package   | Version | Status |
| --------- | ------- | ------ |
| React     | 19.2.3  | Stable |
| React DOM | 19.2.3  | Stable |
| Next.js   | 16.0.10 | Canary |

## Risk Level

**Medium-High**

## Known Limitations

- Next.js 16 is in canary/experimental phase
- Some third-party libraries may have React 19 compatibility issues
- Breaking changes may occur in minor version updates

## Rollback Plan

If critical issues arise, execute:

```bash
npm install react@18.3.1 react-dom@18.3.1 next@15.1.3
rm -rf node_modules
npm install
```

## Monitoring Guidelines

1. **Test staging before prod** - Always deploy to staging first
2. **Monitor errors** - Watch for React 19 / Next 16 specific errors
3. **Keep React 18 backup branch** - Maintain a tested branch with React 18 if needed
4. **Check changelogs** - Review Next.js and React changelogs before updating

## Compatibility Tests

Run `/test-compat` route to verify:

- Supabase Auth integration
- Database queries (trades, journal_entries)
- Client-side React hooks

## Decision History

| Date       | Decision                | Rationale                                                   |
| ---------- | ----------------------- | ----------------------------------------------------------- |
| 2025-12-14 | Keep React 19 + Next 16 | Project started with these versions, no React 18 in history |
