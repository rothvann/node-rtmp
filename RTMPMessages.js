const amf2json = require('amf2json');

const amfEncoder = new amf2json();
/*
String _result
Number 1
Object
  fmsVer 'FMS/3,5,7,7009'
  capabilities 31.0
  mode 1
Object
  level 'status'
  code 'NetConnection.Connect.Success'
  description: 'Connection accepted'
  data Object
    string '3,5,7,7009'
  objectEncoding 0
*/
function CONNECT_SUCCESS() {
  return amfEncoder.encodeAMF0(['_result', 1, {
    fmsVer: 'FMS/3,5,7,7009',
    capabilities: 31.0,
    mode: 1,
  },
  {
    level: 'status',
    code: 'NetConnection.Connect.Success',
    description: 'Connection accepted',
    data: { string: '3,5,7,7009' },
    objectEncoding: 0,
  }]);
}

function ACKNOWLEDGE(size) {

}

module.exports = { ACKNOWLEDGE, CONNECT_SUCCESS };
