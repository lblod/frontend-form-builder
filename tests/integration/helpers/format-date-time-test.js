import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Helper | format-date-time', function (hooks) {
  setupRenderingTest(hooks);

  test('it returns a formatted date with time information', async function (assert) {
    this.date = new Date(2022, 9, 4, 16, 12);
    await render(hbs`{{format-date-time this.date}}`);

    assert.dom().hasText('4/10/2022 16:12');
  });

  test('it returns an empty string if the provided value is not a date', async function (assert) {
    await render(hbs`{{format-date-time this.date}}`);
    assert.dom().hasText('');

    this.set('date', null);
    assert.dom().hasText('');

    this.set('date', '');
    assert.dom().hasText('');

    this.set('date', new Date('invalid date string'));
    assert.dom().hasText('');
  });
});
