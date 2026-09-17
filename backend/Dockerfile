FROM node:24-bookworm-slim

WORKDIR /app

# Install Python and pip for the research engine
RUN apt-get update \
    && apt-get install -y python3 python3-pip \
    && ln -s /usr/bin/python3 /usr/local/bin/python \
    && rm -rf /var/lib/apt/lists/*

# Install Node dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Install Python dependencies
RUN python3 -m pip install --break-system-packages pandas numpy

# Copy backend application files
COPY server.js ./
COPY research ./research
COPY data ./data

ENV NODE_ENV=production

EXPOSE 10000

CMD ["npm", "start"]