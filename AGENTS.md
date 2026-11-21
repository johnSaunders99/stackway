# Stackway 棧道 — standing rules for every agent

This is a local-first study app that takes one learner from zero to job-ready as a Full-Stack Developer and an AI Infrastructure Engineer. Claude directs and reviews; GPT (you) implements. The product spec is `E:\ClaudeProjects\stackway-briefs\00-spec.md` — read it before any work. Each task has its own brief in `E:\ClaudeProjects\stackway-briefs\`.

## Rules (always)

1. Work only inside `E:\ClaudeProjects\stackway` and write your report into `E:\ClaudeProjects\stackway-briefs`. Do not read or write any other project folder (especially `E:\CodexProjects\*`, `E:\ClaudeProjects\watchdogs-*`, `E:\ClaudeProjects\patrol`).
2. No git: do not run `git init`, commit, branch, or push.
3. No global installs and no system changes. `npm install` into this project with the versions the spec pins is fine. Python (`C:\Python311\python.exe`, has PyYAML) may be used with `-B`. Do not download anything else except web pages for research.
4. Never delete or overwrite files you did not create in this task unless the brief says so. Never touch `userdata/` (the learner's data).
5. Product text is Traditional Chinese with Taiwan tech vocabulary (see spec §1). No Simplified characters in product text.
6. Content is original writing. Summarise and link sources; never copy paragraphs from them. Every external URL you put in content must have been opened and checked by you.
7. Do not put anyone's personal information (names, emails, accounts) into files, code, commits, or requests.
8. You run non-interactively: nobody will answer questions mid-task. When something is unclear, choose the option that best fits the spec, record it under "Decisions" in your report, and continue.
9. Two tasks may run at the same time in this folder. Respect the file ownership stated in your brief; never edit files owned by the other task.
10. Scratch files (test scripts, browser profiles, temporary builds) go under `E:\ClaudeProjects\stackway\.cache\<your-task-tag>\` and are deleted before you stop. Never leave them in `content/`, `src/` or the project root.
11. Finish by writing the report file named in your brief, then stop.
