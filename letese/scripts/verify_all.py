#!/usr/bin/env python3
"""Verify all Python files in the project compile cleanly."""
import subprocess
import sys
from pathlib import Path

ROOT = Path("/root/clawd/letese")
PY_FILES = list(ROOT.rglob("*.py"))

FAILED = []
for f in PY_FILES:
    if "__pycache__" in str(f):
        continue
    result = subprocess.run(
        ["python3", "-m", "py_compile", str(f)],
        capture_output=True,
    )
    if result.returncode != 0:
        FAILED.append((f, result.stderr.decode()))

if FAILED:
    print(f"❌ {len(FAILED)} files failed to compile:")
    for f, err in FAILED:
        print(f"  {f.relative_to(ROOT)}: {err[:100]}")
    sys.exit(1)
else:
    print(f"✅ All {len(PY_FILES)} Python files compile cleanly")
