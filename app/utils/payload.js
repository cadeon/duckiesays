var debug = require('debug')('payload');

 var COMPANY_ELEMENTS = [ 'id', 'order_sys_id', 'base_slug', 'default_cat', 'daily_special_cat_id', 'delivery_chg_cat_id', 
  'delivery_chg_item_id', 'stub', 'created_at', 'updated_at' ]
 
 var ORDER_HIST_ELEMENTS = [ 'id', 'order_sys_order_id', 'amount', 'initiation_time', 'order_detail', 'checkin_id', 
  'customer_name', 'customer_id', 'unit_id', 'company_id', 'created_at']
 

 exports.testFn = function *(next) {
  console.log('testFn')
  debug('..tested')
};

 exports.limitCompanyPayloadForPut = function *(object) {
     // modifies object passed in
     debug('limitCompanyPayloadForPut')
     debug(COMPANY_ELEMENTS)
     debug(object)
     try {
         yield limitPayload(object, COMPANY_ELEMENTS);
     } catch (err) {
         console.error(err);
         throw(err);
     }
 }

 exports.limitOrderHistPayloadForPut = function *(object) {
     // modifies object passed in
     debug('limitOrderHistPayloadForPut')
     debug(ORDER_HIST_ELEMENTS)
     debug(object)
     try {
         yield limitPayload(object, ORDER_HIST_ELEMENTS);
     } catch (err) {
         console.error(err);
         throw(err);
     }
 }

 function * limitPayload(object, payloadElements) {
     var len = payloadElements.length
     for (var i=0; i<len; i++) {
         debug('...attribute '+ payloadElements[i])
        if (object.hasOwnProperty(payloadElements[i])) {
            debug('..before: '+ object[payloadElements[i]])
            delete object[payloadElements[i]]
            debug('..after: '+ object[payloadElements[i]])
        }
     }
 }
