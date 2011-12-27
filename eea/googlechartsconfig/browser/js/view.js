var GoogleChartTableStyler = function(table, database){
  jQuery(table).addClass('listing');
};

var GoogleChartTableRowStyler = function(item, database, tr) {
  if (tr.rowIndex % 2) {
    jQuery(tr).addClass('odd');
  } else {
    jQuery(tr).addClass('even');
  }
};
