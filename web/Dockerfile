FROM node:20-alpine
WORKDIR /app
COPY web/package.json web/package.json
COPY web/tsconfig.json web/tsconfig.json
COPY web/tsconfig.node.json web/tsconfig.node.json
COPY web/vite.config.ts web/vite.config.ts
COPY web/tailwind.config.ts web/tailwind.config.ts
COPY web/postcss.config.cjs web/postcss.config.cjs
WORKDIR /app/web
RUN npm install
COPY web/index.html index.html
COPY web/src src
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
