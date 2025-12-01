import { init, id } from "@instantdb/react";

const appId = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID;

if (!appId) {
  throw new Error(
    "Missing NEXT_PUBLIC_INSTANTDB_APP_ID. Did you forget to add it to your env file?"
  );
}

const db = init({
  appId,
});

export const { useAuth, useQuery, tx, transact } = db;
export { id };

export default db;
