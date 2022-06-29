export enum TokenType {
  Card = 'CARD',
  DirectDebit = 'DIRECT_DEBIT'
}

export enum TokenSource {
  Api = 'API',
  Products = 'PRODUCTS'
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
  gateway_account_id: number;
}

export interface DeleteTokenRequest {
  gateway_account_id: number;
  token_link: string;
}

export interface ListTokenResponse {
  tokens: Token[]
}

export interface DeleteTokenResponse {
  /** Date the token was revoked in format DD MMM YYYY */
  revoked: string;
}