# 1. Start with a blank Linux machine that has Node.js 18 installed
FROM node:18-alpine

# 2. Create a folder named "app"
WORKDIR /app

# 3. Copy the package files (your dependencies list)
COPY package*.json ./

# 4. Install the dependencies inside the Box
RUN npm install

# 5. Copy ALL your frontend code into the Box
COPY . .

# 6. Open Port 3000
EXPOSE 3000

# 7. Start the website
CMD ["npm", "run", "dev"]
