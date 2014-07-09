import SearchIndex from 'appkit/utils/search-index';

export default function validateControls (contentType, item) {

  Ember.Logger.log('Validating controls.');

  var controls = contentType.get('controls');

  controls.setEach('widgetIsValid', true);

  var regex = {
    email: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    url: /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/
  };

  var invalidate = function (control, message) {
    Ember.Logger.warn('VadlidateControls::invalide', control.get('name'));
    control.set('widgetIsValid', false);
    control.get('widgetErrors').pushObject(message);
  };

  var nameControl;

  controls.forEach(function (control) {

    Ember.Logger.log('Validating `' + control.get('name') + '`');

    var value = control.get('value'),
        options = control.get('meta.data') || {};

    control.set('widgetErrors', Ember.A([]));

    if (!value) {
      if (control.get('required')) {
        invalidate(control, 'This field is required');
      }
      return;
    }

    if (control.get('name') === 'name') {
      nameControl = control;
    }

    switch (control.get('controlType.widget')) {
    case 'textfield':
    case 'textarea':
      if (options.min && value.length < options.min) {
        invalidate(control, 'This field has a minimum length of ' + options.min + '.');
      }
      if (options.max && value.length > options.max) {
        invalidate(control, 'This field has a maximum length of ' + options.max + '.');
      }
      break;
    case 'number':
      if (!Ember.$.isNumeric(value)) {
        invalidate(control, 'This field must be a number.');
      }
      if (options.min && parseInt(value, 10) < options.min) {
        invalidate(control, 'This field has a minimum value of ' + options.min + '.');
      }
      if (options.max && parseInt(value, 10) > options.max) {
        invalidate(control, 'This field has a maximum value of ' + options.max + '.');
      }
      break;
    case 'email':
      if (!regex.email.test(value)) {
        invalidate(control, 'This field must be an email address.');
      }
      break;
    case 'url':
      if (!regex.url.test(value)) {
        invalidate(control, 'This field must be a URL.');
      }
      break;
    case 'datetime':
      if (!moment(value).isValid()) {
        invalidate(control, 'This field must be a valid date and time.');
      }
      break;
    }

  });


  return new Ember.RSVP.Promise(function (resolve, reject) {

    var itemName = nameControl.get('value');

    SearchIndex.search(itemName, 1, contentType.get('name')).then(function (results) {
      results.forEach(function (result) {
        if (item && item.get('id') !== result.id && itemName === Ember.$(result.name).text()) {
          invalidate(nameControl, 'Name must be unique among ' + contentType.get('name') + ' entries.');
        }
      });
      resolve();
    }, function (error) {
      reject(error);
    });

  });

}
