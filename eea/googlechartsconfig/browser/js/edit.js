var GoogleChartEdit = {'version': '1.0'};

/** Events
*/
GoogleChartEdit.Events = {
  facet: {
    deleted: 'googlechart-facet-deleted',
    refreshed: 'googlechart-facets-refreshed'
  },
  views: {
    refreshed: 'googlechart-views-refreshed'
  }
};

/** Status
*/
GoogleChartEdit.Status = {
  initialize: function(){
    this.area = jQuery('.googlechart-settings');
    this.area.append(jQuery('<div>').addClass('googlechart-cleanup'));
    this.lock = jQuery('<div>').addClass('googlechart-status-lock');
    this.message = jQuery('<div>').addClass('googlechart-ajax-loader');
    this.lock.prepend(this.message);
    this.area.prepend(this.lock);

    this.lock.dialog({
      show: 'slow',
      hide: 'slow',
      modal: true,
      closeOnEscape: false,
      autoOpen: false,
      draggable: false,
      resize: false,
      dialogClass: 'googlechart-loading-overlay'
    });
  },

  start: function(msg){
    this.message.html(msg);
    this.lock.dialog('open');
  },

  stop: function(msg){
    this.message.html(msg);
    this.lock.dialog('close');
  }
};


/** Confirm dialog
*/
GoogleChartEdit.Confirm = {
  initialize: function(){
    var self = this;
    self.event = null;
    self.kwargs = {};

    self.area = jQuery('<div>').addClass('googlechart-confirm');
    jQuery('googlechart-views-edit').after(self.area);
    self.area.dialog({
      bgiframe: true,
      autoOpen: false,
      modal: true,
      dialogClass: 'googlechart-confirm-overlay',
      buttons:  {
        Yes: function(){
          if(self.event !== null){
            jQuery(document).trigger(self.event, self.kwargs);
          }
          jQuery(this).dialog('close');
        },
        No: function(){
          jQuery(this).dialog('close');
        }
      }
    });
  },

  confirm: function(msg, event, kwargs){
    var self = this;
    self.area.html(msg);
    self.event = event;
    self.kwargs = kwargs;
    self.area.dialog('open');
  }
};


/** Facets
*/
GoogleChartEdit.Facets = {
  initialize: function(){
    var self = this;
    self.facets = {};
    self.area = jQuery('.googlechart-facets-edit').addClass('googlechart-facets-edit-ajax');

    // Events
    jQuery(document).bind(GoogleChartEdit.Events.facet.deleted, function(evt, data){
      self.handle_delete(data);
    });

    jQuery(document).bind(GoogleChartEdit.Events.facet.refreshed, function(evt, data){
      self.handle_refresh(data);
    });

    jQuery(document).trigger(GoogleChartEdit.Events.facet.refreshed, {init: true});
  },

  handle_refresh: function(data){
    var self = this;
    if(data.init){
      self.setup();
    }else{
      var action = data.action;
      var i = action.indexOf('@@');
      action = action.slice(0, i) + '@@googlechart-edit.facets.html';
      GoogleChartEdit.Status.start('Refreshing ...');
      jQuery.get(action, {}, function(data){
        self.area.html(data);
        self.setup();
        GoogleChartEdit.Status.stop("Done");
      });
    }
  },

  setup: function(){
    var self = this;
    // Add box
    jQuery('.googlechart-facet-add', self.area).each(function(){
      var facet = jQuery(this);
      var add = new GoogleChartEdit.FacetAdd(facet);
    });

    // Facets
    jQuery('.googlechart-facet-edit', self.area).each(function(){
      var facet = jQuery(this);
      self.facets[facet.attr('id')] = new GoogleChartEdit.Facet(facet);
    });

    // Sortable
    jQuery('.googlechart-facets-edit-ajax').sortable({
      items: '.googlechart-facet-edit',
      placeholder: 'ui-state-highlight',
      forcePlaceholderSize: true,
      opacity: 0.7,
      delay: 300,
      cursor: 'crosshair',
      tolerance: 'pointer',
      update: function(event, ui){
        self.sort(ui.item.parent());
      }
    });
  },

  sort: function(context){
    facets = jQuery('.facet-title', context);
    var order = jQuery.map(facets, function(value){
      return jQuery(value).text();
    });

    var action = jQuery('form', context).attr('action');
    var index = action.indexOf('@@');
    action = action.slice(0, index) + '@@googlechart-edit.save';

    query = {'googlechart.facets.save': 'ajax', order: order};
    GoogleChartEdit.Status.start('Saving ...');
    jQuery.ajax({
      traditional: true,
      type: 'post',
      url: action,
      data: query,
      success: function(data){
       GoogleChartEdit.Status.stop(data);
      }
    });
  },

  handle_delete: function(kwargs){
    var self = this;
    var facet = kwargs.facet;
    var name = facet.attr('id');

    var action = jQuery('form', facet).attr('action');
    var i = action.indexOf('@@');
    action = action.slice(0, i) + '@@googlechart-edit.save';
    var query = {'googlechart.facet.delete': 'ajax', name: name};

    facet.slideUp(function(){
      GoogleChartEdit.Status.start('Saving ...');
      jQuery.ajax({
        traditional: true,
        type: 'post',
        url: action,
        data: query,
        success:  function(data){
          GoogleChartEdit.Status.stop(data);

          jQuery(document).trigger(GoogleChartEdit.Events.views.refreshed, {
            init: false,
            action: jQuery('form', facet).attr('action')
          });

          facet.remove();
          delete self.facets[name];
        }
      });
    });
  }
};

