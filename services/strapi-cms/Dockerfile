FROM node:18-alpine

WORKDIR /app

# Instalar dependencias de compilación necesarias
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 1337

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
