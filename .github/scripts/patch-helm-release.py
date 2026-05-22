#!/usr/bin/env python3
"""
Bump helm/ Chart.yaml version + appVersion and default image.repo/tag from CI env.
Used before `helm package` on GitHub Releases. Env:
  RELEASE_TAG, HARBOR_REGISTRY, HARBOR_REPOSITORY

RELEASE_TAG should be a bare SemVer (e.g. 2.1.0, 2.0.0-rc.1) — it is written to both Chart
version and image tag and must satisfy Helm's rules for Chart.version.

Optional CHART_ROOT (default helm).
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path


def main() -> int:
    chart_root = Path(os.environ.get("CHART_ROOT", "helm"))
    chart_path = chart_root / "Chart.yaml"
    values_path = chart_root / "values.yaml"

    release_tag = os.environ.get("RELEASE_TAG", "").strip()
    registry = os.environ.get("HARBOR_REGISTRY", "").strip().rstrip("/")
    repo_path = os.environ.get("HARBOR_REPOSITORY", "").strip().strip("/")

    if not release_tag:
        print("RELEASE_TAG must be non-empty.", file=sys.stderr)
        return 1
    if not registry:
        print("HARBOR_REGISTRY must be non-empty.", file=sys.stderr)
        return 1
    if not repo_path:
        print("HARBOR_REPOSITORY must be non-empty.", file=sys.stderr)
        return 1

    image_repo = f"{registry}/{repo_path}"

    chart_yaml = patch_chart_version(chart_path.read_text(encoding="utf-8"), release_tag)
    chart_path.write_text(chart_yaml, encoding="utf-8")

    values_yaml = patch_values_image(values_path.read_text(encoding="utf-8"), image_repo, release_tag)
    values_path.write_text(values_yaml, encoding="utf-8")

    print(f"Patched {chart_path} version={release_tag} appVersion={release_tag!r}")
    print(f"Patched defaults image.repository={image_repo} tag={release_tag!r}")
    return 0


def patch_chart_version(text: str, version: str) -> str:
    app_literal = json.dumps(version)

    text, n_ver = re.subn(
        r"^version:\s*.*$",
        f"version: {version}",
        text,
        count=1,
        flags=re.MULTILINE,
    )
    if n_ver != 1:
        raise SystemExit("Expected exactly one `version:` line in Chart.yaml")

    text, n_av = re.subn(
        r"^appVersion:\s*.*$",
        f"appVersion: {app_literal}",
        text,
        count=1,
        flags=re.MULTILINE,
    )
    if n_av != 1:
        raise SystemExit("Expected exactly one `appVersion:` line in Chart.yaml")

    return text


def patch_values_image(text: str, image_repository: str, image_tag: str) -> str:
    repo_lit = json.dumps(image_repository)
    tag_lit = json.dumps(image_tag)
    text, n_repo = re.subn(
        r"(?m)^(\s+)repository:\s*.*$",
        lambda m: f"{m.group(1)}repository: {repo_lit}",
        text,
        count=1,
    )
    if n_repo != 1:
        raise SystemExit("Expected exactly one `repository:` line in values.yaml (image.repo)")

    text, n_tag = re.subn(
        r"(?m)^(\s+)tag:\s*.*$",
        lambda m: f"{m.group(1)}tag: {tag_lit}",
        text,
        count=1,
    )
    if n_tag != 1:
        raise SystemExit("Expected exactly one `tag:` line in values.yaml (image.tag)")
    return text


if __name__ == "__main__":
    raise SystemExit(main())