/** Add facets box
*/
GoogleChartEdit.FacetAdd = function(facet){
  this.initialize(facet);
};

GoogleChartEdit.FacetAdd.prototype = {
  initialize: function(facet){
    var self = this;
    self.facet = facet;
    self.form = jQuery('form', facet);
    self.action = self.form.attr('action');
    self.button = jQuery('input[type="submit"]', this.form).hide();

    self.form.submit(function(){
      return false;
    });

    self.form.dialog({
      bgiframe: true,
      autoOpen: false,
      modal: true,
      dialogClass: 'googlechart-facet-add-overlay',
      buttons:  {
        Add: function(){
          self.submit();
          jQuery(this).dialog('close');
        },
        Cancel: function(){
          jQuery(this).dialog('close');
        }
      }
    });

   var plus = jQuery("<span>")
      .attr('title', 'Add new facet')
      .text('+')
      .addClass('ui-icon').addClass('ui-icon-plus').addClass('ui-corner-all');

    self.facet.prepend(plus);

    plus.click(function(){
      self.form.dialog('open');
    });
  },

  submit: function(){
    var self = this;
    var name = self.button.attr('name');
    var query = name + '=ajax&';
    query += self.form.serialize();

    GoogleChartEdit.Status.start('Adding ...');
    jQuery.ajax({
      traditional: true,
      type: 'post',
      url: self.action,
      data: query,
      success: function(data){
        jQuery(document).trigger(GoogleChartEdit.Events.facet.refreshed, {
          init: false, action: self.action});
        GoogleChartEdit.Status.stop(data);
      }
    });
  }
};


/** Facet
*/
GoogleChartEdit.Facet = function(facet){
  this.initialize(facet);
};

