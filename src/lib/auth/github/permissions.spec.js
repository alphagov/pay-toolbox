const nock = require('nock')
const proxyquire = require('proxyquire')
const {expect} = require('chai')

const {PermissionLevel} = require("../types");

const username = 'a-user'
const token = 'a-token'
const authConfig = {
  AUTH_GITHUB_ADMIN_TEAM_ID: 101,
  AUTH_GITHUB_USER_SUPPORT_TEAM_ID: 102,
  AUTH_GITHUB_VIEW_ONLY_TEAM_ID: 103,
  GITHUB_API_ENDPOINT: 'http://localhost:8000/github',
  GITHUB_ALPHAGOV_ORGANISATION_ID: 201
}
const githubMock = nock(authConfig.GITHUB_API_ENDPOINT)

const permissions = proxyquire('./permissions', {
  '../../../config': {
    auth: authConfig
  }
})

describe('Permissions util', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should return ADMIN permission level when user is a member of the admin GitHub team', async () => {
    mockSuccessGetUserMembershipOfTeam(authConfig.AUTH_GITHUB_ADMIN_TEAM_ID)

    const result = await permissions.checkUserAccess(username, token);
    expect(result).to.deep.equal({permitted: true, permissionLevel: PermissionLevel.ADMIN})
  })

  it('should return ADMIN permission level when user is a member of multiple GitHub teams including the admin team', async () => {
    mockSuccessGetUserMembershipOfTeam(authConfig.AUTH_GITHUB_ADMIN_TEAM_ID)
    mockSuccessGetUserMembershipOfTeam(authConfig.AUTH_GITHUB_USER_SUPPORT_TEAM_ID)
    mockSuccessGetUserMembershipOfTeam(authConfig.AUTH_GITHUB_VIEW_ONLY_TEAM_ID)

    const result = await permissions.checkUserAccess(username, token);
    expect(result).to.deep.equal({permitted: true, permissionLevel: PermissionLevel.ADMIN})
  })

  it('should return USER_SUPPORT permission level when user is a member of the user support GitHub team', async () => {
    mockSuccessGetUserMembershipOfTeam(authConfig.AUTH_GITHUB_USER_SUPPORT_TEAM_ID)

    const result = await permissions.checkUserAccess(username, token);
    expect(result).to.deep.equal({permitted: true, permissionLevel: PermissionLevel.USER_SUPPORT})
  })

  it('should return VIEW_ONLY permission level when user is a member of the view-only GitHub team', async () => {
    mockSuccessGetUserMembershipOfTeam(authConfig.AUTH_GITHUB_VIEW_ONLY_TEAM_ID)

    const result = await permissions.checkUserAccess(username, token);
    expect(result).to.deep.equal({permitted: true, permissionLevel: PermissionLevel.VIEW_ONLY})
  })

  it('should return false when user is not a member of any permitted GitHub team', async () => {
    const result = await permissions.checkUserAccess(username, token);
    expect(result).to.deep.equal({permitted: false})
  })
})

function mockSuccessGetUserMembershipOfTeam(team) {
  githubMock.get(`/organizations/${authConfig.GITHUB_ALPHAGOV_ORGANISATION_ID}/team/${team}/memberships/${username}`)
    .reply(200)
}

