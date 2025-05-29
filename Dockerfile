FROM node:22.14.0-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY /prisma ./prisma

RUN npm ci

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start"]