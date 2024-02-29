#!/bin/sh

for var in $(printenv | grep '^VITE_'); do
    # Extract variable name and value
    key=$(echo "$var" | cut -d= -f1)
    value=$(echo "$var" | cut -d= -f2-)
    
    # Write to .env file
    echo "$key=$value" >> .env
done

npm run build

npm run start
