import { User } from '../services/admin_users/types'
import { Product, ProductStat } from '../services/products/types'

export function redactOTP(user: User): User {
  delete user.otp_key
  return user
}

export function redactProductStatTokens(products: ProductStat[]): ProductStat[] {
  return products.map((productStat) => {
    delete productStat.product.pay_api_token
    return productStat
  })
}

export function redactProductTokens(products: Product[]): Product[] {
  return products.map((product) => {
    delete product.pay_api_token
    return product
  })
}