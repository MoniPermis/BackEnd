FROM node:22.14.0-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]