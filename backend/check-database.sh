#!/bin/bash

echo "🔍 Checking MongoDB Database..."
echo ""

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "❌ MongoDB is not running"
    echo "💡 Start it with: brew services start mongodb-community"
    exit 1
fi

echo "✅ MongoDB is running"
echo ""

# Connect and show databases
echo "📊 Available Databases:"
mongosh --quiet --eval "db.adminCommand('listDatabases').databases.forEach(d => print(d.name))" 2>/dev/null || echo "Could not list databases"

echo ""
echo "📁 Collections in 'tfireviews' database:"
mongosh tfireviews --quiet --eval "db.getCollectionNames()" 2>/dev/null || echo "Could not list collections"

echo ""
echo "🎬 Movies count:"
mongosh tfireviews --quiet --eval "db.movies.countDocuments()" 2>/dev/null || echo "0"

echo ""
echo "⭐ Reviews count:"
mongosh tfireviews --quiet --eval "db.reviews.countDocuments()" 2>/dev/null || echo "0"

echo ""
echo "👤 Users count:"
mongosh tfireviews --quiet --eval "db.users.countDocuments()" 2>/dev/null || echo "0"

echo ""
echo "📋 Sample Movie (first one):"
mongosh tfireviews --quiet --eval "db.movies.findOne()" 2>/dev/null || echo "No movies found"
