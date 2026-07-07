FROM mcr.microsoft.com/playwright:v1.45.0-noble

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy project files
COPY . .

# Run playwright tests
CMD ["npx", "playwright", "test"]
