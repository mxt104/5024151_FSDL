function getMessage(callback) {
  setTimeout(() => {
    callback("Notes loaded successfully");
  }, 1000);
}

getMessage((msg) => {
  console.log(msg);
});