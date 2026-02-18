# Self-signed SSL Certificate for Development

This directory contains SSL certificates for the Nginx reverse proxy.

## For Production
Replace the files in this directory with valid SSL certificates from:
- Let's Encrypt (recommended - free)
- Your domain provider
- A certificate authority

## To Generate Self-Signed Certificate (Development Only)

```bash
# Navigate to this directory
cd nginx/ssl

# Generate private key and certificate (valid for 365 days)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/CN=localhost"

# Or interactive mode
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout key.pem -out cert.pem
```

## Expected Files

- `cert.pem` - Certificate file
- `key.pem` - Private key file

IMPORTANT: Never commit real SSL private keys to version control!
