#!/bin/bash
echo "Installing Noto Sans Telugu fonts for Render..."

# Create local fonts directory
mkdir -p ~/.fonts

# Download the font
curl -L -o ~/.fonts/NotoSansTelugu-Regular.ttf "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf"

# Refresh font cache
fc-cache -f -v

echo "Fonts installed successfully!"
npm install
