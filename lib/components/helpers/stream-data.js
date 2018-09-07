class StreamData {
  static msgArray (length) {
    const arr = []
    for (let i = 0; i < length; ++i) {
      arr.push({ data: i })
    }
    return arr
  }
}

module.exports = StreamData
