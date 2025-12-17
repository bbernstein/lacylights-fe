# Important rules for all development work

* All code must be written in TypeScript.
* All code must be formatted using Prettier.
* All code must be linted using ESLint.
* All code must be tested using Jest.
* All code must be documented using JSDoc.
* All work must be done in a branch, committed to git, pushed to github, then create a pull request to merge into the main branch.
* After code is pushed, await copilot review, wait for comments, and address any feedback until there is no new feedback.
* All code must have unit tests that pass before being committed.
* Unit tests need to have coverage above the thresholds set in the coverage settings.
* If new code causes coverage to drop below the threshold, address the issue before committing.
* Never raise the coverage thresholds without a good reason and manual prompting.
* Always check the current branch of the repo before making code changes. If in main branch, create a new branch to represent the new code changes.
* All lint warnings should be considered errors, so they must be fixed before commiting code.
* Every function must have a unit test unless that's very difficult to do.
* Every test must pass before any code is committed.
* If there is an existing branch, aside from main, for the code being edited, we should not create a new branch but rather use that existing branch.
* Never try to commit to the main branch directly, always create a new branch if currently in main.
