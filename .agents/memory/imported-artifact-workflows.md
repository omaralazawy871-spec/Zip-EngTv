---
name: Imported project artifact workflows missing
description: Why a GitHub-imported repo with artifacts/*/.replit-artifact/artifact.toml files has no running workflows and how to fix it
---

When a project is imported from GitHub, the `artifacts/<slug>/.replit-artifact/artifact.toml` files can be present on disk (and path-based proxy routing to their configured ports/paths still works), but `listArtifacts()` returns empty and no workflows exist — the platform's artifact registry didn't carry over from the import.

`createArtifact()` cannot fix this: it fails with `ARTIFACT_DIR_EXISTS` since the directory already exists, and there's no "re-register existing artifact" callback.

**How to apply:** Recreate each artifact's workflow manually with `configureWorkflow`, using the exact `command`/`localPort`/env values (`PORT`, `BASE_PATH`, etc.) from that artifact's `.replit-artifact/artifact.toml` `[services.development]` block. Proxy routing (path prefixes like `/api`, `/__mockup`) keeps working correctly even though the artifact isn't "registered" — verified via curl/screenshot against `$REPLIT_DEV_DOMAIN`. Note the `Screenshot` tool's `appPreview` source will still fail with "Artifact not found" in this state; use `externalUrl` against `$REPLIT_DEV_DOMAIN` instead to verify visually.
