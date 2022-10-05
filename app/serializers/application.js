/* eslint-disable ember/no-mixins */
import JSONAPISerializer from '@ember-data/serializer/json-api';
import DataTableSerializerMixin from 'ember-data-table/mixins/serializer';

export default class ApplicationSerializer extends JSONAPISerializer.extend(
  DataTableSerializerMixin
) {
  serializeAttribute(snapshot, json, key, attributes) {
    // mu-cl-resources considers `uri` a read-only attribute so it throws an error if it's included in the payload
    if (key !== 'uri')
      super.serializeAttribute(snapshot, json, key, attributes);
  }
}
