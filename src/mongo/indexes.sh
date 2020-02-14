use pixel_app

# users index
db.users.createIndex({ "username": "text", "name": "text", "bio": "text" }, { "weights": { "username": 3, "name": 2, "bio": 1 }} );

# posts index
db.posts.createIndex({ "title": "text", "description": "text", "location": "text" });
