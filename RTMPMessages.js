const amfEncoder = require('amf2json');


function generateMessage(typeId, streamId, data) {
  return {
    typeId,
    length: data.length,
    timestamp: Date.now(),
    streamId,
    data,
  };
}

function generateSetChunkSize(size) {
  const chunkSize = Buffer.alloc(4);
  chunkSize.writeUIntBE(size, 0, 4);
  chunkSize[0] &= 0b01111111;
  return generateMessage(1, 0, chunkSize);
}

// Acknowledgment is mispelled but the spelling is from the RTMP 1.0 Specification
function generateAcknowledgement(size) {
  const sequenceNumber = Buffer.alloc(4);
  sequenceNumber.writeUIntBE(size, 0, 4);
  return generateMessage(3, 0, sequenceNumber);
}

function generateUserControlMessage(type, data) {
  const eventType = Buffer.alloc(2);
  eventType.writeUIntBE(type, 0, 2);

  return generateMessage(4, 0, Buffer.concat([eventType, data]));
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
  generateMessage, generateSetChunkSize, generateAcknowledgement, generateUserControlMessage, generateWindowAcknowledgementSize, generateSetPeerBandwidth,
};
