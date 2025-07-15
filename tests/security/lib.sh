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

rnd() {
  local range="$1"; local len="$2"
  head /dev/urandom | LC_ALL=C tr -dc $range | head -c $len
}

password() {
  local upper=$(rnd 'A-Z' 3)
  local lower=$(rnd 'a-z' 3)
  local num=$(rnd '0-9' 3)
  local special=$(rnd '^$*.[]{}()?"!@#%&/\,><:;|_~+=' 3)

  echo "$upper$lower$num$special"
}
