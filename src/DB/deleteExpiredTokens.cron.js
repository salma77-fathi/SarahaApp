import cron from "node-cron";
import {RevokeTokenModel} from "./models/revoke.token.model.js";
import * as DBservice from "./db.service.js";
import { successResponse } from "../utils/reponse.js";
cron.schedule("* * * * *", async () => {
  console.log("running cron job");
  const result = await DBservice.deleteMany({
    model: RevokeTokenModel,
    filter: {
      $and: [
        { expiresRefreshDate: { $lt:Math.floor(Date.now() / 1000) } },
        { expiresAccessTokenDate: { $lt: Math.floor(Date.now() / 1000) } },
      ],
    },
  });
   console.log(`Deleted ${result.deletedCount} expired tokens`);
});
