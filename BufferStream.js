
class BufferStream {
    
    constructor() {
        this.buf;
    }
    
    set(buf) {
        this.buf = buf;
        this.offset = 0;
    }
    
    read(length) {
        return buf.slice(this.offset, this.offset + length);        
    }
    
    setOffset(offset) {
        this.offset = offset;
    }
    
    invRead(length) {
        this.offset -= length;
        return buf.slice(this.offset, this.offset + length);  
    }
       
}

module.exports = {BufferStream};