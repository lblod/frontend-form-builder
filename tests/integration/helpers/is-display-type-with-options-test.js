import { module, test } from 'qunit';
import { setupRenderingTest } from 'frontend-form-builder/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Helper | is-display-type-with-options', function (hooks) {
  setupRenderingTest(hooks);

  // TODO: Replace this with your real tests.
  test('it renders', async function (assert) {
    this.set('inputValue', '1234');

    await render(hbs`{{is-display-type-with-options this.inputValue}}`);

    assert.dom(this.element).hasText('1234');
  });
});
