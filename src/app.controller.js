import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import * as dotenv from "dotenv";
import path from "node:path";
import "./DB/deleteExpiredTokens.cron.js";
dotenv.config({ path: path.join("./src/config/.env.dev") }); //to read the file
// dotenv.config({}); //to read the file
// console.log(process.env.DB_URI);
import express from "express";
import connectDB from "./DB/connection.db.js";
import authController from "./modules/auth/auth.controller.js";
import messageController from "./modules/message/message.controller.js";
import { globalErorrHandling } from "./utils/reponse.js";
import userController from "./modules/user/user.controller.js";
export const bootstrap = async () => {
  const app = express();
  const port = process.env.PORT || 5000;
  app.use(express.json());
  app.use(morgan("dev"));
  app.use(cors());
  app.use(helmet());
  const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, //for 1 hour
    limit: 20000, // limit each IP to 20000 requests per windowMs
    message: { error: "too many requests" },
    handler: (req, res, next, options) => {
      return res.status(options.statusCode).json(options.message);
    },
    // legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
  app.use(limiter);
  //   app.get("test", (req, res) => {
  //     return res.send(`<html lang="en">
  //   <head>
  //     <meta charset="UTF-8" />
  //     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  //     <title>Document</title>
  //   </head>
  //   <body>
  //     <script>
  //       alert = "congarats you have been hacked";
  //     </script>
  //   </body>
  // </html>`);
  //   });
  /******************************************************************************************************************************* */
  // this middleware is used when either frontend or backend are in private networks
  // this is use to access private network from public network
  // LOOK: this is not a good practice to use in production BC its not secure
  // const whitelist = process.env.ORIGINS.split(",");
  // app.use(async (req, res, next) => {
  //   console.log({OR:req.header('origin')});

  //         if (!whitelist.includes(req.header('origin'))) {
  //             return next(new Error('Not Allowed By CORS', { status: 403 }))
  //         }
  //         for (const origin of whitelist) {
  //             if (req.header('origin') == origin) {
  //                 await res.header('Access-Control-Allow-Origin', origin);
  //                 break;
  //             }
  //         }
  //         await res.header('Access-Control-Allow-Headers', '*')
  //         await res.header("Access-Control-Allow-Private-Network", 'true')
  //         await res.header('Access-Control-Allow-Methods', '*')
  //         console.log("Origin Work");
  //         next();
  //     });

  // here the cors is only can use when two of backend and frontend are private networks
  // var whitelist = process.env.ORIGINS.split(",");
  // var corsOptions = {
  //   origin: function (origin, callback) {
  //     if (whitelist.indexOf(origin) !== -1) {
  //       callback(null, true);
  //     } else {
  //       callback(new Error("Not allowed by CORS"));
  //     }
  //   },
  // };
  // app.use(cors(corsOptions));
  /******************************************************************************************************************************* */
  app.use("/uploads", express.static(path.resolve("./src/uploads"))); //to serve static files
  app.use(cookieParser());
  await connectDB();
  app.use("/auth", authController);
  app.use("/message", messageController);
  app.use("/user", userController);

  app.get("/", (req, res, next) => {
    res.json({ message: "hello from index file 😁" });
  });
  app.use(globalErorrHandling);
  app.listen(port, () => {
    console.log(`server is listenning on ${port}🚀`);
  });
};
