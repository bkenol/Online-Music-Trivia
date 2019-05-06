
jQuery = require('jQuery');

jQuery(function($){    
    'use strict';
    var data = $.getJSON('http://query.yahooapis.com/v1/public/yql?q=select%20%2a%20from%20yahoo.finance.quotes%20WHERE%20symbol%3D%27WRC%27&format=json&diagnostics=true&env=store://datatables.org/alltableswithkeys&callback', function(data) {
    //data is the JSON string
    console.log(data);
	});
}($));