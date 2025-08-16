#!/bin/bash

# Script de instalação automática do Sistema de Notícias LoL
echo "🎮 Configurando Sistema de Notícias LoL..."

# Criar estrutura de pastas
echo "📁 Criando estrutura de pastas..."
mkdir -p lol-news-system/pages
mkdir -p lol-news-system/styles

cd lol-news-system

# Criar package.json
echo "📦 Criando package.json..."
cat > package.json << 'EOF'
{
  "name": "lol-news-system",
  "version": "1.0.0",
  "description": "Sistema de notícias automáticas do League of Legends",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.25",
    "@types/react-dom": "^18.2.11",
    "eslint": "^8.51.0",
    "eslint-config-next": "^14.0.0",
    "typescript": "^5.2.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Criar next.config.js
echo "⚙️ Criando configurações do Next.js..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'static.invenglobal.com',
      'www.invenglobal.com',
      'invenglobal.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
EOF

# Criar tailwind.config.js
echo "🎨 Configurando Tailwind CSS..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      colors: {
        'lol-gold': '#C89B3C',
        'lol-blue': '#0596AA',
        'lol-dark': '#010A13',
      }
    },
  },
  plugins: [],
}
EOF

# Criar postcss.config.js
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Criar styles/globals.css
echo "🎨 Criando estilos globais..."
cat > styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}

/* Animações customizadas */
@keyframes slideInNotification {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutNotification {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Scrollbar customizada */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.7);
}
EOF

# Criar pages/_app.js
cat > pages/_app.js << 'EOF'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps />
}

export default MyApp
EOF

echo "📰 Criando página principal com notícias..."
# Como o arquivo index.js é muito grande, vamos criar uma versão simplificada
cat > pages/index.js << 'EOF'
// Aqui você deve colar o conteúdo completo do pages/index.js do artefato anterior
// Por questões de tamanho, cole manualmente o código do artefato "main-page"
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Sistema de Notícias LoL</title>
      </Head>
      <h1>Cole aqui o código do artefato main-page!</h1>
      <p>Abra o arquivo pages/index.js e substitua todo o conteúdo pelo código do artefato "main-page".</p>
    </div>
  );
}
EOF

# Instalar dependências
echo "⬇️ Instalando dependências..."
npm install

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. cd lol-news-system"
echo "2. Abra pages/index.js e cole o código completo do artefato 'main-page'"
echo "3. npm run dev"
echo "4. Acesse http://localhost:3000"
echo ""
echo "🎮 Divirta-se com as notícias do LoL!"
EOF

# Tornar o script executável
chmod +x setup.sh