GoogleChartEdit.Facet.prototype = {
  initialize: function(facet){
    var self = this;
    this.facet = facet;
    this.form = jQuery('form', facet);
    this.action = this.form.attr('action');
    this.button = jQuery('input[type="submit"]', this.form);
    this.button.hide();

    var show = jQuery('div.field:has([id$=".show"])', this.form).hide();
    this.show = jQuery('[id$=".show"]', show);
    this.visible = this.show.attr('checked');

    var title = jQuery('h1', this.form);
    title.attr('title', 'Click and drag to change widget position');

    var html = title.html();
    var newhtml = jQuery('<div>').addClass('facet-title').html(html);
    title.html(newhtml);

    this.hide_icon(title);
    this.delete_icon(title);

    this.form.submit(function(){
      return false;
    });

    jQuery(':input', this.form).change(function(){
      self.submit();
      return false;
    });
  },

  hide_icon: function(title){
    var self = this;

    var msg = 'Hide facet';
    var css = 'ui-icon-hide';
    if(!self.visible){
      msg = 'Show facet';
      css = 'ui-icon-show';
      title.addClass('hidden');
    }
    var icon = jQuery('<div>')
      .html('h')
      .attr('title', msg)
      .addClass('ui-icon')
      .addClass(css);

    icon.click(function(){
      if(self.visible){
        self.visible = false;
        icon.removeClass('ui-icon-hide')
          .addClass('ui-icon-show')
          .attr('title', 'Show facet');
          title.addClass('hidden');
      }else{
        self.visible = true;
        icon.removeClass('ui-icon-show')
          .addClass('ui-icon-hide')
          .attr('title', 'Hide facet');
          title.removeClass('hidden');
      }
      self.show.click();
      self.submit();
    });
    title.prepend(icon);
  },

  delete_icon: function(title){
    var self = this;
    var icon = jQuery('<div>')
      .html('x')
      .attr('title', 'Delete facet')
      .addClass('ui-icon')
      .addClass('ui-icon-trash');

    icon.click(function(){
      var msg = "Are you sure you want to delete facet: <strong>" + self.facet.attr('id') + "</strong>. ";
      msg += "You should consider hiding it, instead of deleting it, otherwise ";
      msg += "you'll have to manually update Views properties if this facet id is used by any of them.";
      GoogleChartEdit.Confirm.confirm(msg, GoogleChartEdit.Events.facet.deleted, {facet: self.facet});
    });

    title.prepend(icon);
  },

  submit: function(){
    var self = this;
    var name = this.button.attr('name');
    var query = name + '=ajax&';
    query += this.form.serialize();

    GoogleChartEdit.Status.start('Saving ...');
    jQuery.ajax({
      traditional: true,
      type: 'post',
      url: self.action,
      data: query,
      success: function(data){
        GoogleChartEdit.Status.stop(data);
      }
    });
  }
};

/** Views
*/
GoogleChartEdit.Views = {
  initialize: function(){
    var self = this;

    jQuery(document).bind(GoogleChartEdit.Events.views.refreshed, function(evt, data){
      self.update_views(data);
    });
    jQuery(document).trigger(GoogleChartEdit.Events.views.refreshed, {init: true});
  },

  update_views: function(form){
    var self = this;
    self.views = {};
    self.area = jQuery('.googlechart-views-edit').addClass('googlechart-views-edit-ajax');

    if(!form.init){
      var action = form.action;
      var i = action.indexOf('@@');
      action = action.slice(0, i) + '@@googlechart-edit.views.html';
      GoogleChartEdit.Status.start('Refreshing ...');
      jQuery.get(action, {}, function(data){
        self.area.html(data);
        self.update_tabs();
        GoogleChartEdit.Status.stop("Done");
      });
    }else{
      self.update_tabs();
    }
  },

  update_tabs: function(){
    var self = this;
    jQuery('.googlechart-view-edit', this.area).each(function(){
      var view = jQuery(this);
      self.views[view.attr('id')] = new GoogleChartEdit.View(view);
    });
    jQuery('fieldset', this.area).addClass('googlechart-edit-fieldset');
    jQuery('form h1', this.area).hide();
    jQuery('ul', this.area).tabs('div.panes > div');
  }
};

/** View settings
*/
GoogleChartEdit.View = function(view){
  this.initialize(view);
};

