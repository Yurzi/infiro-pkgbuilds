#!/bin/bash

XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"

# Allow users to override command-line options
ANTIGRAVITY_IDE_USER_FLAGS=()
if [[ -f "${XDG_CONFIG_HOME}/antigravity-ide-flags.conf" ]]; then
    mapfile -t _lines < <(sed -e 's/#.*//' -e '/^[[:space:]]*$/d' "${XDG_CONFIG_HOME}/antigravity-ide-flags.conf")
    for _line in "${_lines[@]}"; do
        # shellcheck disable=SC2206
        ANTIGRAVITY_IDE_USER_FLAGS+=(${_line})
    done
fi

exec /opt/antigravity-ide/bin/antigravity-ide "${ANTIGRAVITY_IDE_USER_FLAGS[@]}" "$@"
