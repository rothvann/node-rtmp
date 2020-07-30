
class BufferStream {
  constructor(size) {
    this.buffer = Buffer.alloc(size);
    this.size = size;
    this.readPosition = 0;
    this.length = 0;
  }

  write(buffer) {
    if (this.length + buffer.length > this.size) {
      throw Error('Buffer stream overwritten');
    }
    const writeStart = (this.readPosition + this.length) % this.size;
    if (writeStart + buffer.length >= this.size) {
      const bytesCopied = buffer.copy(this.buffer, writeStart, 0);
      buffer.copy(this.buffer, 0, bytesCopied);
    } else {
      buffer.copy(this.buffer, writeStart, 0);
    }
    this.length += buffer.length;
  }

  readUIntBE(offset, byteSize) {
    if (this.readPosition + offset + byteSize >= this.size) {
      // slice and read
      this.slice(offset, offset + byteSize).readUIntBE(0, byteSize);
    }
    return this.buffer.readUIntBE((this.readPosition + offset) % this.size, byteSize);
  }

  readUIntLE(offset, byteSize) {
    if (this.readPosition + offset + byteSize >= this.size) {
      // slice and read
      this.slice(offset, offset + byteSize).readUIntLE(0, byteSize);
    }
    return this.buffer.readUIntLE((this.readPosition + offset) % this.size, byteSize);
  }

  slice(start, end) {
    const length = end - start;
    if (length > this.length) {
      throw Error('Buffer stream can\'t slice more than size of buffer');
    }
    const newBuffer = Buffer.alloc(length);
    if (this.readPosition + length > this.size) {
      const bytesCopied = this.buffer.copy(newBuffer, 0, this.readPosition + start);
      this.buffer.copy(newBuffer, bytesCopied, 0);
    } else {
      this.buffer.copy(newBuffer, 0, this.readPosition + start);
    }
    return newBuffer;
  }

  read(byteSize) {
    this.readPosition = (this.readPosition + byteSize) % this.size;
    this.length = Math.max(this.length - byteSize, 0);
  }
}

module.exports = BufferStream;
