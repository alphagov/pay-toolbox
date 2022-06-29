import _Connector from './services/connector/client'
import _AdminUsers from './services/admin_users/client'
import _Ledger from './services/ledger/client'
import _Products from './services/products/client'
import _PublicAuth from './services/public_auth/client'
import { PayHooks } from './base'

const clients: {
  Connector: _Connector;
  Ledger: _Ledger;
  Products: _Products;
  PublicAuth: _PublicAuth;
  AdminUsers: _AdminUsers;
} = {
  Connector: new _Connector(process.env.CONNECTOR_URL || '', {}),
  Ledger: new _Ledger(process.env.LEDGER_URL || '', {}),
  Products: new _Products(process.env.PRODUCTS_URL || '', {}),
  PublicAuth: new _PublicAuth(process.env.PUBLICAUTH_URL || '', {}),
  AdminUsers: new _AdminUsers(process.env.ADMINUSERS_URL || '', {})
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
  const publicAuthUrl = env.PUBLICAUTH_URL

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