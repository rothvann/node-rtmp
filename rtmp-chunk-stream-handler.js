const EventEmitter = require('events');

//Collects chunks from each stream and emits a message to the event handler

class RmtpChunkStreamHandler {
    
    constructor() {
        super();
        
        this.prev_timestamp;
        this.prev_timestamp_delta;
        this.prev_length;
        this.prev_type_id;
        this.prev_stream_id;
        this.prev_have_extended = false;
        
        this.parseMessageHeader = this.parseMessageHeader.bind(this);
        this.parseChunk = this.parseChunk.bind(this);
        this.parseProtocolControlMessage = this.parseProtocolControlMessage.bind(this);
        
        this.max_chunk_size = 128;
    }
    

    static function parseBasicHeader(chunk) {
        let basic_header = chunk.read(1).readUIntBE(0, 1);
        let basic_header_size = 1;
        //First two bits
        let fmt = basic_header >> 6;
        //Last 6 bits
        let cs_id = basic_header & 0x3F;
        
        if(cs_id === 0) {
           //second byte + 64
           cs_id = chunk.readUIntBE(1, 1) + 64;
           basic_header_size = 2;
        }
        if(cs_id === 1) {
           //(third byte * 256) + (second byte + 64)
           cs_id = chunk.readUIntBE(1, 2);
           basic_header_size = 3;
        }
        
        return {
            fmt: fmt,
            cs_id: cs_id
        };
    }
    
    function parseMessageHeader(fmt, chunk) {
        let chunk_data;
        switch(fmt) {
            case 0:
                let timestamp = chunk.readUIntBE(0, 3);
                //if equals to 0xFFFFFF
                if(timestamp >= 16777215) {
                    //get extended
                    timestamp = chunk.readUIntBE(11, 4);
                    this.prev_have_extended = true;
                } else {
                    this.prev_have_extended = false;                    
                }
                
                let length = chunk.readUIntBE(3, 3);
                let type_id = chunk.readUIntBE(6, 1);
                let stream_id = chunk.readUIntLE(7, 4);
                
                this.prev_timestamp = timestamp;
                this.prev_timestamp_delta = 0;
                this.prev_length = length;
                this.prev_type_id = type_id;
                this.prev_stream_id = stream_id;
                break;
            case 1:
                let timestamp_delta = chunk.readUIntBE(0, 3);
                
                if(timestamp_delta >= 16777215) {
                    timestamp_delta = chunk.readUIntBE(7, 4);
                    this.prev_have_extended = true;
                } else {
                    this.prev_have_extended = false;                    
                }
                
                let length = chunk.readUIntBE(3, 3);
                let type_id = chunk.readUIntBE(6, 1);
                
                this.prev_timestamp_delta = timestamp_delta;
                this.prev_length = length;
                this.prev_type_id = type_id;
                break;
            case 2:
                let timestamp_delta = chunk.readUIntBE(0, 3);
                
                if(timestamp_delta >= 16777215) {
                    timestamp_delta = chunk.readUIntBE(3, 4);
                    this.prev_have_extended = true;
                } else {
                    this.prev_have_extended = false;                    
                }
                
                this.prev_timestamp_delta = timestamp_delta;
                break;
            case 3:
                if(this.prev_have_extended) {
                    let timestamp_delta = chunk.readUIntBE(0, 4);
                    this.prev_timestamp_delta = timestamp_delta;
                } else {
                    if(this.prev_timestamp_delta == 0) {
                        
                    }
                }
                break;
        }
        
        
        return { 
            timestamp: this.prev_timestamp,
            timestamp_delta: this.prev_timestamp_delta,
            length: this.prev_length,
            type_id: this.prev_type_id,
            stream_id: this.prev_stream_id
            chunk_data: chunk_data
        };  
    }

    function parseChunk(basicHeader, chunk) {
        
        let message = this.parseMessageHeader(basicHeader['fmt'], chunk);
        
        
        if(basic_header['cs_id'] == 2 && message['stream_id'] == 0) {
            
        }
        
        return message;
}
    
    function parseProtocolControlMessage(message) {
        
        //protocol control message
            /*
            1. Set Chunk Size
            2. Discard chunk stream ids  (4 bits)
            3. Acknowledgement 
            5. Window Acknowledgement Size
            6. Set Peer Bandwidth            
            */
    }
  
}

module.exports = {RtmpChunkStreamHandler};