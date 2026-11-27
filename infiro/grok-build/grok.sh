#!/bin/sh
# Pacman owns this install. Skip the upstream auto-updater unless the caller
# already set GROK_DISABLE_AUTOUPDATER. A falsy value counts as unset upstream
# and turns update checks back on.
if [ -z "${GROK_DISABLE_AUTOUPDATER+x}" ]; then
  export GROK_DISABLE_AUTOUPDATER=1
fi
exec /usr/lib/grok-build/grok "$@"
