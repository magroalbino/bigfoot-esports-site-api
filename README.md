# Sistema de Notícias LoL - Next.js

Sistema de notícias automáticas do League of Legends baseado no Inven Global.

## 🚀 Como Executar

### 1. Criar a estrutura do projeto

```bash
mkdir lol-news-system
cd lol-news-system
```

### 2. Criar os arquivos necessários

Crie a seguinte estrutura de pastas e arquivos:

```
lol-news-system/
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── README.md
├── pages/
│   ├── _app.js
│   └── index.js
└── styles/
    └── globals.css
```

### 3. Copiar o conteúdo dos arquivos

- Copie o conteúdo do `package.json` do primeiro artefato
- Copie o conteúdo do `next.config.js` do segundo artefato
- Copie o conteúdo do `tailwind.config.js` do terceiro artefato
- Copie o conteúdo do `postcss.config.js` do quarto artefato
- Copie o conteúdo do `pages/index.js` do quinto artefato
- Copie o conteúdo do `styles/globals.css` do sexto artefato
- Copie o conteúdo do `pages/_app.js` do sétimo artefato

### 4. Instalar dependências

```bash
npm install
```

### 5. Executar o projeto

```bash
npm run dev
```

### 6. Acessar no navegador

Abra [http://localhost:3000](http://localhost:3000) para ver o sistema funcionando.

## 📱 Funcionalidades

- ✅ **5 notícias mais recentes** do Inven Global sobre LoL
- ✅ **Interface moderna** com Tailwind CSS
- ✅ **Responsivo** para desktop e mobile
- ✅ **Modal** para leitura completa das notícias
- ✅ **Timestamps** relativos (4 horas atrás, 2 dias atrás)
- ✅ **Links diretos** para as fontes originais
- ✅ **Design temático** do League of Legends
- ✅ **Badges** de tradução e novidades

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start

# Lint do código
npm run lint
```

## 📰 Notícias Incluídas

1. **cvMax sobre Vitória 2-0 Contra DRX** (4 horas atrás)
   - Marco de ShowMaker: 400 kills na LCK
   
2. **T1's Push for 2nd Place** (4 horas atrás)
   - kkOma fala sobre Doran e Gumayusi
   
3. **Nongshim RedForce - 7ª Derrota Consecutiva** (2 dias atrás)
   - Gen.G domina em 24 minutos
   
4. **Gen.G Coach Enfatiza Foco nos Playoffs** (2 dias atrás)
   - Vitória dominante sobre Nongshim
   
5. **LCK Finals na MBC - Marco Histórico** (3 dias atrás)
   - Primeira transmissão em TV aberta

## 🎨 Personalização

### Cores do tema
- Azul principal: `#3B82F6`
- Roxo secundário: `#8B5CF6`
- Verde sucesso: `#10B981`
- Dourado LoL: `#C89B3C`

### Modificar notícias
Edite o array `getRecentNews()` no arquivo `pages/index.js` para adicionar/remover notícias.

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Faça upload da pasta .next para Netlify
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📋 Requisitos

- Node.js 18+ 
- NPM ou Yarn
- Navegador moderno com suporte a ES6+

## 🔍 Solução de Problemas

### Port 3000 já está em uso
```bash
npm run dev -- -p 3001
```

### Erro de dependências
```bash
rm -rf node_modules package-lock.json
npm install
```

### Problemas com Tailwind
```bash
npm run build
# Limpa o cache do Tailwind
```

## 📞 Suporte

Se você encontrar problemas:

1. Verifique se todas as dependências foram instaladas
2. Certifique-se de que está usando Node.js 18+
3. Verifique se todos os arquivos foram criados corretamente
4. Limpe o cache: `rm -rf .next node_modules && npm install`

## 🎯 Próximos Passos

Para conectar com a API real:
1. Implemente o endpoint `/api/news.js`
2. Adicione scraping automático do Inven Global
3. Configure sistema de cache
4. Adicione notificações push para novas notícias

---

**Desenvolvido para fãs de League of Legends** 🎮
