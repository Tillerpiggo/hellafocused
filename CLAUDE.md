# Claude Instructions

## /commit Command Process
When the user runs `/commit`:
1. Run `npm run build`
2. Fix any build errors that occur
3. Stage the relevant files with `git add`
4. Create the commit with an appropriate message
5. Push to the remote branch with `git push origin <current-branch>`

## General Rule
Never attribute yourself as co-author in any commit messages.

- Do not attribute yourself as author to commit messages
- don't attribute yourself to commit messages

## Code Comments
- Avoid comments that plainly describe what the code does without adding useful information not obviously implied by the code. BAD: `// fetch data - fetchData()`. GOOD: `fetchData()` (no comment needed unless this has some side effect)