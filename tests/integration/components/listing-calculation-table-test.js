import { module, test } from 'qunit';
import { setupRenderingTest } from 'frontend-form-builder/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | listing-calculation-table', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<ListingCalculationTable />`);

    assert.dom(this.element).hasText('');

    // Template block usage:
    await render(hbs`
      <ListingCalculationTable>
        template block text
      </ListingCalculationTable>
    `);

    assert.dom(this.element).hasText('template block text');
  });
});
