import Component from '@glimmer/component';
import { restartableTask, timeout } from 'ember-concurrency';

export default class CodeEditModal extends Component {
  handleCodeChange = restartableTask(async (newCode) => {
    await timeout(500);
    this.args.onCodeChange?.(newCode);
  });
}
