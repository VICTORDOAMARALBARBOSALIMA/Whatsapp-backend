#!/bin/bash
# Instala dependências do sistema
apt-get update && apt-get install -y \
  chromium \
  chromium-sandbox \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libnspr4 \
  libnss3 \
  lsb-release \
  xdg-utils \
  wget \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Instala dependências do Node
npm install

# Instala o Chrome estável para Puppeteer
npx @puppeteer/browsers install chrome@stable
