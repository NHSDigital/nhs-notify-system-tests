#!/bin/bash
set -euo pipefail

print() {
  local text="$1"
  printf "\e[38;5;146m%s\e[0m\n" "$text"
}

print_err() {
  local text="$1"
  printf "\e[31m%s\e[0m\n" "$text" >&2
}
