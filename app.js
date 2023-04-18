const expressSession = require("express-session");
const methodOverride = require("method-override");
const http = require("http");
const socketIO = require("socket.io");
const bodyParser = require("body-parser");
const express = require("express");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const JWTstrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;
const mongoose = require("mongoose");
const flash = require("req-flash");
const User = require("./models/user");
const config = require("./config/config");
const passportStrategy = require("./config/passport");
const indexRoute = require("./routes/index");
const userRoute = require("./routes/user");
const channelRoute = require("./routes/channel");
const ajaxRoute = require("./routes/ajax");
const allRoute = require("./routes/all");
const mailRoute = require("./routes/mail");
const msgRoute = require("./routes/message");
const cors = require("cors");
const { constant } = require("lodash");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

// Configure IO
require("./io/index")(io);

// Configure app and mongoose
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.set("view engine", "ejs");
mongoose.Promise = global.Promise;

// boot if db is available
mongoose
  .connect(config.dbURL, {
    reconnectTries: 5,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    server.listen(config.port, () => {
      console.log("listenning on " + config.port);
    });
  })
  .catch((dbErr) => {
    console.log("DB Connection Error: ", dbErr.message);
    process.exit(1);
  });

// seedDB;

// Passport configuration
app.use(
  expressSession({
    secret: "XNJz52oSGKfpg32TKYzGo4NkgPKm4nGcLCbfdFk0",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// JWT Strategy
passport.use(
  new JWTstrategy(
    {
      secretOrKey: config.jwt_secret,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    },
    async (token, done) => {
      try {
        return done(null, token.user);
      } catch (error) {
        done(error);
      }
    }
  )
);
// Login Strategy
passport.use(
  "local-login",
  new LocalStrategy(
    {
      usernameField: "address",
      passwordField: "password",
      passReqToCallback: true,
    },
    passportStrategy.localSiginStrategy
  )
);

// Sign UP Strategy
passport.use(
  "local-signup",
  new LocalStrategy(
    {
      usernameField: "address",
      passwordField: "password",
      passReqToCallback: true,
    },
    passportStrategy.localSignupStrategy
  )
);

// used to serialize the user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

app.use(flash());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  next();
});

// Routes
app.use("/", indexRoute);
app.use("/all", allRoute);
app.use("/users", userRoute);
app.use("/channel", channelRoute);
app.use("/mail", mailRoute);
app.use("/message", msgRoute);
app.use(ajaxRoute);
