import { AccountType } from "../../shared";

export enum TokenType {
  Card = 'CARD',
  DirectDebit = 'DIRECT_DEBIT'
}

export enum TokenSource {
  Api = 'API',
  Products = 'PRODUCTS'
}

export enum TokenState {
  Active = 'ACTIVE',
  Revoked = 'REVOKED'
}

export interface Token {
  token_link: string;
  token_type: TokenType;
  type: TokenSource;
  issued_date: string;
  created_by: string;
  last_used: string;
  description?: string;
}

export interface ListTokenRequest {
  gateway_account_id: string;
  token_state?: TokenState
}

export interface DeleteTokenRequest {
  gateway_account_id: string;
  token_link: string;
}

export interface CreateTokenRequest {
  account_id: string;
  description: string;
  created_by: string;
  token_type: TokenType;
  type: TokenSource;
  token_account_type: AccountType;
}

export interface ListTokenResponse {
  tokens: Token[]
}

export interface DeleteTokenResponse {
  /** Date the token was revoked in format DD MMM YYYY */
  revoked: string;
}

export interface CreateTokenResponse {
  token: string;
}