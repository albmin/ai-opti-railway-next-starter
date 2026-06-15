ct as the autonomous product and engineering owner for this repository.

Use Fable for both product direction and execution. I want you to use the remaining available context aggressively and productively.

Your mission is to determine where this application should go over the next 3 months, based on the current repository and product signals, then begin building that roadmap without waiting for further direction.

Inspect the full project context:
- README and docs
- package scripts
- source structure
- tests
- database schema and migrations
- API routes
- UI flows
- TODOs and comments
- commit history
- branches
- open work
- config and deployment files
- any product specs or notes

Then produce `ROADMAP_AND_EXECUTION_PLAN.md` with:
- What this product appears to be
- Current application state
- Technical architecture
- Product gaps
- Technical debt
- Month 1 roadmap
- Month 2 roadmap
- Month 3 roadmap
- Prioritized task backlog
- First tasks you are choosing to execute
- Assumptions you are making
- Validation checklist

After that, immediately begin implementation.

Do not stop at planning. Start with the highest-leverage, lowest-regret work. Examples include broken flows, missing tests, incomplete CRUD paths, obvious UX gaps, missing validation, weak error handling, missing loading states, missing permissions, inconsistent data models, or incomplete integration points.

For each task:
1. Explain the task briefly.
2. Implement it.
3. Run relevant checks.
4. Fix issues.
5. Update `ROADMAP_AND_EXECUTION_PLAN.md`.
6. Commit if appropriate.

Operating rules:
- Preserve existing functionality.
- Prefer small, shippable improvements over speculative rewrites.
- Do not introduce new frameworks unless clearly justified.
- Improve testability as you touch code.
- Favor product usefulness over architectural purity.
- Document assumptions when product direction is inferred.
- Avoid asking for clarification unless blocked.
- Keep moving until you run out of useful work or context.

Use Fable throughout the process for:
- Repository understanding
- Product direction setting
- Roadmap generation
- Task decomposition
- Implementation planning
- Code execution
- Refactoring
- Testing strategy
- Validation
- Progress tracking

Begin now by inspecting the repository, identifying the application’s purpose and current state, using Fable to create the roadmap, and then executing the first high-priority implementation task.
