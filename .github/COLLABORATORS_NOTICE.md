Subject: Repo History Rewritten — Git LFS Migration (Action Required)

Hi team,

Quick update: I migrated several large audio files into Git LFS and force-pushed a rewritten `main` branch to the remote. This was necessary because some audio files exceeded GitHub's 100 MB file size limit.

What changed
- Large audio files in `frontend/library/audio/private/` are now tracked with Git LFS.
- The repository history on `main` was rewritten and force-pushed to update the pointers to LFS objects.

Action required (pick one):
1) Recommended - Re-clone the repository (cleanest)
```bash
# remove the old clone (optional) and clone fresh
git clone https://github.com/albert-raphael/raphaelshorizon.git
cd raphaelshorizon
# ensure git-lfs is installed, then fetch LFS objects
git lfs install
git lfs pull
```

2) Alternatively - Reset your local `main` to match remote
```bash
git fetch origin
# WARNING: this will discard local changes on main
git reset --hard origin/main
git lfs install
git lfs pull
```

Notes & warnings
- Because history was rewritten, local branches based on the old `main` may require rebasing or recreation.
- Please do not push old branches that include the pre-migration large files; coordinate with me if needed.
- Ensure Git LFS is installed on your machine: https://git-lfs.github.com/

If you need help, I can assist with the transition or run the commands for you.

Thanks,
Raphael's Horizon Dev
