# Fix GitHub push (large files removed)

GitHub rejected the push because **node_modules/** and **release/** (Electron build) were committed and exceed the 100 MB file limit.

A **.gitignore** is now in place so they won't be committed again. You need to **rewrite history** so the next push doesn't include those folders.

Run these commands **one by one** in your project folder (PowerShell or Git Bash).

## Option A: Fresh main branch (recommended – one clean commit, push works)

This replaces `main` with a single commit that contains your code but not `node_modules` or `release`. You lose previous commit history on `main` but can push immediately.

```bash
# 1. Backup current main (optional)
git branch backup-main

# 2. Start a new branch with no history
git checkout --orphan temp-main

# 3. Unstage everything, then add again (respects .gitignore)
git reset

# 4. Add all files (node_modules and release are ignored)
git add .

# 5. Commit
git commit -m "Clean repo for Render deploy"

# 6. Replace main with this clean history
git branch -D main
git branch -m main

# 7. Force push (overwrites GitHub main)
git push -u origin main --force
```

After this, your repo on GitHub will have one commit. Render can deploy from it.

---

## Option B: Keep history (advanced)

If you need to keep full history, you must remove the folders from every commit using:

```bash
git filter-branch --force --index-filter "git rm -rf --cached --ignore-unmatch node_modules release" --prune-empty HEAD
git push origin main --force
```

This can be slow on large repos. Prefer Option A unless you need the history.
