import Service, { service } from '@ember/service';
import { getConceptSchemesWithConceptsStatements } from '../utils/get-statements-for-concept-scheme-with-concepts';
import { getTurtleTextForStatements } from '../utils/viewmodels/statements-to-turtle-text';

export default class CodelistsService extends Service {
  @service store;
  statements = [];
  turtleText = null;

  async getLatest() {
    this.statements = await getConceptSchemesWithConceptsStatements(this.store);
    this.turtleText = await getTurtleTextForStatements(this.statements);
    console.log(`Laatste codelijsten opgehaald`);
  }

  async findTurtleText() {
    return this.turtleText;
  }
}
