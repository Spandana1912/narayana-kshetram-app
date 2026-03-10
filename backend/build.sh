#!/bin/bash
echo "Installing dependencies for Puppeteer & Fonts..."

# 1. Provide necessary shared Linux libraries for Headless Chromium (Puppeteer)
if command -v apt-get &> /dev/null; then
  apt-get update
  apt-get install -y \
    fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libcups2 libdrm2 libgbm1 libnspr4 libnss3 libx11-xcb1 \
    libxcomposite1 libxdamage1 libxrandr2 xdg-utils
fi

# 2. Setup the local custom Telugu fonts
mkdir -p ~/.fonts
curl -L -o ~/.fonts/NotoSansTelugu-Regular.ttf "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf"

# Refresh font cache
fc-cache -f -v

echo "Installation complete!"
npm install
