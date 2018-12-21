/**
 * Authentication middleware allowing developers to put all private content
 * behind Google/ GitHub (TBD) authenticated sessions. Provides helper methods
 * for requesting authentication
 *
 * - note the current architecture design thoughts here are to put a
 *   bitly/oauth proxy. This way headers are checked for valid signatures,
 *   potentially groups and read/ write permissions. All requests that are
 *   outside of that will be rejected and anything with this valid signature
 *   will be served (no resources in this case will be public)
 */
