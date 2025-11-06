FROM node:20-alpine

# Рабочая директория внутри контейнера
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальной код
COPY . .

# Бекенд слушает порт 3000
EXPOSE 3000

# Команда запуска
CMD ["node", "server.js"]
