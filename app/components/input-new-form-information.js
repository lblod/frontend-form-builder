import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ToolbarComponent extends Component {
  @service store;
  @service router;
  @service toaster;

  @tracked showEditModal = false;
  @tracked formLabel = this.args.model.label;
  @tracked formComment = this.args.model.comment;

  @action
  handleLabelChange(event) {
    this.formLabel = event.target.value;
  }

  @action
  handleCommentChange(event) {
    this.formComment = event.target.value;
  }

  @action
  async updateForm() {
    const form = await this.store.findRecord(
      'generated-form',
      this.args.model.id
    );
    form.modified = new Date();
    form.ttlCode = this.args.code;
    form.label = this.formLabel;
    form.comment = this.formComment;

    try {
      await form.save();
      this.toaster.success('Formulier bijgewerkt', 'Success', {
        timeOut: 5000,
      });
      this.showEditModal = false;
      this.router.transitionTo('formbuilder.edit', this.args.model.id);

    } catch (err) {
      this.toaster.error('Oeps, er is iets mis gegaan', 'Error', {
        timeOut: 5000,
      });
      console.error(err);
    }
  }
}