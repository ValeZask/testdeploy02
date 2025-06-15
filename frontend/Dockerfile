FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Устанавливаем переменные окружения для React dev server
ENV HOST=0.0.0.0
ENV PORT=3000
ENV WATCHPACK_POLLING=true

CMD ["npm", "start"]
