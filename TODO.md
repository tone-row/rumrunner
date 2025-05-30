# Rumrunner: Hosted UI & Deferred Function Evaluation Toolkit

## Vision & Architecture
Rumrunner aims to make large-scale, repeatable, and explorable function evaluation easy and efficient. The core vision is:

- **Separation of Concerns:**
  - The *consuming app* defines the functions to be evaluated (business logic, parameter sweeps, etc.).
  - *Rumrunner* provides the infrastructure: a Hono server (or similar) that serves a UI and API for triggering, monitoring, and exploring function runs. The UI and server are interior to the Rumrunner package—users do not need to scaffold or maintain them.
- **Developer Experience:**
  - The user runs their main file (e.g., `bun run index.ts`), which starts the Rumrunner server.
  - The server exposes a UI (bundled with Rumrunner) for exploring available functions, queuing jobs, and viewing results.
  - The consuming app simply registers its functions with Rumrunner; everything else (UI, job management, result display) is handled automatically.
- **Key Features:**
  - Function registration API for the consuming app
  - Hosted UI for triggering and monitoring jobs
  - Queue and cache management
  - Versioning and cache invalidation
  - (Planned) Ranking, qualification, and advanced result exploration

## Roadmap & Checklist

### Core: Hosted Server & UI
- [x] Implement Hono (or similar) server that starts from the consuming app's main file
- [x] Serve the Rumrunner UI (interior to the package) from the server
- [x] Set up our initial script to use the queue-ing version
- [ ] Expose API endpoints for:
  - [ ] Listing available functions (from the consuming app)
  - [ ] Queuing jobs for execution
  - [ ] Monitoring job status and results
- [ ] Provide a function registration API for the consuming app
- [ ] Ensure the UI auto-discovers registered functions and their parameter spaces
- [ ] Integrate queue and cache management with the server endpoints

### UI/UX
- [ ] Setup Tailwind so we can properly style stuff and/or compile it down to CSS that we load or put directly on the page
- [ ] UI: Watch for changes in the queue/results and update automatically
- [ ] UI: Only run functions when triggered from the interface (not automatically)
- [ ] UI: List available functions, queued jobs, and results
- [ ] UI: Allow triggering execution of queued jobs from the browser
- [ ] UI: Show job status (pending, complete, error) and results

### Developer Experience
- [ ] Document the minimal steps for a consuming app to register functions and launch the Rumrunner server
- [ ] Ensure zero-config experience: running the main file "just works"
- [ ] Provide helpful error messages and onboarding in the UI

## Notes
- This architecture makes Rumrunner a plug-and-play, interactive toolkit for function evaluation.
- The consuming app focuses only on function logic; Rumrunner handles everything else.
- See also: src/cache/file-sqlite-cache.ts, src/helpers.ts, test/cli-e2e.test.ts