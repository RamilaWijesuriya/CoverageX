FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install ts-loader --save-dev
RUN npm install style-loader @testing-library/react @types/jest --save-dev
RUN npm install css-loader @testing-library/jest-dom --save-dev
COPY . .
CMD ["npm", "start"]