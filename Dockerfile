FROM node:24-alpine
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD [ "npm", "start" ]