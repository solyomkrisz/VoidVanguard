import Table from "../Table.js";
import Column from "../Column.js";
import * as CustomError from "../../common/CustomError.js";
import { execute } from "../database.js";

class Challenges extends Table {
  constructor() {
    super({
      columns: [
        new Column("blocker_id"),
        new Column("blocked_id"),
        new Column("created_at"),
      ],
    });
  }
}

export default new Challenges();
