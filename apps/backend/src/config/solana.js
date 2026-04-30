import { Connection } from "@solana/web3.js";
import { config } from "./env.js";

let _connection = null;

export function getConnection() {
  if (!_connection) {
    _connection = new Connection(config.solanaRpcUrl, "confirmed");
  }
  return _connection;
}
