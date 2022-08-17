---
title: "Git Cheat Sheet"
date: "2022-05-15"
---

## Git Cheat Sheet

This cheat sheet provides a quick overview of some time saving git commands. If you need more information or context, click the title of each section.

#### [Avoid Rebase Hell](https://blog.oddbit.com/post/2019-06-17-avoid-rebase-hell-squashing-wi/)

```bash
$ git checkout -b work target_branch
$ git merge --squash problematic_rebase_branch
```

#### [Auto Resolve Repetitive Conflicts](https://stackoverflow.com/questions/10697463/resolve-git-merge-conflicts-in-favor-of-their-changes-during-a-pull)

```bash
$ git checkout --theirs ./path/to/file/or/directory
```
```bash
$ git checkout --ours ./path/to/file/or/directory
```

#### [Merge last N commits](https://stackoverflow.com/questions/5189560/how-do-i-squash-my-last-n-commits-together)

```bash
$ git reset --soft "HEAD~n"
$ git commit -m "new commit message"
```

#### [Push the current branch to its upstream by default](https://stackoverflow.com/questions/948354/default-behavior-of-git-push-without-a-branch-specified)

```bash
$ git config --global push.default simple # first config
$ git push origin # then simply push to origin
```

#### [Clean up local branches by prefix (e.g 'MT-')](https://git-scm.com/docs/git-branch#_options)

```bash
$ git branch -D `git branch | grep MT-`
```

#### [Clean up local remote-tracking branches by prefix (e.g 'MT-')](https://git-scm.com/docs/git-branch#_options)

```bash
$ git branch -rd `git branch -r | grep MT-`
```

#### [Undo last commit (locally)](https://git-scm.com/docs/git-reset)

```bash
$ git reset HEAD~ 
```

#### [Use GitHub to compare two branches](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/viewing-and-comparing-commits/comparing-commits)

```text
https://github.com/MobieTrain/mobietrain-api/compare/{old-branch}...{new-branch}
```

#### [Alternatives to .gitignore)](https://stackoverflow.com/questions/4287906/something-like-gitignore-but-not-git-ignore)

```bash
.git/info/exclude (per project basis)
 ~/.config/git/ignore (per user basis)
```

#### [Create and apply patches](https://stackoverflow.com/questions/5159185/create-a-git-patch-from-the-uncommitted-changes-in-the-current-working-directory)

Send the diffs to a patch file:
```bash
git diff > mypatch.patch
```

You can later apply the patch:
```bash
git apply mypatch.patch
```

#### [Git Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)

Clone and automatically initialize/update each submodule in the repository:
```bash
git clone --recurse-submodules https://github.com/chaconinc/MainProject
```

Go into your submodules and fetch and update for you.
```bash
git submodule update --init --remote
```