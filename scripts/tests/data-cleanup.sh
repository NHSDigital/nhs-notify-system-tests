#!/bin/bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

cd tests/test-data-cleanup

npm run cleanup
