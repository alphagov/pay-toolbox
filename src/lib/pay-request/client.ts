import _Connector from './services/connector/client'
import _AdminUsers from './services/admin_users/client'
import _Ledger from './services/ledger/client'
import _Products from './services/products/client'
import _PublicAuth from './services/public_auth/client'
import { PayHooks } from './base'
import {BroadcastResult} from "./shared";

const clients: {
  Connector: _Connector;
  Ledger: _Ledger;
  Products: _Products;
  PublicAuth: _PublicAuth;
  AdminUsers: _AdminUsers;
} = {
  Connector: new _Connector(),
  Ledger: new _Ledger(),
  Products: new _Products(),
  PublicAuth: new _PublicAuth(),
  AdminUsers: new _AdminUsers()
}

export const Connector = clients.Connector
export const Ledger = clients.Ledger
export const Products = clients.Products
export const PublicAuth = clients.PublicAuth
export const AdminUsers = clients.AdminUsers

export function config(env: NodeJS.ProcessEnv = {}, options: PayHooks = {}): void {
  const connectorUrl = env.CONNECTOR_URL
  const adminUsersUrl = env.ADMINUSERS_URL
  const ledgerUrl = env.LEDGER_URL
  const productsUrl = env.PRODUCTS_URL
  const publicAuthUrl = env.PUBLIC_AUTH_URL

  if (connectorUrl)
    clients.Connector._configure(connectorUrl, options)
  if (adminUsersUrl)
    clients.AdminUsers._configure(adminUsersUrl, options)
  if (ledgerUrl)
    clients.Ledger._configure(ledgerUrl, options)
  if (productsUrl)
    clients.Products._configure(productsUrl, options)
  if (publicAuthUrl)
    clients.PublicAuth._configure(publicAuthUrl, options)
}

// make a GET request to all supported clients - for now suppress throwing the
// error upwards as the calling code probably wants all results
export async function broadcast(path: string): Promise<BroadcastResult[]> {
  return Promise.all(Object.values(clients).map(async (client) => {
    try {
      const result = await client._axios.get(path)
      return { app: client._app, success: true, result }
    } catch (error) {
      return { app: client._app, success: false, result: error }
    }
  }))
}