GoogleChartEdit.View.prototype = {
  initialize: function(view){
    var self = this;
    self.view = view;
    self.form = jQuery('form', self.view);
    self.table = jQuery('div.field:has(label[for="googlechart.properties.sources"]) table', self.form);
    if(self.table.length){
      self.table.addClass('googlechart-sources-table');
      var table = new GoogleChartEdit.SourceTable(self.table);
    }

    self.form.submit(function(){
      self.submit();
      return false;
    });

    self.style();
  },

  style: function(){
    // Add links to URLs
    var self = this;
    var help = jQuery('.formHelp', this.view);
    help.each(function(){
      var here = jQuery(this);
      var text = self.replaceURL(here.text());
      here.html(text);
    });
  },

  replaceURL: function(inputText) {
    var replacePattern = /(\b(https?|ftp):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/gim;
    return inputText.replace(replacePattern, '<a href="$1" target="_blank">here</a>');
  },

  submit: function(){
    var self = this;
    var action = self.form.attr('action');
    var query = {};
    var array = self.form.serializeArray();

    jQuery.each(array, function(){
      if(query[this.name]){
        query[this.name].push(this.value);
      }else{
        query[this.name] = [this.value];
      }
    });

    var button = jQuery('.actionButtons input[type="submit"]', self.form);
    var name = button.attr('name');
    query[name] = 'ajax';

    GoogleChartEdit.Status.start('Saving ...');
    jQuery.ajax({
      traditional: true,
      type: 'post',
      url: action,
      data: query,
      success: function(data){
        button.removeClass('submitting');
        GoogleChartEdit.Status.stop(data);
        if(name === 'googlechart.properties.actions.save'){
          jQuery(document).trigger(GoogleChartEdit.Events.views.refreshed, {
            init: false,
            action: action
          });
        }
      }
    });
  }
};

GoogleChartEdit.SourceTable = function(table){
  this.initialize(table);
};

GoogleChartEdit.SourceTable.prototype = {
  initialize: function(table){
    var self = this;
    self.table = table;
    self.count = jQuery('input[name="googlechart.properties.sources.count"]', table.parent());

    self.button_add = jQuery('input[name="googlechart.properties.sources.add"]', table);
    self.button_add.click(function(){
      self.add(jQuery(this));
      return false;
    });

    self.button_remove = jQuery('input[name="googlechart.properties.sources.remove"]', table);
    if (!self.button_remove.length){
      self.button_remove = jQuery('<input>').attr('type', 'submit')
        .attr('name', 'googlechart.properties.sources.remove')
        .val("Remove selected items");
      self.button_add.parent('td').prepend(self.button_remove);
    }

    self.button_remove.click(function(){
      self.remove(jQuery(this));
      return false;
    });

  },

  add: function(button){
    var self = this;
    button.removeClass('submitting');
    var count = parseInt(self.count.val(), 10);

    var check = jQuery('<input />').attr('type', 'checkbox')
      .addClass('editcheck')
      .attr('name', 'googlechart.properties.sources.remove_' + count);
    var text = jQuery('<input />').attr('type', 'text').attr("value", "")
      .addClass('textType')
      .attr('name', 'googlechart.properties.sources.' + count + '.');

    var td = jQuery('<td>').append(check).append(text);
    var row = jQuery('<tr>').append(td);

    self.table.prepend(row);

    count += 1;
    self.count.val(count);
  },

  remove: function(button){
    var self = this;
    button.removeClass('submitting');

    var checked = jQuery('input[type="checkbox"]:checked', self.table);
    checked.each(function(){
      jQuery(this).parent().parent('tr').remove();
    });

    var count = parseInt(self.count.val(), 10);
    count -= checked.length;
    self.count.val(count);
  }
};


jQuery(document).ready(function(){
  GoogleChartEdit.Status.initialize();
  GoogleChartEdit.Confirm.initialize();
  GoogleChartEdit.Facets.initialize();
  GoogleChartEdit.Views.initialize();
});
