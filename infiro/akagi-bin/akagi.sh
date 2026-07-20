#!/bin/sh

# Akagi routes relative runtime data to its XDG config directory when it is
# launched as an AppImage.  The packaged application is likewise read-only,
# so use the same upstream-supported path mode for the system installation.
export APPIMAGE=/opt/akagi/akagi

# The upstream binary requires both `uv` and a discoverable `python3`, even
# though uv can install and manage Python itself.  When the optional uv package
# is present, make its managed Python 3.12 available to Akagi without requiring
# Arch's system Python package.
if command -v uv >/dev/null 2>&1; then
  if ! _akagi_python="$(
    uv python find 3.12 --managed-python --no-project --no-progress 2>/dev/null
  )"; then
    uv python install 3.12 --no-bin --no-progress
    _akagi_python="$(
      uv python find 3.12 --managed-python --no-project --no-progress 2>/dev/null
    )" || _akagi_python=
  fi

  if [ -n "${_akagi_python}" ]; then
    PATH="${_akagi_python%/*}:${PATH}"
    export PATH
  fi
fi

exec /opt/akagi/akagi "$@"
