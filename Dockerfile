FROM mcr.microsoft.com/playwright:v1.61.1-noble

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy project files
COPY . .

# Run playwright tests
CMD ["npx", "playwright", "test"]
