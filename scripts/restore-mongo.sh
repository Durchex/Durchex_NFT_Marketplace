#!/bin/bash
set -e

# Restore MongoDB database from backup
BACKUP_FILE="${1:?Backup file path required as argument}"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Restoring MongoDB from: $BACKUP_FILE"

# Verify backup format
if tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
    echo "✓ Backup file is valid"
else
    echo "✗ Invalid backup file"
    exit 1
fi

# Create restore temp directory
RESTORE_DIR=$(mktemp -d)
trap "rm -rf $RESTORE_DIR" EXIT

# Extract backup
echo "Extracting backup..."
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

# Restore database (drop existing collections first)
echo "Restoring database..."
mongorestore --uri="$MONGO_URI" --drop --archive="$BACKUP_FILE" --gzip

echo "✓ Database restored successfully"

# Verify restore
COLLECTION_COUNT=$(mongosh "$MONGO_URI" --eval "db.getCollectionNames().length" --quiet)
echo "Collections in database: $COLLECTION_COUNT"

# Reindex after restore
echo "Reindexing..."
mongosh "$MONGO_URI" --eval "db.getCollectionNames().forEach(c => db[c].reIndex())" --quiet

echo "✓ Restore completed successfully"
