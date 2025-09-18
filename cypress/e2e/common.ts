const startup_timeout = 4000;

const check_worker = () => {
  cy.get('p.splash-below', { timeout: startup_timeout })
    .should('contain.text', 'Coq worker is ready');
};

const check_packages = () => {
  cy.get('p.system', { timeout: startup_timeout })
    .should('contain.text', 'Loaded packages [init, coq-base, coq-collections, coq-arith]');
}

const check_goals = () => {

    cy.get('.CodeMirror', { timeout: 5000 } )
      .first()
      .then((editor) => {
        editor[0].CodeMirror.setCursor({ line: 19, ch: 4 });
      });

    cy.get('iframe#info-view')
      .its('0.contentDocument.body')
      .should('not.be.empty')          // ensure iframe loaded
      .then(cy.wrap)
      .find('div.info-panel details div p', { timeout: 10000 })
    .should('contain.text', 'No goals at this point!');
}

export function check_startup(backend : string) {
  it('javascript backend successfully loads', () => {
    cy.visit(`/?backend=${backend}`);

    check_worker();
    check_packages();
    check_goals();

  });
}

/*
For iframe goals testing

  cy.get('iframe#info-view')
      .its('0.contentDocument.body')
      .should('not.be.empty')          // ensure iframe loaded
      .then(cy.wrap)
      .find('div.info-panel details div p', { timeout: 10000 }) // retry up to 5s
      .should('contain.text', 'No goals at this point!')
  });
*/
