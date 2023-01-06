export enum PermissionLevel {
  // VIEW_ONLY users should have access to most routes that allow viewing data but not to routes that update resources
  VIEW_ONLY = 0,
  // USER_SUPPORT users should have access to all routes except routes where accessing or editing a resource poses a
  // high security risk - such as the potential to gain privilege escalation, steal funds, or obtain card numbers.
  USER_SUPPORT = 1,
  // ADMIN users should have access to all routes
  ADMIN = 2
}
