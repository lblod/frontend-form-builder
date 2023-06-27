import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking'; 

export default class ToolbarComponent extends Component {
  @service store;
  @service router;
  @service toaster;

  @tracked popup = false;
  @tracked formLabel = this.args.model.label;
  @tracked formComment = this.args.model.comment;

  @action
  saveLocally() {
    // Create a link
    let downloadLink = document.createElement('a');
    downloadLink.download = this.formLabel;

    // generate Blob where file content will exists
    let blob = new Blob([this.args.code], { type: 'text/plain' });
    downloadLink.href = window.URL.createObjectURL(blob);

    // Click file to download then destroy link
    downloadLink.click();
    downloadLink.remove();
    this.popup = false;
  }

  @action
  async deleteForm() {
    const generatedForm = this.args.model;
    const isDeleted = await generatedForm.destroyRecord();
    if (isDeleted) {
      this.router.transitionTo('index');
    }
  }

  @action
  async updateForm() {
    
    const now = new Date();
    const FormattedDateTime = `${now.getDate()}/${now.getMonth()}/${now.getFullYear()}, ${now.toLocaleTimeString()}`;
    const form = await this.store.findRecord(
      'generated-form',
      this.args.model.id
    );
    form.modified = FormattedDateTime;
    form.ttlCode = this.args.code;
    form.label = this.formLabel;
    form.comment = this.formComment;

    try {
      await form.save();
      this.toaster.success('Formulier bijgewerkt','Success', { timeOut: 5000 })
      this.popup = false;
    } catch (err) {
      this.toaster.error('Oeps, er is iets mis gegaan','Error', { timeOut: 5000 });
      console.error(err)
    }
  }
}
