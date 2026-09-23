FROM public.ecr.aws/lambda/nodejs:22
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD [ "npm", "start" ]