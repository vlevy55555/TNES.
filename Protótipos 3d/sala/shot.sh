#!/usr/bin/env bash
# Screenshot a page of this prototype with headless Chrome.
# usage: ./shot.sh "preview.html?obj=armchair&cam=2,1.4,3" out.png [WxH]
# Requires the static server: (cd "Protótipos 3d" && python3 -m http.server 8765)
set -e
URL="http://localhost:8765/sala/$1"; OUT="$2"; SIZE="${3:-1672,941}"
google-chrome --headless=new --no-sandbox --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader \
  --hide-scrollbars --window-size="$SIZE" --virtual-time-budget=${BUDGET:-30000} \
  --screenshot="$OUT" "$URL" 2>/dev/null
echo "saved $OUT"
