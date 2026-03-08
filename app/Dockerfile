FROM node:18-alpine

WORKDIR /app

# Dependencias para ejecutar app/index.js
COPY app/package.json app/package-lock.json* ./
RUN npm install

# Codigo necesario para resolver vistas y servicios
COPY app ./app
COPY services ./services

WORKDIR /app/app

EXPOSE 5000
CMD ["node", "index.js"]
