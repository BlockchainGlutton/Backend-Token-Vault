const config = {};

config.port = process.env.PORT || 5000;
config.client = "http://localhost:3000";
config.dbURL = process.env.DATABASEURL || "mongodb://localhost/socialchat";
config.secret = "XNJz52oSGKfpg32TKYzGo4NkgPKm4nGcLCbfdFk0";
config.jwt_secret = "XNJz52oSGKfpg32TKYzGo4NkgPKm4nGcLCbfdFk0";
module.exports = config;
