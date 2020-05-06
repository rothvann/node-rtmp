const amfEncoder = require('amf2json');


function generateMessage(typeId, streamId, payload) {
  return {
    typeId,
    length: payload.length,
    timestamp: Date.now(),
    streamId,
  };
}

function generateSetChunkSize(size) {
  const chunkSize = Buffer.alloc(4);
  chunkSize.writeUIntBE(size, 0, 4);
  chunkSize[0] &= 0b01111111;
  return generateMessage(1, 0, chunkSize);
}

function generateAcknowlegement(size) {
  const sequenceNumber = Buffer.alloc(4);
  sequenceNumber.writeUIntBE(size, 0, 4);
  return generateMessage(3, 0, sequenceNumber);
}

function generateWindowAcknowledgementSize(size) {
  const windowSize = Buffer.alloc(4);
  windowSize.writeUIntBE(size, 0, 4);
  return generateMessage(5, 0, windowSize);
}

function generateSetPeerBandwidth(size, limitType) {
  const windowSize = Buffer.alloc(5);
  windowSize.writeUIntBE(size, 0, 4);
  windowSize.writeUIntBE(limitType, 4, 1);
  return generateMessage(6, 0, windowSize);
}


module.exports = {
  generateMessage, generateSetChunkSize, generateAcknowlegement, generateWindowAcknowledgementSize, generateSetPeerBandwidth,
};
