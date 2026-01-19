#!/bin/bash
set -e

# Backup MongoDB database before deployment
BACKUP_DIR="/backups/mongo"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/durchex_$TIMESTAMP.tar.gz"

echo "Creating MongoDB backup..."
mkdir -p "$BACKUP_DIR"

mongodump --uri="$MONGO_URI" --archive="$BACKUP_FILE" --gzip

echo "Backup created: $BACKUP_FILE"

# Verify backup
if tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
    echo "✓ Backup verified"
else
    echo "✗ Backup verification failed"
    exit 1
fi

# Remove old backups (keep last 7 days)
echo "Cleaning old backups..."
find "$BACKUP_DIR" -name "durchex_*.tar.gz" -mtime +7 -delete

# Upload to S3 for redundancy
if command -v aws &> /dev/null; then
    echo "Uploading backup to S3..."
    aws s3 cp "$BACKUP_FILE" "s3://durchex-backups/mongo/$TIMESTAMP.tar.gz"
    echo "✓ Backup uploaded to S3"
fi

echo "Backup completed successfully"
