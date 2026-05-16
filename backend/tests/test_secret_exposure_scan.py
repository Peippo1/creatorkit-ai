from __future__ import annotations

import re
import subprocess
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
TEXT_SUFFIXES = {
    ".css",
    ".example",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".py",
    ".tsx",
    ".ts",
    ".txt",
}
IGNORED_PARTS = {".git", ".next", ".pytest_cache", ".turbo", ".venv", "node_modules", "__pycache__"}
ALLOWLISTED_SCAN_FILES = {
    "backend/tests/test_secret_exposure_scan.py",
    "backend/tests/test_security_env.py",
}
SECRET_PUBLIC_ENV_RE = re.compile(
    r"NEXT_PUBLIC_[A-Z0-9_]*(?:API_KEY|OPENAI|PASSWORD|PRIVATE_KEY|SECRET|TOKEN)[A-Z0-9_]*"
)
OPENAI_SECRET_LITERAL_RE = re.compile(r"sk-[A-Za-z0-9_-]{20,}")


def _tracked_files() -> list[Path]:
    output = subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
        cwd=REPO_ROOT,
        text=True,
    )
    return [REPO_ROOT / line for line in output.splitlines() if line]


def _source_files() -> list[Path]:
    files: list[Path] = []
    for path in _tracked_files():
        if any(part in IGNORED_PARTS for part in path.relative_to(REPO_ROOT).parts):
            continue
        if path.relative_to(REPO_ROOT).as_posix() in ALLOWLISTED_SCAN_FILES:
            continue
        if path.suffix in TEXT_SUFFIXES and path.exists():
            files.append(path)
    return files


class SecretExposureScanTests(unittest.TestCase):
    def test_only_env_example_is_tracked(self) -> None:
        tracked_env_files = [
            path.relative_to(REPO_ROOT).as_posix()
            for path in _tracked_files()
            if path.name.startswith(".env")
        ]

        self.assertTrue((REPO_ROOT / ".env.example").exists())
        self.assertEqual(tracked_env_files, [".env.example"])

    def test_no_public_secret_env_names_in_source(self) -> None:
        offenders = []
        for path in _source_files():
            text = path.read_text(encoding="utf-8", errors="ignore")
            if path.name == ".env.example":
                continue
            if SECRET_PUBLIC_ENV_RE.search(text):
                offenders.append(path.relative_to(REPO_ROOT).as_posix())

        self.assertEqual(offenders, [])

    def test_no_openai_secret_literals_in_source(self) -> None:
        offenders = []
        for path in _source_files():
            text = path.read_text(encoding="utf-8", errors="ignore")
            if OPENAI_SECRET_LITERAL_RE.search(text):
                offenders.append(path.relative_to(REPO_ROOT).as_posix())

        self.assertEqual(offenders, [])

    def test_client_components_do_not_import_server_env(self) -> None:
        offenders = []
        for path in _source_files():
            if path.suffix not in {".ts", ".tsx"}:
                continue

            text = path.read_text(encoding="utf-8", errors="ignore")
            first_statement = text.lstrip().splitlines()[:1]
            is_client_component = bool(first_statement and first_statement[0] in {'"use client"', "'use client'"})
            imports_server_env = "@/lib/server-env" in text or "frontend/lib/server-env" in text
            if is_client_component and imports_server_env:
                offenders.append(path.relative_to(REPO_ROOT).as_posix())

        self.assertEqual(offenders, [])


if __name__ == "__main__":
    unittest.main()
