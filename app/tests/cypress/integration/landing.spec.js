describe('Landing health check page', () => {
  it('Renders successfully without any valid healthcheck responses', () => {
    cy.visit('/')

    cy.title().should('eq', 'Toolbox')
    cy.get('.status-disconnected').should('have.length', 5)
  })
})
