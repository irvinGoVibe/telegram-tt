#!/usr/bin/env bash

create-dmg \
    --volname "Telegram Tasks installer" \
    --volicon "./tauri/icons/macos/icon.icns" \
    --background "./tauri/images/background-dmg.tiff" \
    --window-size 540 380 \
    --icon-size 100 \
    --icon "Telegram Tasks.app" 138 225 \
    --hide-extension "Telegram Tasks.app" \
    --app-drop-link 402 225 \
    "$1" \
    "$2"
