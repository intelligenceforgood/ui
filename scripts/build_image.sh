#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'USAGE'
Usage: scripts/build_image.sh <name> <tag> [options]

Positional arguments:
  name                  Image/Dockerfile base name (e.g. console)
  tag                   Image tag suffix (e.g. dev)

Options:
  -f, --dockerfile PATH    Override Dockerfile path (default: docker/<name>.Dockerfile)
  -i, --image IMAGE        Override full image tag (default: <registry>/<name>:<tag>)
      --registry PREFIX    Registry/repo prefix (default: us-central1-docker.pkg.dev/i4g-dev/ui)
  -a, --build-arg KEY=VAL  Additional build arguments (repeatable)
      --no-push            Build locally without pushing to the registry
  -h, --help               Show this message

Examples:
  scripts/build_image.sh console dev
  scripts/build_image.sh console dev --registry us-docker.pkg.dev/i4g-prod/ui
USAGE
}

SCRIPT_DIR=$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd -- "$SCRIPT_DIR/.." && pwd)

DOCKERFILE=""
IMAGE_TAG=""
REGISTRY_PREFIX="us-central1-docker.pkg.dev/i4g-dev/ui"
EXTRA_BUILD_ARGS=()
PUSH_IMAGE=true
POSITIONAL=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        -f|--dockerfile)
            DOCKERFILE="$2"
            shift 2
            ;;
        -i|--image)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --registry)
            REGISTRY_PREFIX="$2"
            shift 2
            ;;
        -a|--build-arg)
            EXTRA_BUILD_ARGS+=("$2")
            shift 2
            ;;
        --no-push)
            PUSH_IMAGE=false
            shift 1
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            POSITIONAL+=("$1")
            shift
            ;;
    esac
done

if [[ ${#POSITIONAL[@]} -lt 2 ]]; then
    echo "Error: name and tag positional arguments are required" >&2
    usage
    exit 1
fi

NAME="${POSITIONAL[0]}"
TAG_VALUE="${POSITIONAL[1]}"

if [[ -z "$DOCKERFILE" ]]; then
    DOCKERFILE="$REPO_ROOT/docker/${NAME}.Dockerfile"
fi

if [[ -z "$IMAGE_TAG" ]]; then
    trimmed_prefix="${REGISTRY_PREFIX%/}"
    IMAGE_TAG="${trimmed_prefix}/${NAME}:${TAG_VALUE}"
fi

if [[ ! -f "$DOCKERFILE" ]]; then
    echo "Error: Dockerfile not found at $DOCKERFILE" >&2
    exit 1
fi

BUILD_CMD=(docker buildx build --platform linux/amd64 -f "$DOCKERFILE" -t "$IMAGE_TAG")

if ((${#EXTRA_BUILD_ARGS[@]})); then
    for arg in "${EXTRA_BUILD_ARGS[@]}"; do
        BUILD_CMD+=("--build-arg" "$arg")
    done
fi

if [[ "$PUSH_IMAGE" == true ]]; then
    BUILD_CMD+=(--push "$REPO_ROOT")
else
    BUILD_CMD+=("$REPO_ROOT")
fi

echo "Running: ${BUILD_CMD[*]}"
"${BUILD_CMD[@]}"
